import fs from "node:fs";
import yaml from "yaml";
import Ajv from "ajv/dist/2020.js";   // ⬅️ use 2020 build
import addFormats from "ajv-formats";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const schema = JSON.parse(fs.readFileSync("schema/tech-stack.schema.json","utf8"));
const text = fs.readFileSync("docs/tech-stack.yml","utf8");
const data = yaml.parse(text);

const validate = ajv.compile(schema);
if (!validate(data)) {
  console.error("tech-stack.yml errors:");
  for (const e of validate.errors) console.error(" •", e.instancePath || "/", e.message);
  process.exit(1);
}
console.log("tech-stack.yml ✔");

