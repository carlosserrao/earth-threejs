import * as THREE from 'three';
import './style.css';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

const debugObject = {};
const gui = new GUI();
gui.show(false);

//Show or hide the GUI controls
document.addEventListener('keyup', (event) =>{
    if(event.key === 'h'){
       gui.show(gui._hidden); 
    }
});

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
camera.position.set(0, 0, 5);
gui.add(camera.position, 'z', 1, 10).name('Camera position');
camera.lookAt(0, 0, 0);
scene.add(camera);


//Create controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(0, 0, 0);
controls.update();


//Create objects and add it to the scene

//Earth
const earthGeometry = new THREE.SphereGeometry(1, 350, 350);

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

const earthMaterial = new THREE.MeshStandardMaterial({
  map: earthAlbedo,
  normalMap: earthNormal,
  normalScale: new THREE.Vector2(0.1, 0.1),
  emissiveMap: earthAlbedoNight,
  emissive: new THREE.Color(0xffffff),
  emissiveIntensity: 0.8,
  roughnessMap : earthRoughness,
  roughness : 0,
  metalness: 0,
  envMapIntensity: 0.2
});

const sphere = new THREE.Mesh(earthGeometry,earthMaterial);
scene.add(sphere);

gui.add(sphere.rotation, 'y', sphere.rotation.y, 2*Math.PI).name('Earth rotation');


textureLoader.load('/textures/space.png', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
  scene.background = texture;
});


const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
directionalLight.position.set(3, -1, -3); // x, y, z
scene.add(directionalLight);

const lightFolder = gui.addFolder('Directional Light');

// Reasonable position range for scene space (e.g. -10 to +10)
lightFolder.add(directionalLight.position, 'x', -10, 10).name('X Position');
lightFolder.add(directionalLight.position, 'y', -10, 10).name('Y Position');
lightFolder.add(directionalLight.position, 'z', -10, 10).name('Z Position');

// Light intensity range — tweak as needed
lightFolder.add(directionalLight, 'intensity', 0, 5).name('Intensity');

// Optionally: show helper visibility toggle
const helper = new THREE.DirectionalLightHelper(directionalLight, 0.5);
helper.visible = false;
scene.add(helper);
lightFolder.add(helper, 'visible').name('Show Helper');


//Add text geometry
let text;
const fontLoader = new FontLoader();
fontLoader.load('/fonts/Maghfirea.json', (font) => {
    const textGeometry = new TextGeometry('Its Full of Stars!', {
        font,
        size: 0.5,        
        height: 0.5,       
        depth: 0.02,
        bevelEnabled: false
    });
    textGeometry.center();
    const glassMaterial = new THREE.MeshPhysicalMaterial({
        transmission: 1.0,        // Glass effect
        transparent: true,        // Necessary for transmission
        opacity: 1.0,             
        roughness: 0.3,           // Frosted
        metalness: 0.75,          // Monolyth aspect
        thickness: 0.45,           
        ior: 1.5,                 // IOR (1.5 = common glass)
        color: 0xffffff,          // Glass color
        clearcoat: 1.0,           // for finishing
        clearcoatRoughness: 0.1,
        emissiveIntensity : 1
    });
    gui.add(glassMaterial,'thickness', 0, 1).name("Glass thickness");
    gui.add(glassMaterial,'roughness', 0, 1).name("Glass roughness");
    gui.add(glassMaterial,'metalness', 0, 1).name("Glass metalness");
    text = new THREE.Mesh(textGeometry, glassMaterial);
    text.position.set(0, 0, 2);
    scene.add(text);
});

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
    const delta = clock.getDelta();

    controls.update();
    
    //Update helper
    helper.update();
    
    // Render
    renderer.render(scene, camera);

    const baseY = 1.2; // original height
    const elapsedTime = clock.getElapsedTime();
    if (text) {
        const amplitude = 0.25;  // how far it moves
        const speed = 0.5;        // how fast it moves
        text.position.z = 1.5 + Math.sin(elapsedTime * speed) * amplitude;
    }

    sphere.rotation.y += 0.05 * delta * debugObject.earthSpeed;

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
} 
tick();


