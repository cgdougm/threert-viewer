// Opens a scene in plain three.js in the browser (the engine's interactive view), serving this project's files
// (test-models/, ...) first and the engine checkout's (presets/, the bundled page) second.
//   node tools/view.ts scenes/abarth.ts [--port 8123] [--no-open]
// Rebundles on every page reload, so edit the scene and press F5.
//
// (The engine's own tools/three/open.ts does the same, but its file server rejects Windows paths.)
import { spawn } from "node:child_process";
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, relative, resolve } from "node:path";
import { bundlePage } from "../engine/tools/three/browser.ts";
import { engineRoot, projectRoot, sceneId } from "./paths.ts";

const args = process.argv.slice(2);
const src = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--port");
if (!src) (console.error("usage: node tools/view.ts <scene.ts> [--port N] [--no-open]"), process.exit(2));
const port = args.includes("--port") ? Number(args[args.indexOf("--port") + 1]) : 8123;
const id = `${sceneId(src)}-view`;
const build = () => bundlePage(id, resolve(src), join(engineRoot, "tools/three/view.ts"));
const { html } = await build();

const TYPES: Record<string, string> = {
  ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".ktx2": "image/ktx2", ".hdr": "application/octet-stream",
  ".glb": "model/gltf-binary", ".gltf": "model/gltf+json", ".bin": "application/octet-stream", ".wasm": "application/wasm",
};
const inside = (dir: string, file: string) => { const r = relative(dir, file); return !!r && !r.startsWith("..") && !r.includes(":"); };

createServer(async (req, res) => {
  try {
    const url = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
    const path = normalize(url.replace(/^\/+/, ""));
    if (url === html) await build().catch((e) => console.error(String(e)));
    const file = [projectRoot, engineRoot].map((d) => join(d, path)).find((f, i) => inside(i ? engineRoot : projectRoot, f) && existsSync(f) && statSync(f).isFile());
    if (!file) return void res.writeHead(404).end();
    res.writeHead(200, { "content-type": TYPES[extname(file).toLowerCase()] ?? "application/octet-stream", "content-length": statSync(file).size, "cache-control": "no-store" });
    createReadStream(file).pipe(res);
  } catch (e) {
    res.writeHead(500).end(String(e));
  }
}).listen(port, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${port}${html}`;
  console.log(`${src} in three.js:\n  ${url}\n(F5 rebundles; Ctrl-C to stop)`);
  if (!args.includes("--no-open")) {
    const [cmd, a] = process.platform === "win32" ? ["cmd", ["/c", "start", "", url]] : [process.platform === "darwin" ? "open" : "xdg-open", [url]];
    spawn(cmd, a, { stdio: "ignore", detached: true }).on("error", () => {}).unref();
  }
});
