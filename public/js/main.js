import { SceneManager } from './Core/SceneManager.js';
import { StateManager } from './Core/StateManager.js';
import { TerrainSystem } from './Terrain/TerrainSystem.js';
import { VegetationSystem } from './Objects/VegetationSystem.js';
import { UIManager } from './UI/UIManager.js';
import { SculptTool } from './Tools/SculptTool.js';

class App {
    constructor() {
        this.sceneManager = new SceneManager('canvas-container');
        this.scene = this.sceneManager.getScene();
        this.camera = this.sceneManager.getCamera();
        this.renderer = this.sceneManager.getRenderer();

        this.terrainSystem = new TerrainSystem(this.scene);
        this.vegetationSystem = new VegetationSystem(this.scene);
        this.stateManager = new StateManager(this); // Pass app for access to systems

        this.tools = {
            sculpt: new SculptTool(this),
            // other tools...
        };

        this.activeToolName = 'sculpt';
        this.activeVegetationType = 'tree';

        this.ui = new UIManager(this);

        this.mouse = new THREE.Vector2();
        this.isMouseDown = false;
        this.raycaster = new THREE.Raycaster();

        this.initInteraction();
        this.animate();

        // Initial state save
        setTimeout(() => this.stateManager.saveState(), 100);
    }

    setActiveTool(name) {
        this.activeToolName = name;
    }

    initInteraction() {
        const canvas = this.renderer.domElement;

        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click only
                this.isMouseDown = true;
                this.stateManager.saveState(); // Save BEFORE action
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
        const intersect = this.terrainSystem.getInteconnectPoint(this.mouse, this.camera);

        if (intersect) {
            const point = intersect.point;

            if (this.activeToolName === 'sculpt') {
                this.tools.sculpt.update(point, true);
            } else if (this.activeToolName === 'vegetation') {
                // For vegetation, we usually want click-to-place, not drag
                // But for now, let's allow "painting" trees if dragged, or just click
                // We'll limit it in the system logic if needed or just use density check
                if (Math.random() > 0.8) { // Simple density throttle for dragging
                    this.vegetationSystem.addVegetation(
                        this.activeVegetationType,
                        point,
                        new THREE.Vector3(1, 1 + Math.random(), 1),
                        new THREE.Euler(0, Math.random() * Math.PI, 0)
                    );
                }
            }
        }
    }

    updateCursor() {
        const intersect = this.terrainSystem.getInteconnectPoint(this.mouse, this.camera);
        const cursor = document.getElementById('brush-cursor');

        if (intersect) {
            cursor.style.display = 'block';
            cursor.style.left = `${(this.mouse.x + 1) / 2 * window.innerWidth - 25}px`; // Approx centering
            cursor.style.top = `${(-this.mouse.y + 1) / 2 * window.innerHeight - 25}px`;
            // Note: Real 3D cursor would be better, but we are reusing the CSS one for now
        } else {
            cursor.style.display = 'none';
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Render
        this.renderer.render(this.scene, this.camera);

        // Update stats
        document.getElementById('objects').innerText = this.scene.children.length; // Approximate
    }

    saveProject() {
        // TODO: Serialize and download JSON
        this.ui.showToast('Project saving not fully implemented in refactor yet', 'warning');
    }
}

// Start
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
