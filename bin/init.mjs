#!/usr/bin/env node
import fs from "fs-extra";
import path from "node:path";
import chalk from "chalk";

export default async function run(flags = {}) {
  console.log(chalk.green("Roadmap Kit is ready."));
  console.log("Edit docs/roadmap.yml and .roadmaprc.json, then run:");
  console.log("  npm run schema:roadmap && npm run stack:scan && npm run roadmap:check");
}
