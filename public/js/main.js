import { SceneManager } from './Core/SceneManager.js';
import { StateManager } from './Core/StateManager.js';
import { TerrainSystem } from './Terrain/TerrainSystem.js';
import { VegetationSystem } from './Objects/VegetationSystem.js';
import { UIManager } from './UI/UIManager.js';
import { SculptTool } from './Tools/SculptTool.js';
import { PaintTool } from './Tools/PaintTool.js';
import { WaterSystem } from './Objects/WaterSystem.js';
import { EnvironmentSystem } from './Core/EnvironmentSystem.js';
import { RoadSystem } from './Objects/RoadSystem.js';
import { MinimapSystem } from './Core/MinimapSystem.js';

class App {
    constructor() {
        this.sceneManager = new SceneManager('canvas-container');
        this.scene = this.sceneManager.getScene();
        this.camera = this.sceneManager.getCamera();
        this.renderer = this.sceneManager.getRenderer();

        this.terrainSystem = new TerrainSystem(this.scene);
        this.vegetationSystem = new VegetationSystem(this.scene);
        this.waterSystem = new WaterSystem(this.scene);
        this.environmentSystem = new EnvironmentSystem(this);
        this.roadSystem = new RoadSystem(this.scene);

        this.stateManager = new StateManager(this);

        this.tools = {
            sculpt: new SculptTool(this),
            paint: new PaintTool(this),
        };

        this.activeToolName = 'sculpt';
        this.activeVegetationType = 'tree';

        this.ui = new UIManager(this);

        this.mouse = new THREE.Vector2();
        this.isMouseDown = false;

        // Single central Raycaster used by tools
        this.raycaster = new THREE.Raycaster();

        // Minimap
        this.minimapSystem = new MinimapSystem(this);

        // Performance Monitoring
        this.lastTime = performance.now();
        this.lastFpsTime = this.lastTime;
        this.frameCount = 0;
        this.fpsElement = document.getElementById('fps');

        this.initInteraction();
        this.setupAppSpecificBindings();

        this.animate();

        // Initial state save
        setTimeout(() => this.stateManager.saveState(), 100);
    }

    setActiveTool(name) {
        this.activeToolName = name;
    }

