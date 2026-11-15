import { basename, join, resolve } from "node:path";

/** This project's root: asset URIs in scenes (e.g. "test-models/car.glb") resolve against it. */
export const projectRoot = resolve(import.meta.dirname, "..");
/** The ThreeRT checkout. */
export const engineRoot = join(projectRoot, "engine");
/** scenes/foo.ts -> "foo" */
export const sceneId = (src: string) => basename(src).replace(/(\.game)?\.[jt]s$/, "");
export const bundleOut = (src: string) => join(projectRoot, "out/bundles", `${sceneId(src)}.js`);
