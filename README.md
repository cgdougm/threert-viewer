# threert-viewer

A quick test drive of [ThreeRT](https://github.com/meshy-dev/ThreeRT), a real-time path tracer with a three.js-style scene API.

ThreeRT's official `threert` CLI ships only with the macOS app. On Windows, this project drives the engine from source:

| | What | Command |
|---|---|---|
| three.js preview | The scene as plain three.js in the browser. F5 rebundles. | `npm run view -- scenes/abarth.ts` |
| Path tracer, window | `threert-render play` (Rust/wgpu, hardware ray queries on Vulkan/DX12). Drag to orbit, right-drag to pan, wheel to zoom, WASD/QE to fly, R to reset, P for a snapshot, I to toggle the stats line. | `npm run play -- scenes/abarth.ts` |
| Path tracer, still | `threert-render render` → `out/<scene>.png` | `npm run render -- scenes/abarth.ts --spp 64` |

## Setup

Requires Node 22.18+ (runs `.ts` directly), git, and rustup. The engine pins its own Rust toolchain, and rustup installs it on the first build.

```sh
npm run setup            # clones meshy-dev/ThreeRT into engine/ and installs its deps
npm run build:renderer   # cargo build --release in engine/renderer (slow the first time)
```

## Layout

- `scenes/*.ts`: scene modules. Each one does `export default function build() { ...; return { scene, camera } }`, importing from `@threert/scene`.
- `test-models/`: local GLBs (gitignored). Scenes reference them by project-relative URI: `new GLTFModel("test-models/foo.glb")`.
- `tools/`: thin wrappers around the engine's own tooling (`view.ts`, `bundle.ts`, `rt.ts`, `setup.ts`).
- `engine/`: the ThreeRT checkout (gitignored). `@threert/*` resolve to its workspace packages, not to npm.
- `patches/`: local fixes to the engine, applied by `npm run setup`. `02-stats-toggle.patch` lets `npm run play` keep the twice-a-second stats line quiet; press **I** in the window to toggle it. `03-windows-orca-venv.patch` lets `scripts/orca.ts` find its Python on Windows. (Patch 01, a fix for the `play` window on monitors with different scales, was dropped after upstream fixed it in [#132](https://github.com/meshy-dev/ThreeRT/pull/132).)
- `out/`: bundles and renders (gitignored).

## Notes

- Lighting is in physical units: the sun is about 80,000 lux. Set `camera.setManualExposure(~14.6)` for daylight, or the three.js view shows white.
- The test car (Abarth 595SS "Death Stranding Chiral" by chiwei, CC-BY-4.0 via Sketchfab) is exported at about 1/13 scale, so `scenes/abarth.ts` scales it ×13.
- `scenes/motorhome.ts`: "FREE GMC Motorhome reimagined low poly" by Karol Miklas (CC-BY-4.0 via Sketchfab), parked at golden hour. It's at real scale as shipped and only needs lifting 1.56 m so the wheels sit on the ground.
