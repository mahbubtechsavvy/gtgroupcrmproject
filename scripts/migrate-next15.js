const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      traverse(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      processFile(filePath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Replace createServerSupabaseClient() with await createServerSupabaseClient()
  // Matches calls not preceded by await
  const clientRegex = /(?<!await\s+)createServerSupabaseClient\(\)/g;
  if (clientRegex.test(content)) {
    content = content.replace(clientRegex, 'await createServerSupabaseClient()');
    changed = true;
    console.log(`[CLIENT CLIENT] Updated createServerSupabaseClient call in ${path.relative(srcDir, filePath)}`);
  }

  // 2. Replace cookies() with await cookies()
  // Matches cookies() calls not preceded by await
  // Skip supabase-server.js itself which we already updated
  if (!filePath.endsWith('supabase-server.js')) {
    const cookiesRegex = /(?<!await\s+)cookies\(\)/g;
    if (cookiesRegex.test(content)) {
      content = content.replace(cookiesRegex, 'await cookies()');
      changed = true;
      console.log(`[COOKIES] Updated cookies() call in ${path.relative(srcDir, filePath)}`);
    }
  }

  // 3. Replace destructuring/assignment of params in dynamic route handlers
  // Matches e.g. "const { id } = params;" -> "const { id } = await params;"
  const destructureRegex = /(const|let|var)\s+(\{[^}]+\})\s*=\s*params;/g;
  if (destructureRegex.test(content)) {
    content = content.replace(destructureRegex, '$1 $2 = await params;');
    changed = true;
    console.log(`[PARAMS DESTRUCTURE] Updated params destructuring in ${path.relative(srcDir, filePath)}`);
  }

  // Matches e.g. "const id = params.id;" -> "const id = (await params).id;"
  const dotRegex = /(const|let|var)\s+(\w+)\s*=\s*params\.(\w+);/g;
  if (dotRegex.test(content)) {
    content = content.replace(dotRegex, '$1 $2 = (await params).$3;');
    changed = true;
    console.log(`[PARAMS DOT] Updated params dot access in ${path.relative(srcDir, filePath)}`);
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

console.log('Starting migration to Next.js 15 async APIs...');
traverse(srcDir);
console.log('Migration complete!');
