export class UIManager {
    constructor(app) {
        this.app = app;

        this.sidebar = document.querySelector('.sidebar');
        this.propertiesPanel = document.querySelector('.properties-panel');
        this.layersPanel = document.querySelector('.layers-panel');

        this.initEventListeners();
    }

    initEventListeners() {
        // Tool Selection
        document.querySelectorAll('.tool-icon').forEach(icon => {
            icon.addEventListener('click', (e) => {
                const tool = e.currentTarget.dataset.tool;
                this.app.setActiveTool(tool);

                // UI Update
                document.querySelectorAll('.tool-icon').forEach(i => i.classList.remove('active'));
                e.currentTarget.classList.add('active');

                this.updatePropertiesPanel(tool);
            });
        });

        // Top Menu Dropdowns
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                // Close others
                document.querySelectorAll('.dropdown-menu').forEach(m => {
                    if (m !== item.querySelector('.dropdown-menu')) m.classList.remove('show');
                });
                const dropdown = item.querySelector('.dropdown-menu');
                if (dropdown) dropdown.classList.toggle('show');
            });
        });

        // Close dropdowns on click outside
        window.addEventListener('click', () => {
            document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
        });

        // Menu Actions
        document.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleMenuAction(action);
            });
        });

        // File Input Binding
        const fileInput = document.getElementById('file-input-project');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.app.loadProject(e.target.files[0]);
                }
            });
        }

        // Undo/Redo Buttons (Visual only, logic in App)
        document.getElementById('undo-btn').addEventListener('click', () => this.app.stateManager.undo());
        document.getElementById('redo-btn').addEventListener('click', () => this.app.stateManager.redo());

        // Keyboard Shortcuts
        window.addEventListener('keydown', (e) => this.handleShortcuts(e));

        this.setupPropertyControls();
    }

    handleShortcuts(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            this.app.stateManager.undo();
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'Z' && e.shiftKey))) {
            e.preventDefault();
            this.app.stateManager.redo();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            // TODO: Implement Save
            this.app.saveProject();
        }
    }

    updatePropertiesPanel(tool) {
        // Hide all sections
        document.querySelectorAll('.panel-section').forEach(el => el.style.display = 'none');

        // Show relevant section
        const map = {
            'sculpt': 'sculpt-props',
            'paint': 'paint-props',
            'vegetation': 'vegetation-props',
            'environment': 'environment-props',
            'water': 'water-props',
            'road': 'road-props'
        };

        const sectionId = map[tool];
        if (sectionId) {
            const el = document.getElementById(sectionId);
            if (el) {
                el.style.display = 'block';
                this.propertiesPanel.classList.add('show');
            }
        }
    }

    setupPropertyControls() {
        // Sculpt Params
        document.querySelectorAll('[data-sculpt]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-sculpt]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                if (this.app.tools.sculpt) {
                    this.app.tools.sculpt.setParams({ mode: e.target.dataset.sculpt });
                }
            });
        });

        const bindSlider = (id, callback) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', (e) => {
                    const val = parseFloat(e.target.value);
                    // Update display val
                    const display = document.getElementById(`${id}-val`);
                    if (display) display.innerText = val;

                    callback(val);
                });
            }
        };

        bindSlider('brush-radius', (v) => this.app.tools.sculpt.setParams({ radius: v }));
        bindSlider('brush-intensity', (v) => this.app.tools.sculpt.setParams({ intensity: v }));

        // Vegetation Type
        document.querySelectorAll('[data-veg]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-veg]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.app.activeVegetationType = e.target.dataset.veg;
            });
        });
    }

    handleMenuAction(action) {
        switch (action) {
            case 'new':
                this.app.newProject();
                break;
            case 'open':
                document.getElementById('file-input-project').click();
                break;
            case 'save':
                this.app.saveProject();
                break;
            case 'undo':
                this.app.stateManager.undo();
                break;
            case 'redo':
                this.app.stateManager.redo();
                break;
            case 'reset':
                this.app.newProject();
                break;
            case 'toggle-minimap':
                document.getElementById('minimap-container').classList.toggle('hidden');
                break;
            case 'toggle-grid':
                document.getElementById('grid-overlay').classList.toggle('show');
                break;
            case 'toggle-stats':
                // Easy toggle if we had a class, for now toggle opacity?
                const stats = document.querySelector('.stats-bar');
                stats.style.opacity = stats.style.opacity === '0' ? '1' : '0';
                break;
            case 'fullscreen':
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    }
                }
                break;
            default:
                this.showToast(`Action '${action}' not yet implemented`, 'warning');
        }
    }

    showToast(msg, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<div class="toast-message">${msg}</div>`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}
