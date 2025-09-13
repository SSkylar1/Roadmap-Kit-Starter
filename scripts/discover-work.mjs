import fs from "node:fs";
import yaml from "yaml";
import { execSync } from "node:child_process";

const since = process.env.DISCOVER_SINCE || "HEAD~50";
let files = [];
try {
  files = execSync(`git diff --name-only ${since}...HEAD`, { encoding:"utf8" })
    .split("\n").filter(Boolean);
} catch {}

const guess = files
  .filter(f => f.match(/\.(ts|tsx|js|py|go|sql|yml|yaml|md)$/))
  .slice(0, 200)
  .map(f => ({ file: f, note: "recently changed" }));

const out = { discovered_at: new Date().toISOString(), items: guess };

fs.writeFileSync("docs/backlog-discovered.yml", yaml.stringify(out), "utf8");
console.log("Updated docs/backlog-discovered.yml");
