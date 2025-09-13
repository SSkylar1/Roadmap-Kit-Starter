import fs from "node:fs";
import yaml from "yaml";
import Ajv from "ajv/dist/2020.js";   // ⬅️ use 2020 build
import addFormats from "ajv-formats";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const schema = JSON.parse(fs.readFileSync("schema/roadmap.schema.json", "utf8"));
const data = yaml.parse(fs.readFileSync("docs/roadmap.yml", "utf8"));

const ids = new Set();
for (const wk of data.weeks || []) {
  for (const it of wk.items || []) {
    if (ids.has(it.id)) { console.error("Duplicate item id:", it.id); process.exit(1); }
    ids.add(it.id);
  }
}

const validate = ajv.compile(schema);
if (!validate(data)) {
  console.error("Roadmap schema errors:");
  for (const e of validate.errors) console.error(" •", e.instancePath || "/", e.message);
  process.exit(1);
}
console.log("roadmap.yml ✔");

