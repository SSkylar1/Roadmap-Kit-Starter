import fs from "node:fs";
import yaml from "yaml";

const pkg = fs.existsSync("package.json") ? JSON.parse(fs.readFileSync("package.json","utf8")) : {};
const deps = Object.keys(pkg.dependencies || {});
const devDeps = Object.keys(pkg.devDependencies || {});
const workflows = fs.existsSync(".github/workflows")
  ? fs.readdirSync(".github/workflows").filter(f => f.endsWith(".yml") || f.endsWith(".yaml"))
  : [];

const stack = {
  app: { framework: deps.includes("next") ? "next" : deps.includes("expo") ? "expo" : "node", deps, devDeps },
  ci_cd: { workflows },
  generated_at: new Date().toISOString()
};

fs.writeFileSync("docs/tech-stack.yml", yaml.stringify(stack), "utf8");
console.log("Updated docs/tech-stack.yml");
