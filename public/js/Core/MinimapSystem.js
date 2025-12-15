export class MinimapSystem {
    constructor(app) {
        this.app = app;
        this.canvas = document.getElementById('minimap-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.size = 200;

        this.canvas.width = this.size;
        this.canvas.height = this.size;

        // Offscreen buffer for static terrain
        this.terrainBuffer = document.createElement('canvas');
        this.terrainBuffer.width = this.size;
        this.terrainBuffer.height = this.size;
        this.bufferCtx = this.terrainBuffer.getContext('2d');

        this.needsUpdate = true;

        this.initListeners();
    }

    initListeners() {
        document.getElementById('minimap-refresh').addEventListener('click', () => {
            this.needsUpdate = true;
        });
        document.getElementById('minimap-close').addEventListener('click', () => {
            document.getElementById('minimap-container').classList.add('hidden');
        });

        // Auto update when terrain tools are used (optional hook)
        // For now, manual refresh or interval
        setInterval(() => this.needsUpdate = true, 2000); // 2 sec auto refresh
    }

    update() {
        if (document.getElementById('minimap-container').classList.contains('hidden')) return;

        if (this.needsUpdate) {
            this.renderTerrain();
            this.needsUpdate = false;
        }

        this.renderScene();
    }

    renderTerrain() {
        if (!this.app.terrainSystem.mesh) return;

        const vertices = this.app.terrainSystem.mesh.geometry.attributes.position.array;
        const colors = this.app.terrainSystem.mesh.geometry.attributes.color.array;
        const segments = Math.sqrt(vertices.length / 3);
        const ratio = segments / this.size;

        const imgData = this.bufferCtx.createImageData(this.size, this.size);
        const data = imgData.data;

        // Plane is mostly 200x200 centered at 0,0. Range -100 to 100.
        // Map 0..200 pixel to -100..100 world

        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                // Invert Y for texture logic vs world
                const vX = Math.floor(x * ratio);
                const vY = Math.floor((this.size - 1 - y) * ratio);

                const i = (vY * segments + vX) * 3;

                if (i < colors.length) {
                    const idx = (y * this.size + x) * 4;
                    data[idx] = colors[i] * 255;
                    data[idx + 1] = colors[i + 1] * 255;
                    data[idx + 2] = colors[i + 2] * 255;
                    data[idx + 3] = 255;
                }
            }
        }

        this.bufferCtx.putImageData(imgData, 0, 0);
    }

    renderScene() {
        // 1. Draw cached terrain
        this.ctx.clearRect(0, 0, this.size, this.size);
        this.ctx.drawImage(this.terrainBuffer, 0, 0);

        // 2. Draw Camera Icon
        const cam = this.app.camera;
        // Map cam x,z to 0..200
        // World: -100..100 -> Canvas: 0..200
        const cx = (cam.position.x + 100) * (this.size / 200);
        const cy = (cam.position.z + 100) * (this.size / 200);

        // Invert Y? Canvas Y is down, World Z is "down" in top view? 
        // Typically World Z+ is "down" in 2D map view.
        // 0,0 is Top-Left. World -100,-100 (Top-Left).
        // So Z maps to Y directly.

        this.ctx.save();
        this.ctx.translate(cx, cy);

        // Rotate (Cam rotation is local, get world direction)
        const dir = new THREE.Vector3();
        cam.getWorldDirection(dir);
        const angle = Math.atan2(dir.x, dir.z); // Check atan2 param order
        this.ctx.rotate(angle); // Might need offset

        // Draw Arrow
        this.ctx.fillStyle = '#2563eb';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -8);
        this.ctx.lineTo(5, 5);
        this.ctx.lineTo(0, 3);
        this.ctx.lineTo(-5, 5);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
    }
}
