// 场景设置
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
scene.fog = new THREE.FogExp2(0x050505, 0.02);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(30, 20, 30);

const renderer = new THREE.WebGLRenderer({ antialias: false }); // Post-processing handles AA usually, or turn off for perf
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1.5;
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 2.0;

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1);
camera.add(pointLight);
scene.add(camera);

// --- Post-Processing (Bloom) ---
const renderScene = new THREE.RenderPass(scene, camera);

const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5, 0.4, 0.85
);
bloomPass.threshold = 0;
bloomPass.strength = 1.5; // Glow intensity
bloomPass.radius = 0.5;

const composer = new THREE.EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// --- Materials ---
function createGlowingTexture(color, type) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);
    
    if (type === 'core') {
        // Glowing Core pattern
        const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.5, color);
        grad.addColorStop(1, '#000000');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
    } else if (type === 'tech') {
        // Tech lines
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, size-20, size-20);
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(30, 30);
        ctx.moveTo(size, size); ctx.lineTo(size-30, size-30);
        ctx.stroke();
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
}

const materials = [
    // Magma (Emissive Red)
    new THREE.MeshStandardMaterial({
        color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2.0,
        map: createGlowingTexture('#500000', 'core'),
        roughness: 0.4, metalness: 0.8
    }),
    // Cyber Blue (Emissive Cyan)
    new THREE.MeshStandardMaterial({
        color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 1.5,
        map: createGlowingTexture('#005555', 'tech'),
        roughness: 0.2, metalness: 0.9
    }),
    // Golden (Metallic)
    new THREE.MeshStandardMaterial({
        color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 0.5,
        roughness: 0.1, metalness: 1.0
    }),
    // Deep Purple
    new THREE.MeshStandardMaterial({
        color: 0x8800ff, emissive: 0x440088, emissiveIntensity: 1.0,
        roughness: 0.3, metalness: 0.6
    })
];

// --- Instanced Mesh Setup ---
const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5); // Smaller blocks for higher density
const MAX_INSTANCES = 1000000; // 1 Million Blocks Limit
const meshes = materials.map(mat => {
    const mesh = new THREE.InstancedMesh(geometry, mat, Math.ceil(MAX_INSTANCES / materials.length));
    mesh.count = 0;
    scene.add(mesh);
    return mesh;
});

// --- Pre-calculation ---
const validPositions = [];
const dummy = new THREE.Object3D();

function initHeartPositions() {
    document.getElementById('status-text').innerText = "CALCULATING HIGH-RES VOXELS...";
    
    // Higher resolution for more blocks
    const resolution = 90; 
    
    for (let x = -resolution; x <= resolution; x++) {
        for (let y = -resolution; y <= resolution; y++) {
            for (let z = -resolution/2; z <= resolution/2; z++) {
                // Normalized coords for formula
                const nx = x / (resolution * 0.45);
                const ny = y / (resolution * 0.45);
                const nz = z / (resolution * 0.45);
                
                // Heart Formula
                const a = nx*nx + (9/4)*ny*ny + nz*nz - 1;
                if (a*a*a - nx*nx*nz*nz*nz - (9/80)*ny*ny*nz*nz*nz <= 0) {
                    validPositions.push({x: x * 0.6, y: y * 0.6, z: z * 0.6}); // Scale down position to fit screen
                }
            }
        }
    }
    
    // Shuffle positions for random "filling" effect
    // Fisher-Yates shuffle optimized
    let m = validPositions.length, t, i;
    while (m) {
        i = Math.floor(Math.random() * m--);
        t = validPositions[m];
        validPositions[m] = validPositions[i];
        validPositions[i] = t;
    }
    
    document.getElementById('status-text').innerText = "RENDERING START";
}

// Background Particles
const particleGeo = new THREE.BufferGeometry();
const particleCount = 5000; // More particles
const pArray = new Float32Array(particleCount * 3);
for(let i=0; i<particleCount*3; i++) {
    pArray[i] = (Math.random() - 0.5) * 150;
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(pArray, 3));
const particleMat = new THREE.PointsMaterial({
    color: 0xffffff, size: 0.15, transparent: true, opacity: 0.4
});
const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

// --- Animation ---
let currentIndex = 0;
let blocksPerFrame = 500; // Start speed
let lastTime = 0;
let frameCount = 0;
let fpsTime = 0;
let densityLayer = 0;

initHeartPositions();

function animate(time) {
    requestAnimationFrame(animate);
    
    // FPS Counter
    frameCount++;
    if (time - fpsTime >= 1000) {
        document.getElementById('fps-counter').innerText = frameCount;
        frameCount = 0;
        fpsTime = time;
    }

    // Dynamic speed adjustment based on count
    const total = meshes.reduce((acc, m) => acc + m.count, 0);
    
    // Keep adding blocks until we hit the hard limit
    if (total < MAX_INSTANCES) {
        // Accelerate filling as we go
        blocksPerFrame = 500 + Math.floor(total / 1000); 
        if (blocksPerFrame > 2000) blocksPerFrame = 2000; // Cap speed to maintain FPS

        const endIndex = Math.min(currentIndex + blocksPerFrame, validPositions.length);
        
        for (let i = currentIndex; i < endIndex; i++) {
            const pos = validPositions[i];
            
            // Add jitter based on density layer to avoid z-fighting and increase visual density
            const jitterX = (Math.random() - 0.5) * 0.4;
            const jitterY = (Math.random() - 0.5) * 0.4;
            const jitterZ = (Math.random() - 0.5) * 0.4;

            dummy.position.set(
                pos.x + jitterX, 
                pos.y + jitterY, 
                pos.z + jitterZ
            );
            
            // Random rotation
            dummy.rotation.set(Math.random()*6.28, Math.random()*6.28, Math.random()*6.28);
            
            // Random scale variation
            const s = 0.8 + Math.random() * 0.4;
            dummy.scale.set(s, s, s);
            
            dummy.updateMatrix();
            
            // Randomly assign to one of the materials
            const meshIdx = Math.floor(Math.random() * meshes.length);
            const mesh = meshes[meshIdx];
            
            if (mesh.count < mesh.instanceMatrix.count) {
                mesh.setMatrixAt(mesh.count, dummy.matrix);
                mesh.count++;
                mesh.instanceMatrix.needsUpdate = true;
            }
        }
        
        currentIndex = endIndex;
        
        // Loop logic: When we finish one pass of the heart shape, start over but add more density
        if (currentIndex >= validPositions.length) {
            currentIndex = 0;
            densityLayer++;
            document.getElementById('status-text').innerText = `OVERDRIVE LAYER ${densityLayer}`;
            document.getElementById('status-text').style.color = "#ff0055"; // Red alert color
            
            // Reshuffle for different filling pattern next layer
            // (Optional, skip for performance if needed, but looks better)
        }
        
        // Update UI
        document.getElementById('block-count').innerText = total;
        const progress = Math.min((total / MAX_INSTANCES) * 100, 100);
        document.getElementById('progress-fill').style.width = `${progress}%`;
        
        if (total >= MAX_INSTANCES) {
            document.getElementById('status-text').innerText = "MAXIMUM CAPACITY REACHED";
            document.getElementById('status-text').style.color = "#ff0000";
        }
    }

    // Rotate Particles
    particles.rotation.y = time * 0.0001;
    particles.rotation.z = time * 0.00005;

    controls.update();
    composer.render();
}

// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

animate(0);