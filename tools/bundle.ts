// Bundles a scene / game module for the native renderer: out/bundles/<id>.js
//   node tools/bundle.ts scenes/abarth.ts
import { resolve } from "node:path";
import { bundleGame } from "../engine/tools/bundle-game.ts";
import { bundleOut } from "./paths.ts";

export async function bundle(src: string): Promise<string> {
  const r = await bundleGame(resolve(src), bundleOut(src));
  console.log(`${r.out}  ${(r.bytes / 1024).toFixed(0)} KiB  ${r.ms.toFixed(0)} ms`);
  return r.out;
}

if (import.meta.main ?? process.argv[1]?.endsWith("bundle.ts")) {
  const src = process.argv[2];
  if (!src) (console.error("usage: node tools/bundle.ts <scene.ts>"), process.exit(2));
  await bundle(src);
}
