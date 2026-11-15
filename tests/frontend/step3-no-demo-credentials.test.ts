import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const FORBIDDEN_CREDENTIAL_PATTERNS = [
  '1234',
  'Admin@1234',
  'College@1234',
  'Trainer@1234',
  'Student@1234',
];

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else if (entry.isFile()) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

describe('Step 3 (P2-02): Zero Demo Credentials in src/', () => {
  it('src/ directory must not contain 1234 or role demo passwords', () => {
    const srcDir = path.resolve(process.cwd(), 'src');
    const allSrcFiles = getAllFiles(srcDir);
    const violations: { file: string; match: string; line: number }[] = [];

    for (const filePath of allSrcFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i];
        for (const pattern of FORBIDDEN_CREDENTIAL_PATTERNS) {
          if (lineText.includes(pattern)) {
            violations.push({
              file: path.relative(process.cwd(), filePath),
              match: pattern,
              line: i + 1,
            });
          }
        }
      }
    }

    assert.equal(
      violations.length,
      0,
      `Forbidden demo credential strings detected in src/:\n` +
        violations.map((v) => `  ${v.file}:${v.line} matches "${v.match}"`).join('\n')
    );
  });

  it('built client bundle sources must not contain role demo passwords', () => {
    const nextStaticDir = path.resolve(process.cwd(), '.next/static');
    if (!fs.existsSync(nextStaticDir)) {
      return;
    }
    const bundleFiles = getAllFiles(nextStaticDir).filter((f) => f.endsWith('.js'));
    const violations: { file: string; match: string }[] = [];
    for (const filePath of bundleFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      for (const pattern of ['Admin@1234', 'College@1234', 'Trainer@1234', 'Student@1234']) {
        if (content.includes(pattern)) {
          violations.push({
            file: path.relative(process.cwd(), filePath),
            match: pattern,
          });
        }
      }
    }
    assert.equal(
      violations.length,
      0,
      `Forbidden demo credential strings detected in built client bundle:\n` +
        violations.map((v) => `  ${v.file} matches "${v.match}"`).join('\n')
    );
  });
});
