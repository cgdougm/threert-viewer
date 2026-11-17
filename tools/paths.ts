import { basename, join, relative, resolve } from "node:path";

/** This project's root: asset URIs in scenes (e.g. "test-models/car.glb") resolve against it. */
export const projectRoot = resolve(import.meta.dirname, "..");
/** The ThreeRT checkout. */
export const engineRoot = join(projectRoot, "engine");
/** Whether a scene lives in the engine checkout (its asset URIs then resolve against engine/). */
export const inEngine = (src: string) => !relative(engineRoot, resolve(src)).startsWith("..");
/** scenes/foo.ts -> "foo"; engine/scenes/foo.ts -> "engine-foo", so the two never share out/<id>.png or a bundle. */
export const sceneId = (src: string) => (inEngine(src) ? "engine-" : "") + basename(src).replace(/(\.game)?\.[jt]s$/, "");
export const bundleOut = (src: string) => join(projectRoot, "out/bundles", `${sceneId(src)}.js`);
