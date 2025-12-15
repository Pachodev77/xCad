export class RoadSystem {
    constructor(scene) {
        this.scene = scene;
        this.points = []; // Vector3[]
        this.mesh = null;
        this.previewLine = null;
    }

    addPoint(point) {
        // Raise slighty above terrain
        const p = point.clone();
        p.y += 0.5;
        this.points.push(p);
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
        const geometry = new THREE.TubeGeometry(curve, this.points.length * 10, 2, 8, false);
        const material = new THREE.MeshStandardMaterial({ color: 0x333333 });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
    }
}
