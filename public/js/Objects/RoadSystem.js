export class RoadSystem {
    constructor(scene) {
        this.scene = scene;
        this.points = []; // Vector3[]
        this.mesh = null;
        this.params = {
            width: 8,
            smoothness: 50,
            elevation: 0.2
        };
    }

    addPoint(point) {
        // Raise slighty above terrain based on param
        const p = point.clone();
        p.y += this.params.elevation;
        this.points.push(p);
        this.updateMesh();
    }

    setParams(params) {
        this.params = { ...this.params, ...params };
        this.updateMesh();
    }

    clear() {
        this.points = [];
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh = null;
        }
    }

    updateMesh() {
        // Need at least 2 points for a curve
        if (this.points.length < 2) return;

        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
        }

        const curve = new THREE.CatmullRomCurve3(this.points);
        // TubeGeometry: path, tubularSegments, radius, radialSegments, closed
        // segments = len * smoothness, radius = width/2
        const segments = Math.max(10, this.points.length * (this.params.smoothness / 5));
        const geometry = new THREE.TubeGeometry(curve, segments, this.params.width / 2, 8, false);
        const material = new THREE.MeshStandardMaterial({ color: 0x333333 });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
    }
}
