const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(file));
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walkDir('./src');
let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/select\(\'([^\']*?)offices\(/g, "select('$1offices!users_office_id_fkey(");
  newContent = newContent.replace(/select\(\`([^\`]*?)offices\(/g, "select(`$1offices!users_office_id_fkey(");
  // Also handle multiline selects like in students/[id]
  newContent = newContent.replace(/offices\((.*?)\),/g, "offices!users_office_id_fkey($1),");
  
  // Actually a safer simple regex that targets the specific Supabase select syntax:
  // Replacing "*, offices(" -> "*, offices!users_office_id_fkey("
  // Replacing ", offices(" -> ", offices!users_office_id_fkey("
  // Since we also have multiline selects that might look like "      offices(id, name),"
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    changedFiles++;
    console.log(`Updated: ${file}`);
  }
});

console.log(`Done! Updated ${changedFiles} files.`);
