// The Cornell box after the lab moved in: both boxes are covered in switches, dials, meters and screens, and the
// dimmed ceiling light leaves the gadgets' own glow (LEDs, backlit dials, tube digits, screens) to light the room.
// Everything is built from primitives here; the screens' pictures are generated textures.
import {
  Scene, PerspectiveCamera, Mesh, Group, Object3D, BoxGeometry, CylinderGeometry, SphereGeometry, TorusGeometry, LatheGeometry, CircleGeometry, PlaneGeometry, CapsuleGeometry,
  MeshStandardMaterial, LightPanelMaterial, LedScreenMaterial, RectAreaLight, SkyColor, Color, DataTexture,
} from "@threert/scene";

// ------------------------------------------------------------------------------------------------ generated pictures

/** An RGBA8 picture from a function of the pixel: [r, g, b] in 0..1 (sRGB). */
function picture(w: number, h: number, f: (x: number, y: number) => [number, number, number]): DataTexture {
  const px = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const c = f(x, y), o = (y * w + x) * 4;
      for (let k = 0; k < 3; k++) px[o + k] = Math.round(255 * Math.min(1, Math.max(0, c[k])));
      px[o + 3] = 255;
    }
  return new DataTexture(w, h, px);
}

/** Oscilloscope: a green trace (two beating sines) over a faint graticule. */
const scope = picture(256, 96, (x, y) => {
  const grid = x % 32 === 0 || y % 24 === 0 ? 0.12 : (x % 8 === 0 && y % 24 === 12) || (y % 6 === 0 && x % 32 === 16) ? 0.08 : 0;
  const t = x / 256;
  const v = 48 + 30 * Math.sin(t * Math.PI * 6) * Math.cos(t * Math.PI * 1.3) + 6 * Math.sin(t * Math.PI * 31);
  const d = Math.abs(y - v);
  const trace = Math.exp(-d * d * 0.6) + 0.25 * Math.exp(-d * d * 0.05);
  return [0.15 * trace + grid * 0.3, trace + grid, 0.35 * trace + grid * 0.4];
});

/** Radar: rings, a cross-hair, a fading sweep and a few blips. */
const radar = picture(128, 128, (x, y) => {
  const dx = (x - 63.5) / 63.5, dy = (y - 63.5) / 63.5, r = Math.hypot(dx, dy);
  if (r > 1) return [0, 0, 0];
  const ring = Math.abs((r * 4) % 1) < 0.04 || Math.abs(dx) < 0.012 || Math.abs(dy) < 0.012 ? 0.35 : 0;
  let a = Math.atan2(dy, dx) - 0.6;
  a = ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const sweep = Math.exp(-a * 1.6) * 0.8;
  const blips = [[0.35, -0.4], [-0.5, 0.2], [0.1, 0.62]].reduce((s, [bx, by]) => s + Math.exp(-((dx - bx) ** 2 + (dy - by) ** 2) * 900), 0);
  const g = Math.min(1, ring + sweep + blips + 0.04);
  return [0.2 * g, g, 0.3 * g];
});

/** Hazard stripes. */
const hazard = picture(128, 32, (x, y) => ((x + y) % 32 < 16 ? [0.95, 0.72, 0.05] : [0.03, 0.03, 0.03]));

// ------------------------------------------------------------------------------------------------ materials

const metal = (name: string, rgb: [number, number, number], roughness: number) =>
  new MeshStandardMaterial({ name, color: new Color().setRGB(...rgb), metalness: 1, roughness });
const plastic = (name: string, rgb: [number, number, number], roughness = 0.4) => new MeshStandardMaterial({ name, color: new Color().setRGB(...rgb), roughness });

