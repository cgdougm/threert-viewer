# threert-viewer

A sandbox for test-driving ThreeRT (https://github.com/meshy-dev/ThreeRT) on Windows. See README.md for commands.

- `engine/` is an upstream clone (gitignored). Work around engine issues in `tools/` when possible. When the engine itself must change, keep the change as `patches/*.patch` (from `cd engine && git diff`). `npm run setup` re-applies patches after a pull.
- `@threert/scene` etc. come from `engine/packages/*` (tsconfig paths + esbuild nodePaths). Don't `npm install` them from npm at the root: a second copy breaks instanceof checks between the runtime and the scene.
- Scene modules: `export default function build()` returning `{ scene, camera, options? }`. Physical units (lux, nits, EV100).
- Asset URIs in scenes are relative to the project root. The renderer gets `--assets <root>`, and the viewer serves the root first, then `engine/`.
- The engine's `tools/three/open.ts` file server rejects Windows paths, which is why `tools/view.ts` exists.
- Run the renderer build from inside `engine/renderer` so `rust-toolchain.toml` (pinned Rust) applies.
- Verify: `npm run typecheck`. For visuals: `npm run view -- scenes/<x>.ts`, or `npm run render -- scenes/<x>.ts`.
- Patch 01 (a `play` window fix for monitors with different scales) was dropped: upstream fixed it in #132. Patch numbers are kept, so 02 and 03 apply in order.
- `patches/02-stats-toggle.patch`: the `play` window's stdout stats line (which the engine's playground parses) is on unless `THREERT_STATS=0`. `tools/rt.ts` sets 0, and **I** toggles it at runtime.
- Patches are separate, ordered diffs. To make patch N, diff against HEAD plus the earlier patches with a temp index: `cd engine; GIT_INDEX_FILE=/tmp/i git read-tree HEAD; GIT_INDEX_FILE=/tmp/i git apply --cached ../patches/02-*.patch; GIT_INDEX_FILE=/tmp/i git diff > ../patches/0N-name.patch`.
- `patches/03-windows-orca-venv.patch`: `scripts/orca.ts` (Bistro / Zero-Day download + Blender FBX→glTF) uses the venv's `bin/python` and `python3`. On Windows these are `Scripts\python.exe` and `python`.
- Engine demo assets: `engine/assets` is a symlink (made by `cd engine && bun scripts/setup.ts --no-fetch`; needs Windows Developer Mode) to `threert-assets/` in this project (gitignored). Fetch one ORCA scene with `BLENDER=".../blender.exe" bun scripts/orca.ts zeroday` from `engine/`. `tools/rt.ts` passes `--assets engine/` for scenes under `engine/`.
