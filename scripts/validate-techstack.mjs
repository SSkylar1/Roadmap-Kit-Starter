// scripts/validate-techstack.mjs
import fs from "node:fs";
import yaml from "yaml";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

// Load draft-07 meta-schema in Node 20 (no import assertions)
const draft7 = JSON.parse(
  fs.readFileSync("node_modules/ajv/dist/refs/json-schema-draft-07.json", "utf8")
);

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
ajv.addMetaSchema(draft7);

// Adjust this path if your schema file is named differently
const schemaPath = "schema/tech-stack.schema.json";
const techStackSchema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
const techStack = yaml.parse(fs.readFileSync("docs/tech-stack.yml", "utf8"));

// Optional: simple sanity checks
if (!techStack || typeof techStack !== "object") {
  console.error("tech-stack.yml is empty or not an object");
  process.exit(1);
}

const validate = ajv.compile(techStackSchema);
if (!validate(techStack)) {
  console.error("Tech stack schema errors:");
  for (const e of validate.errors) {
    console.error(" •", e.instancePath || "/", e.message);
  }
  process.exit(1);
}

console.log("tech-stack.yml ✔");

