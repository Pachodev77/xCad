export class StateManager {
    constructor(app) {
        this.app = app;
        this.history = [];
        this.historyIndex = -1;
        this.maxStates = 50;
        this.isSaving = false;
    }

    saveState() {
        if (this.isSaving || !this.app.terrainSystem.mesh) return;

        this.isSaving = true;

        const terrainMesh = this.app.terrainSystem.mesh;

        // Clone Float32Arrays for speed
        const vertices = new Float32Array(terrainMesh.geometry.attributes.position.array);
        const colors = terrainMesh.geometry.attributes.color ?
            new Float32Array(terrainMesh.geometry.attributes.color.array) : null;

        // Clone Vegetation Data
        const vegetation = this.app.vegetationSystem.getAllVegetationData();

        const state = {
            vertices,
            colors,
            vegetation,
            timestamp: Date.now()
        };

        // Slice history if we are in the middle
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(state);
        this.historyIndex++;

        if (this.history.length > this.maxStates) {
            this.history.shift();
            this.historyIndex--;
        }

        this.updateButtons();
        this.isSaving = false;
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.applyState(this.history[this.historyIndex]);
            this.app.ui.showToast('Deshacer', 'info');
            this.updateButtons();
        } else {
            this.app.ui.showToast('No hay más acciones para deshacer', 'warning');
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.applyState(this.history[this.historyIndex]);
            this.app.ui.showToast('Rehacer', 'info');
            this.updateButtons();
        } else {
            this.app.ui.showToast('No hay más acciones para rehacer', 'warning');
        }
    }

    applyState(state) {
        if (!state) return;

        // Apply Terrain
        const terrainMesh = this.app.terrainSystem.mesh;
        terrainMesh.geometry.attributes.position.array.set(state.vertices);
        terrainMesh.geometry.attributes.position.needsUpdate = true;

        if (state.colors && terrainMesh.geometry.attributes.color) {
            terrainMesh.geometry.attributes.color.array.set(state.colors);
            terrainMesh.geometry.attributes.color.needsUpdate = true;
        }

        terrainMesh.geometry.computeVertexNormals();

        // Apply Vegetation (Rebuild system)
        this.app.vegetationSystem.restoreFromData(state.vegetation);
    }

    updateButtons() {
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');

        if (undoBtn) undoBtn.disabled = this.historyIndex <= 0;
        if (redoBtn) redoBtn.disabled = this.historyIndex >= this.history.length - 1;
    }
}
