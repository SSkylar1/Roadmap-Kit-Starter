import fs from "node:fs";
import yaml from "yaml";
import fg from "fast-glob";
import { execSync, spawnSync } from "node:child_process";

const rc = fs.existsSync(".roadmaprc.json") ? JSON.parse(fs.readFileSync(".roadmaprc.json","utf8")) : {};
const ENV = process.env.ROADMAP_ENV || rc.verify?.defaultEnv || "dev";
const READ_ONLY_URL = process.env.READ_ONLY_CHECKS_URL || rc.envs?.[ENV]?.READ_ONLY_CHECKS_URL || "";

const readRoadmap = () => yaml.parse(fs.readFileSync("docs/roadmap.yml","utf8"));

const grep = (patterns, files) => {
  const out = [];
  const res = new RegExp(patterns.join("|"));
  for (const f of files) {
    try {
      const t = fs.readFileSync(f, "utf8");
      if (res.test(t)) out.push(f);
    } catch {}
  }
  return out;
};

const httpOk = async (url, must=[]) => {
  const r = await fetch(url);
  const text = await r.text();
  const ok = r.ok && (must.length ? must.every(m => new RegExp(m).test(text)) : true);
  return { ok, detail: ok ? "" : `HTTP ${r.status}` };
};

const sqlExists = async (symbol) => {
  if (!READ_ONLY_URL) return { ok:false, detail:"READ_ONLY_CHECKS_URL not set" };
  const r = await fetch(READ_ONLY_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: symbol })
  });
  const text = await r.text();
  let ok = false;
  try { ok = !!(JSON.parse(text)?.ok); } catch {}
  return { ok, detail: ok ? "" : text.slice(0,120) };
};

const supaFnExists = (name) => {
  try {
    const out = execSync("supabase functions list", { encoding:"utf8" });
    const ok = out.split("\n").some(l => l.includes(name));
    return { ok, detail: ok ? "" : "not listed" };
  } catch (e) {
    return { ok:false, detail:"supabase CLI not available" };
  }
};

const testPass = (command, must=[]) => {
  const res = spawnSync(command, { shell:true, encoding:"utf8" });
  if (res.status !== 0) return { ok:false, detail:`exit ${res.status}` };
  const ok = must.length ? must.every(m => new RegExp(m).test(res.stdout)) : true;
  return { ok, detail: ok ? "" : "must_match failed" };
};

const main = async () => {
  const plan = readRoadmap();
  const status = { generated_at: new Date().toISOString(), env: ENV, weeks: [] };

  for (const wk of plan.weeks || []) {
    const wkOut = { title: wk.title, id: wk.id, items: [] };
    for (const it of wk.items || []) {
      const checks = it.checks || [];
      const results = [];
      for (const c of checks) {
        if (c.type === "files_exist") {
          const patterns = c.globs || c.files || [];
          const matches = [];
          const missing = [];

          for (const pattern of patterns) {
            const files = await fg(pattern, { dot:true, ignore:["**/node_modules/**",".git/**"] });
            if (files.length) {
              matches.push(...files);
            } else {
              missing.push(pattern);
            }
          }

          let detail = "no patterns";
          let ok = false;

          if (patterns.length) {
            ok = missing.length === 0;
            detail = ok
              ? matches.slice(0,5).join(", ")
              : `missing: ${missing.join(", ")}`;
          }

          results.push({ type:c.type, ok, detail });
        }
        if (c.type === "code_search") {
          const files = await fg(["**/*.*","!**/node_modules/**","!**/.git/**"], { dot:false });
          const hits = grep(c.patterns, files);
          results.push({ type:c.type, ok: hits.length > 0, detail: hits.slice(0,5).join(", ") });
        }
        if (c.type === "test_pass") {
          results.push({ type:c.type, ...testPass(c.command, c.must_match || []) });
        }
        if (c.type === "http_ok") {
          results.push({ type:c.type, ...(await httpOk(c.url, c.must_match || [])) });
        }
        if (c.type === "sql_exists") {
          results.push({ type:c.type, ...(await sqlExists(c.query)) });
        }
        if (c.type === "supa_fn_exists") {
          results.push({ type:c.type, ...(supaFnExists(c.name)) });
        }
      }
      const done = results.every(r => r.ok);
      wkOut.items.push({ id: it.id, name: it.name, done, checks: results });
    }
    status.weeks.push(wkOut);
  }

  fs.writeFileSync(
    "docs/roadmap-status.json",
    `${JSON.stringify(status, null, 2)}\n`,
    "utf8"
  );

  const totals = status.weeks.reduce(
    (acc, wk) => {
      acc.total += wk.items.length;
      acc.done += wk.items.filter((it) => it.done).length;
      return acc;
    },
    { done: 0, total: 0 }
  );

  const ratio = totals.total ? totals.done / totals.total : 0;
  const color = ratio >= 1 ? "#2ea44f" : ratio >= 0.5 ? "#dfb317" : "#d73a49";
  const label = "roadmap";
  const message = `${totals.done}/${totals.total} done`;
  const charWidth = 6;
  const padding = 20;
  const labelWidth = Math.max(padding, label.length * charWidth + padding);
  const valueWidth = Math.max(padding, message.length * charWidth + padding);
  const width = labelWidth + valueWidth;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="Roadmap status: ${message}">` +
    `<title>Roadmap status: ${message}</title>` +
    `<linearGradient id="smooth" x2="0" y2="100%">` +
    `<stop offset="0" stop-color="#fff" stop-opacity=".7"/>` +
    `<stop offset=".1" stop-color="#aaa" stop-opacity=".1"/>` +
    `<stop offset=".9" stop-color="#000" stop-opacity=".3"/>` +
    `<stop offset="1" stop-color="#000" stop-opacity=".5"/>` +
    `</linearGradient>` +
    `<mask id="round">` +
    `<rect width="${width}" height="20" rx="3" fill="#fff"/>` +
    `</mask>` +
    `<g mask="url(#round)">` +
    `<rect width="${labelWidth}" height="20" fill="#555"/>` +
    `<rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>` +
    `<rect width="${width}" height="20" fill="url(#smooth)"/>` +
    `</g>` +
    `<g fill="#fff" text-anchor="middle" ` +
    `font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">` +
    `<text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>` +
    `<text x="${labelWidth / 2}" y="14">${label}</text>` +
    `<text x="${labelWidth + valueWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${message}</text>` +
    `<text x="${labelWidth + valueWidth / 2}" y="14">${message}</text>` +
    `</g>` +
    `</svg>\n`;

  fs.writeFileSync("docs/roadmap-status.svg", svg, "utf8");

  const lines = ["# Roadmap Status", "", `Generated: ${status.generated_at} (env: ${ENV})`, ""];
  for (const w of status.weeks) {
    lines.push(`## ${w.title}`);
    for (const it of w.items) lines.push(`- ${it.done ? "✅" : "❌"} **${it.name}** (\`${it.id}\`)`);
    lines.push("");
  }
  fs.writeFileSync("docs/roadmap-status.md", `${lines.join("\n")}\n`, "utf8");
  console.log("Updated docs/roadmap-status.json & .md");
};

main().catch(e => { console.error(e); process.exit(1); });
