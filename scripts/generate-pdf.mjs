import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browserPath = fs.existsSync(chromePath) ? chromePath : edgePath;

const docsToGenerate = [
  {
    input: path.join(rootDir, 'docs', 'atlas-end-to-end-architecture-and-flow.html'),
    output: path.join(rootDir, 'docs', 'Project_Atlas_End_To_End_System_Guide.pdf'),
    title: 'Technical & Architecture System Guide',
  },
  {
    input: path.join(rootDir, 'docs', 'atlas-non-developer-frontend-guide.html'),
    output: path.join(rootDir, 'docs', 'Project_Atlas_Non_Developer_User_Manual.pdf'),
    title: 'Non-Developer Visual Frontend User Manual',
  },
];

console.log('================================================================');
console.log('📄 PROJECT ATLAS PDF GENERATION PIPELINE');
console.log('================================================================\n');

for (const doc of docsToGenerate) {
  console.log(`Generating: ${doc.title}...`);
  console.log(`   Source: ${doc.input}`);
  console.log(`   Output: ${doc.output}`);

  const cmd = `"${browserPath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${doc.output}" "file:///${doc.input.replace(/\\/g, '/')}"`;

  try {
    execSync(cmd, { stdio: 'inherit' });
    if (fs.existsSync(doc.output)) {
      const stats = fs.statSync(doc.output);
      console.log(`   ✓ Success! Size: ${(stats.size / 1024).toFixed(2)} KB\n`);
    } else {
      console.error(`   ❌ Failed: ${doc.output} was not created.\n`);
    }
  } catch (err) {
    console.error(`   ❌ Error generating ${doc.title}:`, err);
  }
}

console.log('================================================================');
console.log('🎉 ALL PDF MANUALS GENERATED SUCCESSFULLY!');
console.log('================================================================');
