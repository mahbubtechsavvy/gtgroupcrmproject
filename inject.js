const fs = require('fs');
const file = 'src/app/dashboard/page.jsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('ExecutiveCommandCenter')) {
  content = content.replace("import styles from './dashboard.module.css';", "import styles from './dashboard.module.css';\nimport ExecutiveCommandCenter from '@/components/dashboard/ExecutiveCommandCenter';");
}

const lines = content.split('\n');
const returnIndex = lines.findIndex((line, i) => i > 500 && line.trim() === 'return (');

if (returnIndex !== -1) {
  const topHalf = lines.slice(0, returnIndex).join('\n');
  const newReturn = `  return (
    <ExecutiveCommandCenter 
      superAdmin={superAdmin}
      user={user}
      router={router}
      stats={stats}
      revenueData={revenueData}
      tasks={tasks}
      handleToggleTask={(id) => {
        const t = tasks.find(task => task.id === id);
        if (t) handleToggleTask(id, t.is_completed);
      }}
      recentActivity={recentActivity}
    />
  );
}`;
  fs.writeFileSync(file, topHalf + '\n' + newReturn);
  console.log('Successfully injected ExecutiveCommandCenter into page.jsx');
} else {
  console.log('Return statement not found');
}
