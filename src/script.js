import * as THREE from 'three';
import './style.css';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';

const debugObject = {};
const gui = new GUI();

//Read viewport size
const viewportSize = {
    width : window.innerWidth,
    height : window.innerHeight
}

//Get canvas element from DOM
const canvas = document.querySelector('canvas'); 

//Create a scene
const scene = new THREE.Scene();

//Create a camera and position it on the scene
//FOV between 45-75
const camera = new THREE.PerspectiveCamera(45,viewportSize.width/viewportSize.height, 0.1, 500);
camera.position.z = 6;
gui.add(camera.position, 'z', 1, 10).name('Camera position');
scene.add(camera);


//Create controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

//Create objects and add it to the scene
const sphereGeometry = new THREE.SphereGeometry(1, 350, 350);

const textureLoader = new THREE.TextureLoader();
const earthAlbedo = textureLoader.load('/textures/2k_earth_daymap.jpg');
earthAlbedo.minFilter = THREE.NearestFilter;
earthAlbedo.magFilter = THREE.NearestFilter;
earthAlbedo.generateMipmaps = false;
const earthAlbedoNight = textureLoader.load('/textures/2k_earth_nightmap.jpg');
const earthNormal = textureLoader.load('/textures/2k_earth_normal_map.tif');
const earthRoughness = textureLoader.load('/textures/2k_earth_specular_map.tif');
earthAlbedo.colorSpace = THREE.SRGBColorSpace;
earthAlbedoNight.colorSpace = THREE.SRGBColorSpace;

const material = new THREE.MeshStandardMaterial({
  map: earthAlbedo,
  normalMap: earthNormal,
  emissiveMap: earthAlbedoNight,
  emissive: new THREE.Color(0xffffff),
  emissiveIntensity: 0.5,
  roughnessMap: earthRoughness
});

// Generate star positions far away from the Earth
const starCount = 5000;
const starPositions = new Float32Array(starCount * 3);
const distance = 100; // Controls how far stars are from origin

for (let i = 0; i < starCount; i++) {
  const i3 = i * 3;

  const radius = THREE.MathUtils.randFloat(distance * 0.8, distance);
  const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
  const phi = THREE.MathUtils.randFloat(0, Math.PI);

  starPositions[i3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
  starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
  starPositions[i3 + 2] = radius * Math.cos(phi);
}

const starTexture = textureLoader.load('/textures/star.png');
const starsGeometry = new THREE.BufferGeometry();
starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

const starsMaterial = new THREE.PointsMaterial({
  map: starTexture,
  size: 0.3,
  sizeAttenuation: true,
  transparent: true,
  depthWrite: false,
  color: new THREE.Color(1.0, 0.95, 0.7), // slightly yellowish
});

const starField = new THREE.Points(starsGeometry, starsMaterial);
scene.add(starField);


const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.2);
directionalLight.position.set(3, -1, -5); // x, y, z
scene.add(directionalLight);

//const helper = new THREE.DirectionalLightHelper(directionalLight, 0.5);
//scene.add(helper);

const sphereMaterial = new THREE.MeshBasicMaterial({ map: earthAlbedo });
const sphere = new THREE.Mesh(sphereGeometry,material);
scene.add(sphere);

gui.add(sphere.rotation, 'y', sphere.rotation.y, 2*Math.PI).name('Earth rotation');;

//Create a render
const renderer = new THREE.WebGLRenderer({canvas: canvas});
renderer.setSize(viewportSize.width, viewportSize.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

//Window resize
window.addEventListener('resize', ()=>{
    viewportSize.width = window.innerWidth;
    viewportSize.height = window.innerHeight;
    
    // Update camera
    camera.aspect = viewportSize.width / viewportSize.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(viewportSize.width, viewportSize.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

});

//Render and animate the scene
const clock = new THREE.Clock();

debugObject.earthSpeed = 1;
gui.add(debugObject, 'earthSpeed', 1, 100).name('Earth rotation speed');

const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    controls.update();

    // Render
    renderer.render(scene, camera);

    sphere.rotation.y += 0.001 * debugObject.earthSpeed;

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
} 
tick();


