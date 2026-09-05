const fs = require('fs');
const path = require('path');

const projectPath = __dirname ? path.resolve(__dirname, '..') : process.cwd();

console.log('Checking project files...');

const reportsPagePath = path.join(projectPath, 'app', 'reports', 'page.tsx');
if (!fs.existsSync(reportsPagePath)) {
  console.error('ERROR: app/reports/page.tsx does not exist at ' + reportsPagePath);
  process.exit(1);
}

const content = fs.readFileSync(reportsPagePath, 'utf8');

let errors = [];

if (!content.includes('crossInstitutionIntelligence: Building2')) {
  errors.push('FAIL: crossInstitutionIntelligence missing in criteriaIcons');
}
if (!content.includes('socialEngineering: PhoneCall')) {
  errors.push('FAIL: socialEngineering missing in criteriaIcons');
}
if (!content.includes('criteriaIcons[key as keyof typeof criteriaIcons] || ShieldAlert')) {
  errors.push('FAIL: ShieldAlert fallback missing in CriteriaBar');
}
if (!content.includes('txn.ruleFlags || []')) {
  errors.push('FAIL: ruleFlags guard missing in generatePDFContent/downloadPDF');
}

if (errors.length > 0) {
  console.error('Verification failed:\n' + errors.join('\n'));
  process.exit(1);
} else {
  console.log('SUCCESS: All Reports page safety guards, icons, and PDF export checks passed!');
}
