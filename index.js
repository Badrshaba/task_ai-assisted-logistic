#!/usr/bin/env node
import { execSync } from 'child_process';

const command = process.argv[2];

if (!command) {
  console.log(`
Usage:
  node index.js clean       # تنظيف الطلبات وإنتاج clean_orders.json
  node index.js plan        # تخطيط الكورير وإنتاج plan.json
  node index.js reconcile   # المطابقة مع سجل التسليم وإنتاج reconciliation.json
`);
  process.exit(1);
}

try {
  if (command === 'clean') {
    execSync('node scripts/clean.js', { stdio: 'inherit' });
  } else if (command === 'plan') {
    execSync('node scripts/plan.js', { stdio: 'inherit' });
  } else if (command === 'reconcile') {
    execSync('node scripts/reconcile.js', { stdio: 'inherit' });
  } else {
    console.error(`Unknown command: ${command}`);
  }
} catch (err) {
  console.error('❌ Error running command:', err.message);
  process.exit(1);
}
