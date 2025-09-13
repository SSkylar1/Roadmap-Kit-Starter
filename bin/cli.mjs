#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const [, , cmd = "init", ...argv] = process.argv;

const parseFlags = (xs) => {
  const f = {};
  for (let i=0;i<xs.length;i++){
    const a=xs[i]; if(!a.startsWith("--")) continue;
    const k=a.slice(2); const v = (xs[i+1]?.startsWith?.("--") || xs[i+1]==null) ? true : xs[++i];
    f[k]=v;
  } return f;
};
const flags = parseFlags(argv);

const run = async () => {
  if (cmd === "init")  return (await import("./init.mjs")).default(flags);
  if (cmd === "verify")return (await import("./verify.mjs")).default(flags);
  if (cmd === "doctor")return (await import("./doctor.mjs")).default(flags);
  console.error(`Unknown command: ${cmd}`); process.exit(2);
};
run();