const gunmetal = metal("gunmetal", [0.16, 0.17, 0.19], 0.45);
const chrome = metal("chrome", [0.9, 0.9, 0.92], 0.12);
const brass = metal("brass", [0.85, 0.62, 0.3], 0.3);
const black = plastic("black_plastic", [0.02, 0.02, 0.022]);
const bezelBlack = plastic("bezel", [0.01, 0.01, 0.012], 0.65);
const red = plastic("red_plastic", [0.5, 0.03, 0.02], 0.3);
const yellow = plastic("yellow_plastic", [0.8, 0.55, 0.03], 0.35);
const ivory = plastic("ivory", [0.8, 0.77, 0.68], 0.5);
const darkGlass = plastic("dark_lens", [0.03, 0.03, 0.03], 0.1);
const stripes = new MeshStandardMaterial({ name: "hazard", map: hazard, roughness: 0.5 });

// Glowing parts, in nits. The LEDs are tiny, so they are bright. A blinking one is off for the first half of each
// period, so the phases here (>= 0.5) have them lit at time 0: in a still render.
const led = (name: string, rgb: [number, number, number], intensity = 450, blink?: { rate: number; phase: number }) =>
  new LightPanelMaterial({ name, color: rgb, intensity, blink: !!blink, rate: blink?.rate, phase: blink?.phase });
const GREEN: [number, number, number] = [0.15, 1, 0.25], AMBER: [number, number, number] = [1, 0.55, 0.08], RED: [number, number, number] = [1, 0.08, 0.04], CYAN: [number, number, number] = [0.2, 0.8, 1];

// ------------------------------------------------------------------------------------------------ helpers

/** Adds a mesh to `parent` at (x, y, z), rotated by (rx, ry, rz); returns it. */
function put(parent: Object3D, name: string, geometry: ConstructorParameters<typeof Mesh>[0], material: ConstructorParameters<typeof Mesh>[1], x: number, y: number, z: number, rx = 0, ry = 0, rz = 0): Mesh {
  const m = new Mesh(geometry, material);
  m.name = name;
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  parent.add(m);
  return m;
}

