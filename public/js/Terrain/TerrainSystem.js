export class TerrainSystem {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.width = 200;
        this.depth = 200;
        this.segments = 199;
        this.raycaster = new THREE.Raycaster();

        this.init();
    }

    init() {
        const geometry = new THREE.PlaneGeometry(this.width, this.depth, this.segments, this.segments);
        geometry.rotateX(-Math.PI / 2);

        // Vertex Colors
        const count = geometry.attributes.position.count;
        geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));

        const colors = geometry.attributes.color;
        for (let i = 0; i < count; i++) {
            // Default green
            colors.setXYZ(i, 0.2, 0.6, 0.2);
        }

        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.8,
            metalness: 0.1,
            flatShading: true, // Low poly look
            side: THREE.DoubleSide
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
        this.mesh.name = 'Terrain';

        this.scene.add(this.mesh);

        // Initial Noise Generation
        this.generateTerrain();
    }

    generateTerrain() {
        const vertices = this.mesh.geometry.attributes.position.array;

        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];

            // Simple multi-octave noise (removing dependence on external lib for simplicity, using Math.sin sum)
            // Ideally we'd import SimplexNoise, but to keep dependencies low we use a pseudo-noise
            const y = (Math.sin(x * 0.05) + Math.cos(z * 0.05)) * 2 +
                (Math.sin(x * 0.1 + z * 0.1)) * 1;

            vertices[i + 1] = y;
        }

        this.mesh.geometry.attributes.position.needsUpdate = true;
        this.mesh.geometry.computeVertexNormals();
    }

    getHeightAt(x, z) {
        // Raycast from top down to find exact height
        const origin = new THREE.Vector3(x, 200, z);
        const direction = new THREE.Vector3(0, -1, 0);

        this.raycaster.set(origin, direction);
        const intersects = this.raycaster.intersectObject(this.mesh);

        if (intersects.length > 0) {
            return intersects[0].point.y;
        }
        return 0;
    }

    getIntersectPoint(pointer, camera) {
        this.raycaster.setFromCamera(pointer, camera);
        const intersects = this.raycaster.intersectObject(this.mesh);
        return intersects.length > 0 ? intersects[0] : null;
    }
}
