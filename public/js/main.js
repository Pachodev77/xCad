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

        this.stateManager = new StateManager(this); // Pass app for access to systems

        this.tools = {
            sculpt: new SculptTool(this),
            paint: new PaintTool(this),
            // other tools...
        };

        this.activeToolName = 'sculpt';
        this.activeVegetationType = 'tree';

        this.ui = new UIManager(this);

        this.mouse = new THREE.Vector2();
        this.isMouseDown = false;
        this.raycaster = new THREE.Raycaster();

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
        document.getElementById('time-slider').addEventListener('input', (e) => this.environmentSystem.setParam('time', parseFloat(e.target.value)));
        document.getElementById('fog-density').addEventListener('input', (e) => this.environmentSystem.setParam('fogDensity', parseFloat(e.target.value)));
        document.querySelectorAll('[data-weather]').forEach(btn => {
            btn.addEventListener('click', (e) => this.environmentSystem.setWeather(e.target.dataset.weather));
        });

        // Water Bindings
        document.getElementById('water-toggle').addEventListener('click', (e) => {
            e.currentTarget.classList.toggle('active');
            this.waterSystem.toggle(e.currentTarget.classList.contains('active'));
        });
        document.getElementById('water-level').addEventListener('input', (e) => this.waterSystem.setLevel(parseFloat(e.target.value)));
        document.getElementById('water-opacity').addEventListener('input', (e) => this.waterSystem.setParams({ opacity: parseFloat(e.target.value) }));
        document.getElementById('water-color').addEventListener('input', (e) => this.waterSystem.setParams({ color: e.target.value }));

        // Paint Bindings
        document.querySelectorAll('[data-texture]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-texture]').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.tools.paint.setParams({ texture: e.currentTarget.dataset.texture });
            });
        });

        // Road Bindings
        document.getElementById('road-start').addEventListener('click', () => {
            this.ui.showToast('Click on terrain to place points', 'info');
        });
        document.getElementById('road-clear').addEventListener('click', () => this.roadSystem.clear());
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

        canvas.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });

        canvas.addEventListener('mousemove', (e) => {
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
                if (Math.random() > 0.85) {
                    this.vegetationSystem.addVegetation(
                        this.activeVegetationType,
                        point,
                        new THREE.Vector3(1, 1 + Math.random(), 1),
                        new THREE.Euler(0, Math.random() * Math.PI, 0)
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

        if (intersect) {
            cursor.style.display = 'block';
            cursor.style.left = `${(this.mouse.x + 1) / 2 * window.innerWidth - 25}px`;
            cursor.style.top = `${(-this.mouse.y + 1) / 2 * window.innerHeight - 25}px`;
        } else {
            cursor.style.display = 'none';
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = 16;

        if (this.environmentSystem) this.environmentSystem.update();
        if (this.waterSystem) this.waterSystem.update(delta);

        this.renderer.render(this.scene, this.camera);

        const vegCount = Object.values(this.vegetationSystem.instances).reduce((acc, val) => acc + val.mesh.count, 0);
        document.getElementById('objects').innerText = this.scene.children.length + vegCount;
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
}

// Start
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