/** A dome LED half sunk into a panel whose surface is at z. */
function addLed(p: Object3D, name: string, x: number, y: number, z: number, mat: LightPanelMaterial, r = 0.009) {
  put(p, `${name}_bezel`, new TorusGeometry(r * 1.25, r * 0.35, 8, 24), chrome, x, y, z);
  put(p, name, new SphereGeometry(r, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat, x, y, z, Math.PI / 2);
}

/** A toggle switch on a panel at z: a nut, and a lever up (1) or down (-1). */
function addToggle(p: Object3D, name: string, x: number, y: number, z: number, dir: number) {
  put(p, `${name}_nut`, new CylinderGeometry(0.016, 0.016, 0.01, 6), chrome, x, y, z + 0.005, Math.PI / 2);
  const lever = new Group();
  lever.position.set(x, y, z + 0.01);
  lever.rotation.x = Math.PI / 2 - dir * 0.45;
  p.add(lever);
  put(lever, `${name}_lever`, new CylinderGeometry(0.0035, 0.005, 0.05, 12), chrome, 0, 0.025, 0);
  put(lever, `${name}_tip`, new SphereGeometry(0.0065, 12, 8), chrome, 0, 0.05, 0);
}

/** A knob facing +z on a panel at z, its pointer at `angle`. */
function addKnob(p: Object3D, name: string, x: number, y: number, z: number, r: number, angle: number, mat = black) {
  const profile = [{ x: 0, y: 0 }, { x: r, y: 0 }, { x: r, y: r * 0.25 }, { x: r * 0.82, y: r * 0.35 }, { x: r * 0.78, y: r * 0.9 }, { x: r * 0.6, y: r * 1.05 }, { x: 0, y: r * 1.05 }];
  put(p, name, new LatheGeometry(profile, 32), mat, x, y, z, Math.PI / 2);
  const ptr = put(p, `${name}_pointer`, new BoxGeometry(r * 0.1, r * 0.55, r * 0.06), ivory, x, y, z + r * 1.05, 0, 0, angle);
  ptr.translateY(r * 0.35);
  put(p, `${name}_skirt`, new CylinderGeometry(r * 1.35, r * 1.35, 0.002, 32), chrome, x, y, z + 0.001, Math.PI / 2);
}

/** A backlit analog meter facing +z on a panel at z, its needle at `angle` (0 = straight up). */
function addDial(p: Object3D, name: string, x: number, y: number, z: number, r: number, angle: number) {
  put(p, `${name}_bezel`, new TorusGeometry(r, r * 0.1, 12, 48), chrome, x, y, z + r * 0.06);
  put(p, `${name}_face`, new CircleGeometry(r, 48), led(`${name}_backlight`, [1, 0.86, 0.6], 9), x, y, z + 0.002);
  for (let i = 0; i <= 10; i++) {
    const a = -1.1 + (2.2 * i) / 10;
    const tick = put(p, `${name}_tick${i}`, new BoxGeometry(r * 0.025, r * (i % 5 ? 0.1 : 0.18), 0.001), i > 8 ? red : black, x, y, z + 0.003, 0, 0, -a);
    tick.translateY(r * 0.78);
  }
  const needle = put(p, `${name}_needle`, new BoxGeometry(r * 0.03, r * 0.85, 0.002), red, x, y, z + 0.006, 0, 0, -angle);
  needle.translateY(r * 0.38);
  put(p, `${name}_hub`, new CylinderGeometry(r * 0.08, r * 0.08, 0.008, 16), black, x, y, z + 0.006, Math.PI / 2);
}

/** A vertical LED bar graph on a panel at z: `n` segments, the lowest `lit` on, the top one blinking when lit. */
function addBarGraph(p: Object3D, name: string, x: number, y0: number, z: number, n: number, lit: number) {
  put(p, `${name}_frame`, new BoxGeometry(0.05, n * 0.02 + 0.016, 0.006), bezelBlack, x, y0 + (n * 0.02) / 2 - 0.01, z + 0.003);
  for (let i = 0; i < n; i++) {
    const c = i < n * 0.6 ? GREEN : i < n * 0.85 ? AMBER : RED;
    const on = i < lit;
    const mat = on ? led(`${name}_seg${i}`, c, 160, i === lit - 1 ? { rate: 2.5, phase: 0.5 } : undefined) : darkGlass;
    put(p, `${name}_seg${i}`, new BoxGeometry(0.036, 0.013, 0.004), mat, x, y0 + i * 0.02, z + 0.007);
  }
}

// ------------------------------------------------------------------------------------------------ the scene

export default function build() {
  const scene = new Scene();
  scene.environment = new SkyColor(0x000000, 0);
  const white = new MeshStandardMaterial({ name: "white", color: new Color().setRGB(0.73, 0.73, 0.73), roughness: 0.9 });
  const redWall = new MeshStandardMaterial({ name: "red", color: new Color().setRGB(0.63, 0.065, 0.05), roughness: 0.9 });
  const greenWall = new MeshStandardMaterial({ name: "green", color: new Color().setRGB(0.14, 0.45, 0.091), roughness: 0.9 });
  const t = 0.2; // wall thickness, as in cornell-box.ts
  const wall = (name: string, w: number, h: number, d: number, x: number, y: number, z: number, mat: MeshStandardMaterial) => put(scene, name, new BoxGeometry(w, h, d), mat, x, y, z);
  wall("floor", 2 + 2 * t, t, 2 + t, 0, -t / 2, -t / 2, white);
  wall("ceiling", 2 + 2 * t, t, 2 + t, 0, 2 + t / 2, -t / 2, white);
  wall("back", 2 + 2 * t, 2, t, 0, 1, -1 - t / 2, white);
  wall("left", t, 2, 2, -1 - t / 2, 1, 0, redWall);
  wall("right", t, 2, 2, 1 + t / 2, 1, 0, greenWall);

  // ---- the tall box: an instrument rack. Local origin at its centre; the front (+z) faces the camera.
  const tall = new Group();
  tall.name = "tall_rack";
  tall.position.set(-0.33, 0.6, -0.28);
  tall.rotation.y = 0.28;
  scene.add(tall);
  put(tall, "tall_box", new BoxGeometry(0.6, 1.2, 0.6), white, 0, 0, 0);
  const F = 0.3 + 0.006; // the front panel's surface
  put(tall, "tall_panel", new BoxGeometry(0.54, 1.12, 0.012), gunmetal, 0, -0.01, 0.3);
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) put(tall, `tall_screw${sx}${sy}`, new CylinderGeometry(0.007, 0.007, 0.004, 12), chrome, sx * 0.25, -0.01 + sy * 0.54, F, Math.PI / 2);

  // Oscilloscope.
  put(tall, "scope_bezel", new BoxGeometry(0.44, 0.2, 0.03), bezelBlack, 0, 0.44, F + 0.015);
  put(tall, "scope_screen", new PlaneGeometry(0.39, 0.15), new LedScreenMaterial({ name: "scope", map: scope, intensity: 30, resolution: [128, 48], led: 0.35, plasma: 0, glow: GREEN }), 0, 0.44, F + 0.031);
  for (let i = 0; i < 3; i++) addKnob(tall, `scope_knob${i}`, -0.14 + i * 0.14, 0.305, F, 0.016, -0.8 + i * 0.9);

  // Toggle switches with status LEDs.
  const status: [number, number, number][] = [GREEN, GREEN, AMBER, RED, GREEN, CYAN];
  for (let i = 0; i < 6; i++) {
    const x = -0.2 + i * 0.08;
    addToggle(tall, `toggle${i}`, x, 0.18, F, i % 3 === 1 ? -1 : 1);
    addLed(tall, `status${i}`, x, 0.235, F, led(`status${i}`, status[i], 450, i === 3 ? { rate: 1.3, phase: 0.6 } : i === 5 ? { rate: 0.4, phase: 0.3 } : undefined));
  }

  // Two meters.
  addDial(tall, "dial_volts", -0.13, 0.02, F, 0.085, -0.5);
  addDial(tall, "dial_amps", 0.13, 0.02, F, 0.085, 0.85);

  // Bar graph, the big red button, and a column of knobs.
  addBarGraph(tall, "bargraph", -0.19, -0.42, F, 12, 9);
  put(tall, "button_collar", new CylinderGeometry(0.055, 0.06, 0.016, 32), yellow, 0.0, -0.26, F + 0.008, Math.PI / 2);
  const mushroom = put(tall, "button", new SphereGeometry(0.045, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), led("button_glow", RED, 120, { rate: 0.5, phase: 0.6 }), 0.0, -0.26, F + 0.016, Math.PI / 2);
  mushroom.scale.set(1, 0.55, 1);
  put(tall, "button_plate", new BoxGeometry(0.12, 0.028, 0.002), stripes, 0.0, -0.355, F + 0.001);
  for (let i = 0; i < 3; i++) addKnob(tall, `knob${i}`, 0.18, -0.12 - i * 0.12, F, 0.024, [-1.6, 0.4, 2.1][i], i === 1 ? red : black);
  addLed(tall, "power_led", -0.08, -0.47, F, led("power", GREEN, 450));
  addLed(tall, "fault_led", -0.04, -0.47, F, led("fault", RED, 450, { rate: 3, phase: 0.7 }));
  put(tall, "key_switch", new CylinderGeometry(0.02, 0.02, 0.012, 24), brass, 0.06, -0.47, F + 0.006, Math.PI / 2);
  put(tall, "key", new BoxGeometry(0.008, 0.028, 0.004), brass, 0.06, -0.47, F + 0.02, Math.PI / 2, 0, 0.6);

  // On top: four glowing tube digits, and an antenna with a beacon.
  for (let i = 0; i < 4; i++) {
    const x = -0.18 + i * 0.09;
    put(tall, `tube${i}_socket`, new CylinderGeometry(0.03, 0.034, 0.03, 24), black, x, 0.615, 0.12);
    put(tall, `tube${i}_digit`, new TorusGeometry(0.02, 0.0025, 8, 32), led(`digit${i}`, [1, 0.32, 0.04], 70), x, 0.67, 0.12, 0, 0, 0);
    put(tall, `tube${i}_stem`, new CylinderGeometry(0.002, 0.002, 0.03, 6), metal("tube_wire", [0.6, 0.6, 0.6], 0.4), x, 0.64, 0.12);
  }
  put(tall, "antenna_base", new CylinderGeometry(0.025, 0.03, 0.02, 24), gunmetal, 0.18, 0.61, -0.15);
  put(tall, "antenna", new CylinderGeometry(0.003, 0.004, 0.32, 8), chrome, 0.18, 0.78, -0.15);
  put(tall, "beacon", new CapsuleGeometry(0.012, 0.014, 4, 16), led("beacon", RED, 600, { rate: 0.8, phase: 0.55 }), 0.18, 0.95, -0.15);

  // ---- the short box: a desk console. Top surface at y = 0.3, front at z = 0.3.
  const desk = new Group();
  desk.name = "desk_console";
  desk.position.set(0.35, 0.3, 0.32);
  desk.rotation.y = -0.3;
  scene.add(desk);
  put(desk, "short_box", new BoxGeometry(0.6, 0.6, 0.6), white, 0, 0, 0);
  put(desk, "desk_top", new BoxGeometry(0.56, 0.012, 0.56), gunmetal, 0, 0.3, 0);
  const T = 0.306; // the top panel's surface

  // Radar screen in a sloped housing at the back.
  const housing = new Group();
  housing.position.set(0, T, -0.17);
  housing.rotation.x = -0.75; // leaning back, the screen facing up and towards the camera
  desk.add(housing);
  put(housing, "radar_bezel", new BoxGeometry(0.26, 0.2, 0.03), bezelBlack, 0, 0.1, 0);
  put(housing, "radar_screen", new CircleGeometry(0.085, 48), new LedScreenMaterial({ name: "radar", map: radar, intensity: 45, resolution: [64, 64], led: 0.3, plasma: 0, glow: GREEN }), 0, 0.1, 0.016);
  put(housing, "radar_rim", new TorusGeometry(0.088, 0.006, 8, 48), chrome, 0, 0.1, 0.016);

  // Keypad: a 4 x 3 grid, some keys lit.
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 3; c++) {
      const lit = (r * 3 + c) % 5 === 1;
      const mat = lit ? led(`key${r}${c}`, AMBER, 60) : ivory;
      put(desk, `key${r}${c}`, new BoxGeometry(0.036, 0.014, 0.036), mat, -0.2 + c * 0.045, T + 0.007, 0.0 + r * 0.045);
    }

  // Joystick, with a fire button.
  put(desk, "stick_boot", new CylinderGeometry(0.03, 0.045, 0.025, 24), black, 0.12, T + 0.0125, 0.08);
  const stick = new Group();
  stick.position.set(0.12, T + 0.02, 0.08);
  stick.rotation.set(0.25, 0, -0.2);
  desk.add(stick);
  put(stick, "stick_shaft", new CylinderGeometry(0.007, 0.009, 0.11, 12), chrome, 0, 0.055, 0);
  put(stick, "stick_ball", new SphereGeometry(0.024, 24, 16), red, 0, 0.12, 0);
  put(desk, "fire_button", new CylinderGeometry(0.016, 0.016, 0.01, 24), led("fire", RED, 140, { rate: 1.7, phase: 0.75 }), 0.21, T + 0.005, 0.18);
  const knobMount = new Group(); // addKnob faces +z; this turns +z up
  knobMount.position.set(0.2, T, -0.05);
  knobMount.rotation.x = -Math.PI / 2;
  desk.add(knobMount);
  addKnob(knobMount, "desk_knob", 0, 0, 0, 0.022, 1.1);

  // Front: a patch bay with two cables, rocker switches and a hazard strip.
  const P = 0.3 + 0.006;
  put(desk, "front_panel", new BoxGeometry(0.54, 0.54, 0.012), gunmetal, 0, 0, 0.3);
  put(desk, "hazard_strip", new BoxGeometry(0.5, 0.04, 0.002), stripes, 0, 0.22, P + 0.001);
  for (let row = 0; row < 2; row++)
    for (let i = 0; i < 6; i++) {
      const x = -0.2 + i * 0.08, y = 0.12 - row * 0.08;
      put(desk, `jack${row}${i}`, new TorusGeometry(0.011, 0.004, 8, 24), chrome, x, y, P + 0.002);
      put(desk, `jack${row}${i}_hole`, new CircleGeometry(0.008, 16), black, x, y, P + 0.0015);
      if (i % 2 === 0) addLed(desk, `jack_led${row}${i}`, x + 0.03, y + 0.025, P, led(`jack_led${row}${i}`, row ? AMBER : GREEN, 400, (row * 6 + i) % 4 === 0 ? { rate: 0.9 + i * 0.3, phase: 0.5 + row * 0.3 } : undefined), 0.005);
    }
  const cable = (name: string, x0: number, x1: number, y: number, mat: MeshStandardMaterial) => {
    const half = (x1 - x0) / 2;
    put(desk, name, new TorusGeometry(half, 0.006, 8, 32, Math.PI), mat, (x0 + x1) / 2, y, P + 0.008, 0, 0, Math.PI).scale.set(1, 1.4, 1);
    for (const x of [x0, x1]) put(desk, `${name}_plug${x}`, new CylinderGeometry(0.008, 0.008, 0.02, 12), chrome, x, y, P + 0.01, Math.PI / 2);
  };
  cable("cable_red", -0.2, 0.04, 0.12, red);
  cable("cable_yellow", -0.12, 0.2, 0.04, yellow);
  for (let i = 0; i < 4; i++) {
    const on = i !== 2;
    put(desk, `rocker${i}_frame`, new BoxGeometry(0.06, 0.04, 0.008), bezelBlack, -0.15 + i * 0.1, -0.1, P + 0.004);
    put(desk, `rocker${i}`, new BoxGeometry(0.046, 0.028, 0.008), on ? led(`rocker${i}`, i === 3 ? RED : GREEN, 70) : darkGlass, -0.15 + i * 0.1, -0.1, P + 0.009, on ? 0.18 : -0.18);
  }
  addDial(desk, "desk_meter", -0.12, -0.2, P, 0.05, 0.3);
  addBarGraph(desk, "desk_level", 0.14, -0.24, P, 6, 4);
  put(desk, "vent", new BoxGeometry(0.16, 0.002, 0.002), black, 0.14, -0.24, P);

  // The ceiling light, at about a twentieth of cornell-box.ts's, so the panels' glow shows.
  const light = new RectAreaLight(new Color().setRGB(1.0, 0.85, 0.65), 1000, 0.5, 0.4);
  light.name = "ceiling_light";
  light.position.set(0, 1.995, 0);
  light.lookAt(0, 0, 0);
  scene.add(light);

  const camera = new PerspectiveCamera(39, 16 / 9, 0.02, 100);
  camera.name = "camera";
  camera.position.set(0, 1, 3.9);
  camera.lookAt(0, 0.75, 0);
  camera.setManualExposure(5.5);
  scene.add(camera);
  return { scene, camera, options: { name: "control-panel-cornell" } };
}
