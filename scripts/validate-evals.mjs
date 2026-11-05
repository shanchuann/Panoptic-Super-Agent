import fs from "node:fs";

const file = process.argv[2] || ".ome/evals/tasks.jsonl";
const raw = fs.readFileSync(file, "utf8").split(/\r?\n/).filter((l) => l.trim().length > 0);

const REQUIRED = ["id", "title", "category", "prompt", "deliverable", "criteria", "duration_band", "timeout_min", "max_cost_cny", "tools_allowed", "difficulty", "verifier"];
const OPTIONAL = ["notes"];
const ENUMS = {
  category: ["research", "code", "data", "doc", "web", "ops"],
  difficulty: ["easy", "medium", "hard"],
  verifier: ["script", "script+human", "human"],
  duration_band: ["<45m", "45-163m", ">163m"],
};
const errs = [];
const ids = new Set();
const counts = { categories: {}, bands: {}, difficulties: {} };

raw.forEach((line, i) => {
  const at = "line " + (i + 1);
  let o;
  try { o = JSON.parse(line); } catch { errs.push(at + ": JSON parse error"); return; }
  for (const k of REQUIRED) if (!(k in o)) errs.push(at + ": missing " + k);
  for (const k of OPTIONAL) if (k in o && typeof o[k] !== "string") errs.push(at + ": bad optional " + k);
  if (typeof o.id !== "string" || !/^TASK-\d{3}$/.test(o.id)) errs.push(at + ": bad id " + o.id);
  if (ids.has(o.id)) errs.push(at + ": duplicate id " + o.id);
  ids.add(o.id);
  for (const [k, vals] of Object.entries(ENUMS)) if (o[k] !== undefined && !vals.includes(o[k])) errs.push(at + ": bad " + k + "=" + o[k]);
  if (!Array.isArray(o.criteria) || o.criteria.length < 2) errs.push(at + ": criteria needs >=2 items");
  if (!Array.isArray(o.tools_allowed) || o.tools_allowed.length === 0) errs.push(at + ": tools_allowed invalid");
  if (!(typeof o.max_cost_cny === "number" && o.max_cost_cny > 0)) errs.push(at + ": max_cost_cny invalid");
  if (!(typeof o.timeout_min === "number" && o.timeout_min > 0 && o.timeout_min <= 180)) errs.push(at + ": timeout_min invalid (1..180)");
  if (o.category) counts.categories[o.category] = (counts.categories[o.category] || 0) + 1;
  if (o.duration_band) counts.bands[o.duration_band] = (counts.bands[o.duration_band] || 0) + 1;
  if (o.difficulty) counts.difficulties[o.difficulty] = (counts.difficulties[o.difficulty] || 0) + 1;
});

const report = { file, total: raw.length, ...counts, errors: errs };
console.log(JSON.stringify(report, null, 2));
const ok = errs.length === 0 && raw.length >= 20;
console.log("RESULT: " + (ok ? "PASS" : "FAIL"));
process.exit(ok ? 0 : 1);
