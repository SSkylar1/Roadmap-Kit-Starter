#!/usr/bin/env node
/**
 * Generate a redacted "context pack" from the repo:
 * - Reads allow/deny patterns from docs/redaction-rules.yml and .chatignore
 * - Walks the repo, collecting small/important files (code/docs)
 * - Produces:
 *    - docs/context/context-pack.json
 *    - docs/context/summary.md
 *
 * No secrets included (deny rules win).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import fg from 'fast-glob';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'docs', 'context');
fs.mkdirSync(OUT_DIR, { recursive: true });

const tryRead = (p) => {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
};

function parseChatignore(text) {
  return text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));
}

function loadRedactionRules() {
  const fromYaml = tryRead(path.join(ROOT, 'docs', 'redaction-rules.yml'));
  let deny = [], allow = [];
  if (fromYaml) {
    const y = yaml.load(fromYaml) || {};
    deny = Array.isArray(y.deny) ? y.deny : [];
    allow = Array.isArray(y.allow) ? y.allow : [];
  }
  const chatignore = parseChatignore(tryRead(path.join(ROOT, '.chatignore')));
  // combine: deny from yaml + .chatignore (deny wins over allow)
  const denyCombined = Array.from(new Set([...deny, ...chatignore]));
  // provide a sane default allow if none
  if (allow.length === 0) allow = ['docs/**', 'src/**', 'app/**', 'packages/**', '**/*.md', '**/*.mdx'];
  return { deny: denyCombined, allow };
}

function sha256(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

function truncate(s, max = 2000) {
  if (s.length <= max) return s;
  return s.slice(0, max) + `\n/* …truncated (${s.length - max} bytes) … */\n`;
}

function isTexty(file) {
  return /\.(md|mdx|txt|json|yml|yaml|ts|tsx|js|jsx|mjs|cjs|go|py|rb|rs|java|kt|swift|php|sql|css|scss|less)$/i.test(file);
}

function sizeOk(bytes) {
  // skip huge files; we just want context, not blobs
  return bytes > 0 && bytes <= 200 * 1024; // 200KB max per file in pack
}

async function main() {
  const { deny, allow } = loadRedactionRules();

  // Glob with allow, then filter deny
  const allowedFiles = await fg(allow, {
    dot: false,
    ignore: deny,
    cwd: ROOT,
    onlyFiles: true,
    followSymbolicLinks: false,
    unique: true,
    absolute: false,
  });

  // Exclude generated/obvious noise
  const blacklist = new Set([
    'docs/context/context-pack.json',
    'docs/context/summary.md',
    'docs/roadmap-status.json',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
  ]);

  const entries = [];
  for (const rel of allowedFiles) {
    if (blacklist.has(rel)) continue;
    const abs = path.join(ROOT, rel);
    let stat;
    try { stat = fs.statSync(abs); } catch { continue; }
    if (!stat.isFile()) continue;
    if (!isTexty(rel)) continue;
    if (!sizeOk(stat.size)) continue;

    const content = tryRead(abs);
    if (!content) continue;

    entries.push({
      path: rel,
      bytes: Buffer.byteLength(content, 'utf8'),
      sha256: sha256(content),
      preview: truncate(content, 1500), // short, redacted preview to keep pack small
    });
  }

  const pack = {
    version: 1,
    generated_at: new Date().toISOString(),
    redaction_rules: { allow, deny },
    files: entries,
  };

  // Write artifacts
  fs.writeFileSync(path.join(OUT_DIR, 'context-pack.json'), JSON.stringify(pack, null, 2), 'utf8');

  // Write a human summary
  const top = entries
    .slice(0, 25)
    .map(e => `- ${e.path} (${e.bytes} bytes)`)
    .join('\n');

  const summary = `# Context Summary\n\nGenerated: ${pack.generated_at}\n\nTop files included:\n\n${top}\n\n_Total files in pack: ${entries.length}_\n`;
  fs.writeFileSync(path.join(OUT_DIR, 'summary.md'), summary, 'utf8');

  console.log(`Context pack written to docs/context/context-pack.json (${entries.length} files).`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
