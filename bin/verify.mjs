#!/usr/bin/env node
import fs from "node:fs";

const rc = fs.existsSync(".roadmaprc.json") ? JSON.parse(fs.readFileSync(".roadmaprc.json","utf8")) : {};
const ENV = process.env.ROADMAP_ENV || rc.verify?.defaultEnv || "dev";
const READ_ONLY_URL = process.env.READ_ONLY_CHECKS_URL || rc.envs?.[ENV]?.READ_ONLY_CHECKS_URL || "";
const symbols = (process.env.VERIFY_SYMBOLS?.split(",") || rc.verify?.symbols || []).filter(Boolean);

const pingAllow = async (q) => {
  if (!READ_ONLY_URL) return { ok:false, detail:"READ_ONLY_CHECKS_URL not set" };
  const r = await fetch(READ_ONLY_URL, { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ query:q }) });
  const t = await r.text(); let ok=false; try { ok = !!(JSON.parse(t)?.ok); } catch {}
  return { ok, detail: ok ? "" : t.slice(0,120) };
};

const main = async () => {
  console.log(`Verify env: ${ENV}`);
  for (const s of symbols) {
    const r = await pingAllow(s);
    console.log(`${r.ok ? "✅" : "❌"} ${s}${r.detail ? " — " + r.detail : ""}`);
  }
};
main().catch(e => { console.error(e); process.exit(1); });
