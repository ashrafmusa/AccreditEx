const fs = require('fs');
const projects = JSON.parse(fs.readFileSync('src/data/projects.json', 'utf8'));

// Show key fields from first 3 projects
projects.slice(0, 3).forEach((p, i) => {
  console.log(`\nProject ${i+1}: ${p.name}`);
  console.log(`  startDate: ${p.startDate}`);
  console.log(`  createdAt: ${p.createdAt}`);
  console.log(`  updatedAt: ${p.updatedAt}`);
});

// Verify all have timestamps
const allHaveTimestamps = projects.every(p => p.createdAt && p.updatedAt);
console.log(`\n✅ All projects have timestamps: ${allHaveTimestamps}`);
console.log(`✅ Total projects with timestamps: ${projects.filter(p => p.createdAt && p.updatedAt).length} of ${projects.length}`);
