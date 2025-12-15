export class VegetationSystem {
    constructor(scene) {
        this.scene = scene;
        this.instances = {}; // Map of type -> { mesh: InstancedMesh, data: [] }
        this.maxInstances = 10000;

        this.materials = {
            tree: new THREE.MeshStandardMaterial({ color: 0x0d5c0d }),
            bush: new THREE.MeshStandardMaterial({ color: 0x2d7a2d }),
            rock: new THREE.MeshStandardMaterial({ color: 0x606060 }),
            grass: new THREE.MeshStandardMaterial({ color: 0x4a9d4a }),
            flower: new THREE.MeshStandardMaterial({ color: 0xff69b4 }),
            cactus: new THREE.MeshStandardMaterial({ color: 0x2d5c2d })
        };

        this.geometries = {
            tree: new THREE.ConeGeometry(1, 5, 8),
            bush: new THREE.SphereGeometry(1.5, 8, 6),
            rock: new THREE.DodecahedronGeometry(1),
            grass: new THREE.ConeGeometry(0.3, 1.5, 4),
            flower: new THREE.SphereGeometry(0.5, 8, 8),
            cactus: new THREE.CylinderGeometry(0.5, 0.5, 3, 8)
        };

        this.initInstancedMeshes();
    }

    initInstancedMeshes() {
        Object.keys(this.geometries).forEach(type => {
            const geometry = this.geometries[type];
            const material = this.materials[type];

            const mesh = new THREE.InstancedMesh(geometry, material, this.maxInstances);
            mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            mesh.count = 0; // Start empty
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            this.scene.add(mesh);
            this.instances[type] = {
                mesh: mesh,
                data: [] // Stores {position, scale, rotation} logic for internal tracking
            };
        });
    }

    addVegetation(type, position, scale = new THREE.Vector3(1, 1, 1), rotation = new THREE.Euler()) {
        if (!this.instances[type]) return;

        const group = this.instances[type];
        if (group.mesh.count >= this.maxInstances) return; // Limit reached

        const dummy = new THREE.Object3D();
        dummy.position.copy(position);
        dummy.scale.copy(scale);
        dummy.rotation.copy(rotation);
        dummy.updateMatrix();

        group.mesh.setMatrixAt(group.mesh.count, dummy.matrix);
        group.mesh.count++;
        group.mesh.instanceMatrix.needsUpdate = true;

        // Keep local data for saving/restoring
        group.data.push({
            position: position.toArray(),
            scale: scale.toArray(),
            rotation: rotation.toArray()
        });
    }

    // Returns a serializable object of all vegetation for Undo/Save
    getAllVegetationData() {
        const allData = [];
        Object.keys(this.instances).forEach(type => {
            this.instances[type].data.forEach(item => {
                allData.push({
                    type: type,
                    p: item.position,
                    s: item.scale,
                    r: item.rotation
                });
            });
        });
        return allData;
    }

    restoreFromData(dataArray) {
        if (!dataArray) return;

        // Clear all
        Object.keys(this.instances).forEach(type => {
            this.instances[type].mesh.count = 0;
            this.instances[type].data = [];
            this.instances[type].mesh.instanceMatrix.needsUpdate = true;
        });

        // Add back
        const dummy = new THREE.Object3D();
        dataArray.forEach(item => {
            const group = this.instances[item.type];
            if (group && group.mesh.count < this.maxInstances) {
                dummy.position.fromArray(item.p);
                dummy.scale.fromArray(item.s);
                dummy.rotation.fromArray(item.r);
                dummy.updateMatrix();

                group.mesh.setMatrixAt(group.mesh.count, dummy.matrix);
                group.mesh.count++;

                group.data.push({
                    position: item.p,
                    scale: item.s,
                    rotation: item.r
                });
            }
        });

        // Update all matrices
        Object.keys(this.instances).forEach(type => {
            this.instances[type].mesh.instanceMatrix.needsUpdate = true;
        });
    }
}
