export class SculptTool {
    constructor(app) {
        this.app = app;
        this.params = {
            mode: 'raise', // raise, lower, flatten, smooth, noise
            radius: 15,
            intensity: 0.5,
            hardness: 0.5
        };
    }

    update(point, isInteracting) {
        if (!isInteracting || !point) return;

        // Save state on first interaction frame? 
        // Note: Real state saving should happen on MouseDown (handled by App/Input) because this runs every frame.

        this.sculpt(point);
    }

    sculpt(point) {
        const terrain = this.app.terrainSystem.mesh;
        const positions = terrain.geometry.attributes.position.array;
        const radius = this.params.radius;
        const radSq = radius * radius;

        let modified = false;

        // Naive loop over all vertices (Optimization: Use a spatial hash or loop only bounds in future)
        // For 200x200 segments (40k verts), this is acceptable for desktop.

        for (let i = 0; i < positions.length; i += 3) {
            const dx = positions[i] - point.x;
            const dz = positions[i + 2] - point.z;

            // Optimization: Bounding box check before distance calculation
            if (Math.abs(dx) > radius || Math.abs(dz) > radius) continue;

            const distSq = dx * dx + dz * dz;

            if (distSq < radSq) {
                const dist = Math.sqrt(distSq);
                const falloff = Math.pow(1 - (dist / radius), this.params.hardness * 2 + 1);
                const strength = this.params.intensity * falloff * 0.5;

                const yIndex = i + 1;
                const currentH = positions[yIndex];

                switch (this.params.mode) {
                    case 'raise':
                        positions[yIndex] += strength;
                        break;
                    case 'lower':
                        positions[yIndex] -= strength;
                        break;
                    case 'flatten':
                        // Lerp towards target height (point.y)
                        positions[yIndex] = THREE.MathUtils.lerp(currentH, point.y, strength * 0.5);
                        break;
                    case 'smooth':
                        // Simplified smooth (average with neighbor logic requires more complex connectivity, 
                        // here we approximate by pushing towards average of local area if we implemented it, 
                        // effectively flatten usually serves as smooth in simple editors)
                        positions[yIndex] = THREE.MathUtils.lerp(currentH, point.y, strength * 0.1);
                        break;
                    case 'noise':
                        positions[yIndex] += (Math.random() - 0.5) * strength;
                        break;
                }
                modified = true;
            }
        }

        if (modified) {
            terrain.geometry.attributes.position.needsUpdate = true;
            terrain.geometry.computeVertexNormals();
        }
    }

    setParams(params) {
        this.params = { ...this.params, ...params };
    }
}
