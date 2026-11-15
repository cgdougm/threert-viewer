# threert-viewer

A sandbox for test-driving ThreeRT (https://github.com/meshy-dev/ThreeRT) on Windows. See README.md for commands.

- `engine/` is an upstream clone (gitignored). Work around engine issues in `tools/` when possible. When the engine itself must change, keep the change as `patches/*.patch` (from `cd engine && git diff`). `npm run setup` re-applies patches after a pull.
- `@threert/scene` etc. come from `engine/packages/*` (tsconfig paths + esbuild nodePaths). Don't `npm install` them from npm at the root: a second copy breaks instanceof checks between the runtime and the scene.
- Scene modules: `export default function build()` returning `{ scene, camera, options? }`. Physical units (lux, nits, EV100).
- Asset URIs in scenes are relative to the project root. The renderer gets `--assets <root>`, and the viewer serves the root first, then `engine/`.
- The engine's `tools/three/open.ts` file server rejects Windows paths, which is why `tools/view.ts` exists.
- Run the renderer build from inside `engine/renderer` so `rust-toolchain.toml` (pinned Rust) applies.
- Verify: `npm run typecheck`. For visuals: `npm run view -- scenes/<x>.ts`, or `npm run render -- scenes/<x>.ts`.
- `patches/01-windows-window-resize.patch`: `threert-render play` sizes its view once. Without the patch, moving the window to a monitor with a different scale spams `view: surface: Outdated` every frame. The patch pins the window at its first size.
- `patches/02-stats-toggle.patch`: the `play` window's stdout stats line (which the engine's playground parses) is on unless `THREERT_STATS=0`. `tools/rt.ts` sets 0, and **I** toggles it at runtime.
- Patches are separate, ordered diffs. To make patch N, diff against HEAD plus patches 1..N-1 with a temp index: `cd engine; GIT_INDEX_FILE=/tmp/i git read-tree HEAD; GIT_INDEX_FILE=/tmp/i git apply --cached ../patches/01-*.patch; GIT_INDEX_FILE=/tmp/i git diff > ../patches/0N-name.patch`.
