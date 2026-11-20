// Runs the ThreeRT path tracer (engine/renderer, built with `npm run build:renderer`) on a scene.
//   node tools/rt.ts play   scenes/abarth.ts                 window: drag orbit, right-drag pan, wheel zoom, WASD/QE fly, R reset, P snapshot, I stats
//   node tools/rt.ts render scenes/abarth.ts [--spp 64]      -> out/<id>.png  (engine scenes: out/engine-<id>.png)
//   node tools/rt.ts play   model.glb [--scale 0.01]          a .glb/.gltf on a floor under the sky (tools/model.ts)
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { bundle } from "./bundle.ts";
import { modelScene } from "./model.ts";
import { engineRoot, inEngine, projectRoot, sceneId } from "./paths.ts";

const [mode, arg, ...rest] = process.argv.slice(2);
if (!mode || !arg || !["play", "render", "live", "info"].includes(mode)) {
  console.error("usage: node tools/rt.ts <play|render|live|info> <scene.ts | model.glb> [--scale k] [renderer flags...]");
  process.exit(2);
}
// A model file gets a generated scene; --scale is ours, not the renderer's.
const si = rest.indexOf("--scale");
const scale = si >= 0 ? Number(rest.splice(si, 2)[1]) : 1;
if (!(scale > 0)) (console.error("--scale wants a positive number"), process.exit(2));
const src = /\.(glb|gltf)$/i.test(arg) ? modelScene(arg, scale) : arg;
const exe = join(engineRoot, "renderer/target/release", process.platform === "win32" ? "threert-render.exe" : "threert-render");
if (!existsSync(exe)) (console.error(`no renderer at ${exe}\nbuild it first: npm run build:renderer`), process.exit(1));

const out = await bundle(src);
// Asset URIs resolve against one root: engine/ for the engine's own scenes (assets/...), this project otherwise.
const args = [mode, out, "--assets", inEngine(src) ? engineRoot : projectRoot, ...rest];
if (mode === "render" && !rest.includes("-o")) {
  mkdirSync(join(projectRoot, "out"), { recursive: true });
  args.push("-o", join(projectRoot, "out", `${sceneId(src)}.png`));
}
console.log(`threert-render ${args.join(" ")}`);
// The window prints a stats line twice a second; quiet unless THREERT_STATS is set (I toggles it in the window).
const env = { ...process.env, THREERT_STATS: process.env.THREERT_STATS ?? "0" };
process.exit(spawnSync(exe, args, { stdio: "inherit", cwd: projectRoot, env }).status ?? 1);
