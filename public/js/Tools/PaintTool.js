export class PaintTool {
    constructor(app) {
        this.app = app;
        this.params = {
            texture: 'grass',
            opacity: 1.0,
            blend: 0.5,
            radius: 15,
            hardness: 0.5
        };

        this.colors = {
            grass: new THREE.Color(0x3a9d3a),
            dirt: new THREE.Color(0x8b4513),
            stone: new THREE.Color(0x808080),
            sand: new THREE.Color(0xe6daa6),
            snow: new THREE.Color(0xffffff),
            rock: new THREE.Color(0x505050)
        };
    }

    update(point, isInteracting) {
        if (!isInteracting || !point) return;
        this.paint(point);
    }

    paint(point) {
        const terrain = this.app.terrainSystem.mesh;
        if (!terrain.geometry.attributes.color) return;

        const colors = terrain.geometry.attributes.color.array;
        const positions = terrain.geometry.attributes.position.array;

        const radius = this.params.radius;
        const radSq = radius * radius;
        const targetColor = this.colors[this.params.texture];

        // Safety check if color undefined
        if (!targetColor) return;

        let modified = false;

        for (let i = 0; i < positions.length; i += 3) {
            const dx = positions[i] - point.x;
            const dz = positions[i + 2] - point.z;

            // Optimization: Bounding box check
            if (Math.abs(dx) > radius || Math.abs(dz) > radius) continue;

            const distSq = dx * dx + dz * dz;

            if (distSq < radSq) {
                const dist = Math.sqrt(distSq);
                // Falloff calculation
                const falloff = Math.pow(1 - (dist / radius), this.params.hardness * 2 + 1);

                // Calculate blend factor
                const factor = this.params.opacity * falloff * (this.params.blend * 0.5 + 0.1);

                // Current color
                const r = colors[i];
                const g = colors[i + 1];
                const b = colors[i + 2];

                // Lerp towards target
                colors[i] = THREE.MathUtils.lerp(r, targetColor.r, factor);
                colors[i + 1] = THREE.MathUtils.lerp(g, targetColor.g, factor);
                colors[i + 2] = THREE.MathUtils.lerp(b, targetColor.b, factor);

                modified = true;
            }
        }

        if (modified) {
            terrain.geometry.attributes.color.needsUpdate = true;
        }
    }

    setParams(params) {
        this.params = { ...this.params, ...params };
    }
}
