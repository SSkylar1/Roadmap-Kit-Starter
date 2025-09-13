import fs from "node:fs";
import yaml from "yaml";
import Ajv2020 from "ajv/dist/2020.js";        // Ajv v2020 dialect
import addFormats from "ajv-formats";

// Load draft-07 meta-schema manually instead of using import assertions
const draft7 = JSON.parse(
  fs.readFileSync("node_modules/ajv/dist/refs/json-schema-draft-07.json", "utf8")
);

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
ajv.addMetaSchema(draft7);

const schema = JSON.parse(
  fs.readFileSync("schema/roadmap.schema.json", "utf8")
);
const data = yaml.parse(
  fs.readFileSync("docs/roadmap.yml", "utf8")
);

// Ensure IDs are unique
const ids = new Set();
for (const wk of data.weeks || []) {
  for (const it of wk.items || []) {
    if (ids.has(it.id)) {
      console.error("Duplicate item id:", it.id);
      process.exit(1);
    }
    ids.add(it.id);
  }
}

const validate = ajv.compile(schema);
if (!validate(data)) {
  console.error("Roadmap schema errors:");
  for (const e of validate.errors) {
    console.error(" •", e.instancePath || "/", e.message);
  }
  process.exit(1);
}

console.log("roadmap.yml ✔");
