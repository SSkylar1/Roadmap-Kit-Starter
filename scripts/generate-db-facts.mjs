#!/usr/bin/env node
/**
 * Generate DB facts by parsing Supabase migrations (no DB access):
 * - Lists tables created
 * - Detects RLS enabled tables
 * - Captures policy names (create policy "...") by table + command
 * - Emits:
 *    - docs/db-facts.json
 *    - docs/db-facts.md
 */
import fs from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';

const ROOT = process.cwd();
const MIG_DIR = path.join(ROOT, 'supabase', 'migrations');
const OUT_JSON = path.join(ROOT, 'docs', 'db-facts.json');
const OUT_MD = path.join(ROOT, 'docs', 'db-facts.md');
fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });

const MIG_GLOBS = ['**/*.sql'];

function slurp(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } }

function parseFacts(sql, file) {
  const facts = { tables: new Set(), rls: new Set(), policies: [] };

  // crude but effective patterns (case-insensitive, ignore whitespace)
  const createTableRe = /create\s+table\s+(?:if\s+not\s+exists\s+)?([\w."]+)/ig;
  const enableRlsRe   = /alter\s+table\s+([\w."]+)\s+enable\s+row\s+level\s+security/ig;
  const policyRe      = /create\s+policy\s+"([^"]+)"\s+on\s+([\w."]+)\s+for\s+(\w+)/ig;

  let m;
  while ((m = createTableRe.exec(sql)) !== null) {
    facts.tables.add(m[1].replace(/"/g, ''));
  }
  while ((m = enableRlsRe.exec(sql)) !== null) {
    facts.rls.add(m[1].replace(/"/g, ''));
  }
  while ((m = policyRe.exec(sql)) !== null) {
    facts.policies.push({
      name: m[1],
      table: m[2].replace(/"/g, ''),
      action: m[3].toLowerCase(),
      source: path.basename(file),
    });
  }

  return facts;
}

function mergeFacts(a, b) {
  for (const t of b.tables) a.tables.add(t);
  for (const r of b.rls) a.rls.add(r);
  a.policies.push(...b.policies);
  return a;
}

async function main() {
  const files = await fg(MIG_GLOBS, { cwd: MIG_DIR, absolute: true });
  const all = files.reduce((acc, f) => mergeFacts(acc, parseFacts(slurp(f), f)),
    { tables: new Set(), rls: new Set(), policies: [] });

  const jsonOut = {
    generated_at: new Date().toISOString(),
    tables: Array.from(all.tables).sort(),
    rls_enabled: Array.from(all.rls).sort(),
    policies: all.policies.sort((x, y) => (x.table + x.name).localeCompare(y.table + y.name)),
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(jsonOut, null, 2), 'utf8');

  const md = [
    `# DB Facts`,
    ``,
    `Generated: ${jsonOut.generated_at}`,
    ``,
    `## Tables (${jsonOut.tables.length})`,
    ...jsonOut.tables.map(t => `- ${t}`),
    ``,
    `## RLS Enabled (${jsonOut.rls_enabled.length})`,
    ...jsonOut.rls_enabled.map(t => `- ${t}`),
    ``,
    `## Policies (${jsonOut.policies.length})`,
    ...jsonOut.policies.map(p => `- **${p.table}** — ${p.action.toUpperCase()} — "${p.name}" _(from ${p.source})_`),
    ``,
  ].join('\n');

  fs.writeFileSync(OUT_MD, md, 'utf8');
  console.log(`DB facts written to docs/db-facts.json (tables=${jsonOut.tables.length}, policies=${jsonOut.policies.length}).`);
}

main().catch(err => { console.error(err); process.exit(1); });
