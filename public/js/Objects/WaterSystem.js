export class WaterSystem {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.isActive = false;
        this.level = 0;
        this.params = {
            opacity: 0.6,
            color: 0x1e90ff,
            waveSpeed: 1.0
        };

        this.init();
    }

    init() {
        const geometry = new THREE.PlaneGeometry(1000, 1000);
        geometry.rotateX(-Math.PI / 2);

        const material = new THREE.MeshPhongMaterial({
            color: this.params.color,
            transparent: true,
            opacity: this.params.opacity,
            side: THREE.DoubleSide,
            shininess: 80
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.visible = false; // Start hidden
        this.mesh.position.y = this.level;
        this.scene.add(this.mesh);
    }

    toggle(active) {
        this.isActive = active;
        this.mesh.visible = active;
    }

    setLevel(y) {
        this.level = y;
        this.mesh.position.y = y;
    }

    setParams(params) {
        this.params = { ...this.params, ...params };

        if (params.color !== undefined) {
            this.mesh.material.color.set(params.color);
        }
        if (params.opacity !== undefined) {
            this.mesh.material.opacity = params.opacity;
        }
    }

    update(deltaTime) {
        if (!this.isActive) return;

        // Simple wave animation (bobbing up and down slightly)
        // In a real shader this would be vertex displacement
        const time = Date.now() * 0.001 * this.params.waveSpeed;
        this.mesh.position.y = this.level + Math.sin(time) * 0.05;
    }
}
