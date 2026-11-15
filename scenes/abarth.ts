// Test model: Abarth 595SS "Death Stranding Chiral" by chiwei (Sketchfab, CC-BY-4.0), on a floor under a physical sky.
import { Scene, PerspectiveCamera, Mesh, PlaneGeometry, MeshStandardMaterial, DirectionalLight, SkyAtmosphere, GLTFModel } from "@threert/scene";

export default function build() {
  const scene = new Scene();
  const sun = new DirectionalLight(0xffffff, 80000); // lux
  sun.name = "sun";
  sun.setSunAngles(35, -40);
  scene.add(sun);
  scene.environment = new SkyAtmosphere({ sun });

  const ground = new Mesh(new PlaneGeometry(40, 40), new MeshStandardMaterial({ name: "floor", color: 0x6f6f6f, roughness: 0.6 }));
  ground.name = "ground";
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // URIs resolve against the project root (the renderer's --assets, the viewer's server root).
  const car = new GLTFModel("test-models/abarth_595ss_death_stranding_chiral_4k.glb");
  car.name = "abarth";
  car.position.y = 0.01; // its display platform would z-fight the floor
  car.rotation.y = 0.6;
  car.scale.setScalar(13); // the Sketchfab export is in odd units (~0.1 m tall as shipped); 13x is about life size
  scene.add(car);

  const camera = new PerspectiveCamera(35, 16 / 9, 0.05, 300);
  camera.name = "camera";
  camera.position.set(4.5, 1.8, 6.0);
  camera.lookAt(0, 0.6, 0);
  camera.setManualExposure(14.6); // EV100 for a sunlit exterior
  scene.add(camera);
  return { scene, camera, options: { name: "abarth" } };
}
