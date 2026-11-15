// Test model: "FREE GMC Motorhome reimagined low poly" by Karol Miklas (Sketchfab, CC-BY-4.0), parked on asphalt at
// golden hour. The GLB is about 9.3 m long (along Z), 3.2 m wide and 3.3 m tall, with its origin 1.56 m above the
// wheels. It uses clearcoat paint, transmissive windows and one emissive material.
import { Scene, PerspectiveCamera, Mesh, PlaneGeometry, MeshStandardMaterial, DirectionalLight, SkyAtmosphere, GLTFModel } from "@threert/scene";

export default function build() {
  const scene = new Scene();
  const sun = new DirectionalLight(0xffffff, 60000); // lux; the atmosphere reddens and dims it this low
  sun.name = "sun";
  sun.setSunAngles(9, 70); // from over the camera's right shoulder, raking the front
  scene.add(sun);
  scene.environment = new SkyAtmosphere({ sun });

  const ground = new Mesh(new PlaneGeometry(6000, 6000), new MeshStandardMaterial({ name: "asphalt", color: 0x4d4b47, roughness: 0.9 }));
  ground.name = "ground";
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const rv = new GLTFModel("test-models/free_gmc_motorhome_reimagined_low_poly.glb");
  rv.name = "motorhome";
  rv.position.set(0, 1.558, 0); // wheels on the ground
  rv.rotation.y = 1.29; // the front (local +Z) three-quarters toward the camera
  scene.add(rv);

  const camera = new PerspectiveCamera(40, 16 / 9, 0.05, 1000);
  camera.name = "camera";
  camera.position.set(8.5, 2.2, 9.5);
  camera.lookAt(0, 1.4, 0);
  camera.setManualExposure(13);
  scene.add(camera);
  return { scene, camera, options: { name: "motorhome" } };
}
