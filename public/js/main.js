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
        // ... previous inits
        this.minimapSystem = new MinimapSystem(this);

        // Performance Monitoring
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.fpsElement = document.getElementById('fps');

        // ...
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const now = performance.now();
        const delta = now - this.lastTime;

        // FPS Logic
        this.frameCount++;
        if (now >= this.lastFpsTime + 1000) {
            this.fpsElement.innerText = this.frameCount;
            this.frameCount = 0;
            this.lastFpsTime = now;
        }

        if (this.environmentSystem) this.environmentSystem.update();
        if (this.waterSystem) this.waterSystem.update(delta);
        if (this.minimapSystem) this.minimapSystem.update();

        this.renderer.render(this.scene, this.camera);

        const vegCount = Object.values(this.vegetationSystem.instances).reduce((acc, val) => acc + val.mesh.count, 0);
        document.getElementById('objects').innerText = this.scene.children.length + vegCount;

        // Simple Memory Estimate (Heap) - Chrome Only
        if (performance.memory) {
            document.getElementById('memory').innerText = Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB';
        }
    }

    // ... rest of class logic ...


// Start
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
