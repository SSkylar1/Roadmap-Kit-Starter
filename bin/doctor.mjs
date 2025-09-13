#!/usr/bin/env node
import fs from "node:fs";

const rc = fs.existsSync(".roadmaprc.json") ? JSON.parse(fs.readFileSync(".roadmaprc.json","utf8")) : {};
const envName = process.env.ROADMAP_ENV || rc.verify?.defaultEnv || "dev";
const readOnly = process.env.READ_ONLY_CHECKS_URL || rc.envs?.[envName]?.READ_ONLY_CHECKS_URL || "";
const symbols = (process.env.VERIFY_SYMBOLS?.split(",") || rc.verify?.symbols || []);

console.log("\nRoadmap Kit — Doctor");
console.log("--------------------");
console.log("Env:", envName);
console.log("READ_ONLY_CHECKS_URL:", readOnly || "(not set)");
console.log("Symbols:", symbols.join(", ") || "(none)");

if (readOnly) {
  try {
    const r = await fetch(readOnly, { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ query: symbols[0] || "ext:pgcrypto" }) });
    const t = await r.text();
    const ok = r.ok && /"ok"\s*:\s*true/.test(t);
    console.log(`${ok ? "✅" : "❌"} read_only_checks — ${ok ? "OK" : t.slice(0,120)}`);
  } catch (e) {
    console.log("❌ read_only_checks —", String(e));
  }
}