    setupAppSpecificBindings() {
        // Environment Bindings
        const timeSlider = document.getElementById('time-slider');
        if (timeSlider) timeSlider.addEventListener('input', (e) => this.environmentSystem.setParam('time', parseFloat(e.target.value)));

        const fogInput = document.getElementById('fog-density');
        if (fogInput) fogInput.addEventListener('input', (e) => this.environmentSystem.setParam('fogDensity', parseFloat(e.target.value)));

        document.querySelectorAll('[data-weather]').forEach(btn => {
            btn.addEventListener('click', (e) => this.environmentSystem.setWeather(e.target.dataset.weather));
        });

        // Water Bindings
        const waterToggle = document.getElementById('water-toggle');
        if (waterToggle) waterToggle.addEventListener('click', (e) => {
            e.currentTarget.classList.toggle('active');
            this.waterSystem.toggle(e.currentTarget.classList.contains('active'));
        });
        const waterLevel = document.getElementById('water-level');
        if (waterLevel) waterLevel.addEventListener('input', (e) => this.waterSystem.setLevel(parseFloat(e.target.value)));

        const waterOpacity = document.getElementById('water-opacity');
        if (waterOpacity) waterOpacity.addEventListener('input', (e) => this.waterSystem.setParams({ opacity: parseFloat(e.target.value) }));

        const waterColor = document.getElementById('water-color');
        if (waterColor) waterColor.addEventListener('input', (e) => this.waterSystem.setParams({ color: e.target.value }));

        // Paint Bindings
        document.querySelectorAll('[data-texture]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-texture]').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.tools.paint.setParams({ texture: e.currentTarget.dataset.texture });
            });
        });

        // Road Bindings
        const roadStart = document.getElementById('road-start');
        if (roadStart) roadStart.addEventListener('click', () => {
            this.ui.showToast('Click on terrain to place points', 'info');
            this.setActiveTool('road');
        });
        const roadClear = document.getElementById('road-clear');
        if (roadClear) roadClear.addEventListener('click', () => this.roadSystem.clear());
    }

    initInteraction() {
        const canvas = this.renderer.domElement;

        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click only
                if (e.target !== canvas) return;

                this.isMouseDown = true;

                if (this.activeToolName === 'sculpt' || this.activeToolName === 'paint') {
                    this.stateManager.saveState();
                }

                this.onInteract(e);
            }
        });

        window.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

            this.updateCursor();

            if (this.isMouseDown) {
                this.onInteract(e);
            }
        });
    }

    onInteract(e) {
        const intersect = this.terrainSystem.getIntersectPoint(this.mouse, this.camera);

        if (intersect) {
            const point = intersect.point;

            if (this.activeToolName === 'sculpt') {
                this.tools.sculpt.update(point, true);
            } else if (this.activeToolName === 'paint') {
                this.tools.paint.update(point, true);
            } else if (this.activeToolName === 'vegetation') {
                if (!this.isMouseDown) return;
                // Add veg with slight randomization
                if (Math.random() > 0.85) {
                    this.vegetationSystem.addVegetation(
                        this.activeVegetationType,
                        point,
                        new THREE.Vector3(1, 1 + Math.random(), 1), // scale
                        new THREE.Euler(0, Math.random() * Math.PI, 0) // rotation
                    );
                }
            } else if (this.activeToolName === 'road') {
                if (this.isMouseDown && !this._roadDebounce) {
                    this.roadSystem.addPoint(point);
                    this._roadDebounce = true;
                    setTimeout(() => this._roadDebounce = false, 200);
                }
            }
        }
    }

    updateCursor() {
        const intersect = this.terrainSystem.getIntersectPoint(this.mouse, this.camera);
        const cursor = document.getElementById('brush-cursor');

        if (intersect && (this.activeToolName === 'sculpt' || this.activeToolName === 'paint')) {
            cursor.style.display = 'block';
            cursor.style.left = `${(this.mouse.x + 1) / 2 * window.innerWidth - 25}px`;
            cursor.style.top = `${(-this.mouse.y + 1) / 2 * window.innerHeight - 25}px`;
        } else {
            cursor.style.display = 'none';
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const now = performance.now();
        const delta = now - this.lastTime;
        this.lastTime = now;

        // FPS Logic
        this.frameCount++;
        if (now >= this.lastFpsTime + 1000) {
            if (this.fpsElement) this.fpsElement.innerText = this.frameCount;
            this.frameCount = 0;
            this.lastFpsTime = now;
        }

        if (this.environmentSystem) this.environmentSystem.update();
        if (this.waterSystem) this.waterSystem.update(delta);
        if (this.minimapSystem) this.minimapSystem.update();

        // Update controls
        if (this.sceneManager) this.sceneManager.update();

        this.renderer.render(this.scene, this.camera);

        const vegCount = this.vegetationSystem ? Object.values(this.vegetationSystem.instances).reduce((acc, val) => acc + val.mesh.count, 0) : 0;
        const objCountEl = document.getElementById('objects');
        if (objCountEl) objCountEl.innerText = this.scene.children.length + vegCount;

        // Simple Memory Estimate (Heap) - Chrome Only
        if (performance.memory && document.getElementById('memory')) {
            document.getElementById('memory').innerText = Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB';
        }
    }

    saveProject() {
        const terrainMesh = this.terrainSystem.mesh;
        const data = {
            version: '2.0',
            timestamp: Date.now(),
            terrain: {
                vertices: Array.from(terrainMesh.geometry.attributes.position.array),
                colors: terrainMesh.geometry.attributes.color ? Array.from(terrainMesh.geometry.attributes.color.array) : []
            },
            vegetation: this.vegetationSystem.getAllVegetationData(),
            environment: this.environmentSystem.params,
            water: this.waterSystem.params,
            roadPoints: this.roadSystem.points.map(p => p.toArray())
        };

        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `project_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.ui.showToast('Project saved successfully!', 'success');
    }

    newProject() {
        if (confirm('Are you sure? Unsaved changes will be lost.')) {
            location.reload();
        }
    }

    loadProject(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                // Basic validation
                if (!data.version) throw new Error('Invalid project file');

                // Restore logic
                if (data.terrain) {
                    // Update terrain geometry
                    const vertices = new Float32Array(data.terrain.vertices);
                    this.terrainSystem.mesh.geometry.attributes.position.array.set(vertices);
                    this.terrainSystem.mesh.geometry.attributes.position.needsUpdate = true;
                    this.terrainSystem.mesh.geometry.computeVertexNormals();

                    if (data.terrain.colors && this.terrainSystem.mesh.geometry.attributes.color) {
                        const colors = new Float32Array(data.terrain.colors);
                        this.terrainSystem.mesh.geometry.attributes.color.array.set(colors);
                        this.terrainSystem.mesh.geometry.attributes.color.needsUpdate = true;
                    }
                }

                if (data.vegetation) {
                    this.vegetationSystem.restoreFromData(data.vegetation);
                }

                if (data.environment) {
                    this.environmentSystem.setParams(data.environment);
                }

                if (data.water) {
                    this.waterSystem.setParams(data.water);
                }

                if (data.roadPoints && this.roadSystem) {
                    this.roadSystem.clear();
                    data.roadPoints.forEach(p => this.roadSystem.addPoint(new THREE.Vector3(p.x, p.y, p.z)));
                }

                this.ui.showToast('Project loaded successfully!', 'success');
            } catch (err) {
                console.error(err);
                this.ui.showToast('Failed to load project', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Start
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
