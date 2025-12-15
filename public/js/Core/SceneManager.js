export class SceneManager {
    constructor(canvasContainerId) {
        this.container = document.getElementById(canvasContainerId);
        this.canvas = this.container.querySelector('canvas');

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.sunLight = null;

        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.init();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.Fog(0x87ceeb, 50, 300);

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, this.width / this.height, 0.1, 1000);
        this.camera.position.set(0, 50, 80);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        // Lights
        this.setupLighting();

        // Resize Listener
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupLighting() {
        // Ambient
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        ambientLight.name = 'ambientLight';
        this.scene.add(ambientLight);

        // Sun (Directional)
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.sunLight.position.set(50, 100, 50);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.camera.left = -100;
        this.sunLight.shadow.camera.right = 100;
        this.sunLight.shadow.camera.top = 100;
        this.sunLight.shadow.camera.bottom = -100;
        this.sunLight.shadow.mapSize.width = 4096;
        this.sunLight.shadow.mapSize.height = 4096;
        this.sunLight.shadow.bias = -0.0001;
        this.sunLight.name = 'sunLight';
        this.scene.add(this.sunLight);

        // Hemisphere
        const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x3a9d3a, 0.3);
        this.scene.add(hemiLight);

        // OrbitControls
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;

            // Reassign inputs
            this.controls.mouseButtons = {
                LEFT: THREE.MOUSE.PAN, // Or DO_NOTHING? User needs Left for Tool. 
                // Wait, if set to PAN it consumes the event? 
                // Best to set to null/DO_NOTHING to allow raycasting pass-through?
                // Actually, Three.js controls usually consume events. 
                // Let's set LEFT to null.
                // User said: "rotation ... clicking the mouse wheel"
                // So MIDDLE = ROTATE.
                LEFT: null, // Reserved for tools
                MIDDLE: THREE.MOUSE.ROTATE,
                RIGHT: THREE.MOUSE.PAN
            };

            // Allow zoom with scroll
            this.controls.enableZoom = true;
        } else {
            console.error('OrbitControls not loaded');
        }
    }

    update() {
        if (this.controls) this.controls.update();
    }

    onWindowResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
    }

    getScene() { return this.scene; }
    getCamera() { return this.camera; }
    getRenderer() { return this.renderer; }
}
