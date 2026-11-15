// Clones the ThreeRT engine into engine/ (or pulls it), applies patches/*.patch, and installs its JS dependencies.
//   node tools/setup.ts
import { execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const run = (cmd: string, cwd = ".") => execSync(cmd, { stdio: "inherit", cwd });
const quiet = (cmd: string, cwd: string) => { try { execSync(cmd, { stdio: "ignore", cwd }); return true; } catch { return false; } };

if (existsSync("engine/.git")) {
  run("git stash", "engine"); // our patches (and anything else local) out of the way of the pull
  run("git pull --ff-only", "engine");
} else run("git clone --depth 1 https://github.com/meshy-dev/ThreeRT.git engine");

for (const p of readdirSync("patches").filter((f) => f.endsWith(".patch")).sort()) {
  const file = resolve("patches", p);
  if (quiet(`git apply --reverse --check "${file}"`, "engine")) console.log(`patch ${p}: already applied`);
  else if (quiet(`git apply "${file}"`, "engine")) console.log(`patch ${p}: applied`);
  else console.warn(`patch ${p}: does not apply (fixed upstream, or needs a refresh)`);
}
run("npm install --no-audit --no-fund", "engine");
console.log("\nengine ready. Next: npm run view -- scenes/abarth.ts   (three.js in the browser)\n            npm run build:renderer                (the path tracer, takes a while)");
