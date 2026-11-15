// Runs the ThreeRT path tracer (engine/renderer, built with `npm run build:renderer`) on a scene.
//   node tools/rt.ts play   scenes/abarth.ts                 window: drag orbit, right-drag pan, wheel zoom, WASD/QE fly, R reset, P snapshot, I stats
//   node tools/rt.ts render scenes/abarth.ts [--spp 64]      -> out/<id>.png
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { bundle } from "./bundle.ts";
import { engineRoot, projectRoot, sceneId } from "./paths.ts";

const [mode, src, ...rest] = process.argv.slice(2);
if (!mode || !src || !["play", "render", "live", "info"].includes(mode)) {
  console.error("usage: node tools/rt.ts <play|render|live|info> <scene.ts> [renderer flags...]");
  process.exit(2);
}
const exe = join(engineRoot, "renderer/target/release", process.platform === "win32" ? "threert-render.exe" : "threert-render");
if (!existsSync(exe)) (console.error(`no renderer at ${exe}\nbuild it first: npm run build:renderer`), process.exit(1));

const out = await bundle(src);
// Asset URIs resolve against one root: engine/ for the engine's own scenes (assets/...), this project otherwise.
const inEngine = !relative(engineRoot, resolve(src)).startsWith("..");
const args = [mode, out, "--assets", inEngine ? engineRoot : projectRoot, ...rest];
if (mode === "render" && !rest.includes("-o")) {
  mkdirSync(join(projectRoot, "out"), { recursive: true });
  args.push("-o", join(projectRoot, "out", `${sceneId(src)}.png`));
}
console.log(`threert-render ${args.join(" ")}`);
// The window prints a stats line twice a second; quiet unless THREERT_STATS is set (I toggles it in the window).
const env = { ...process.env, THREERT_STATS: process.env.THREERT_STATS ?? "0" };
process.exit(spawnSync(exe, args, { stdio: "inherit", cwd: projectRoot, env }).status ?? 1);
