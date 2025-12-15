export class EnvironmentSystem {
    constructor(app) {
        this.app = app;
        this.scene = app.scene;
        this.sunLight = null;
        this.ambientLight = null;

        // Find lights created in SceneManager
        this.scene.traverse(obj => {
            if (obj.name === 'sunLight') this.sunLight = obj;
            if (obj.name === 'ambientLight') this.ambientLight = obj;
        });

        this.params = {
            time: 12, // 0-24
            weather: 'clear', // clear, rain, snow, fog
            sunIntensity: 1.0,
            fogDensity: 0.002
        };

        this.particles = [];
        this.initParticles();
    }

    initParticles() {
        // Particle system for rain/snow
        const geometry = new THREE.BufferGeometry();
        const count = 10000;
        const positions = new Float32Array(count * 3);
        const velocities = [];

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 400;
            positions[i * 3 + 1] = Math.random() * 100;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 400;

            velocities.push({
                y: -(Math.random() * 0.5 + 0.5), // Fall speed
                x: (Math.random() - 0.5) * 0.1,
                z: (Math.random() - 0.5) * 0.1
            });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.2,
            transparent: true,
            opacity: 0.6,
            depthWrite: false
        });

        this.particleSystem = new THREE.Points(geometry, material);
        this.particleSystem.userData = { velocities };
        this.particleSystem.visible = false;
        this.scene.add(this.particleSystem);
        this.app.scene.children.push(this.particleSystem); // Ensure it's tracked
    }

    setTime(hour) {
        this.params.time = hour;
        if (!this.sunLight) return;

        // Simple sun orbit
        const angle = (hour / 24) * Math.PI * 2 - Math.PI / 2;
        const radius = 200;

        this.sunLight.position.x = Math.cos(angle) * radius;
        this.sunLight.position.y = Math.sin(angle) * radius;
        this.sunLight.position.z = 50; // Slight offset

        // Color temperature (simplified)
        // Dawn/Dusk: Orange, Noon: White, Night: Dark Blue
        let color = new THREE.Color(0xffffff);
        let intensity = this.params.sunIntensity;

        if (hour < 6 || hour > 18) {
            intensity *= 0.1; // Night
            color.setHex(0x1a237e);
        } else if (hour < 8 || hour > 16) {
            color.setHex(0xffaa00); // Golden hour
        }

        this.sunLight.intensity = intensity;
        this.sunLight.color.copy(color);

        // Background color
        if (hour > 6 && hour < 18) {
            this.scene.background.setHex(0x87ceeb); // Day
            this.scene.fog.color.setHex(0x87ceeb);
        } else {
            this.scene.background.setHex(0x0a0a0a); // Night
            this.scene.fog.color.setHex(0x0a0a0a);
        }
    }

    setWeather(type) {
        this.params.weather = type;

        if (type === 'rain' || type === 'snow') {
            this.particleSystem.visible = true;
            this.particleSystem.material.size = type === 'snow' ? 0.4 : 0.15;
            this.particleSystem.material.opacity = type === 'snow' ? 0.8 : 0.6;
        } else {
            this.particleSystem.visible = false;
        }

        if (type === 'fog' || type === 'storm') {
            this.scene.fog.density = 0.02;
        } else {
            this.scene.fog.density = this.params.fogDensity;
        }
    }

    setParam(key, value) {
        this.params[key] = value;

        if (key === 'sunIntensity') this.setTime(this.params.time); // Recalc
        if (key === 'fogDensity') this.scene.fog.density = value;
        if (key === 'time') this.setTime(value);
    }

    update() {
        if (this.particleSystem.visible) {
            const positions = this.particleSystem.geometry.attributes.position.array;
            const vels = this.particleSystem.userData.velocities;

            for (let i = 0; i < positions.length; i += 3) {
                const idx = i / 3;
                positions[i + 1] += vels[idx].y; // Fall Y
                positions[i] += vels[idx].x;
                positions[i + 2] += vels[idx].z;

                if (positions[i + 1] < 0) {
                    positions[i + 1] = 100; // Reset height
                }
            }
            this.particleSystem.geometry.attributes.position.needsUpdate = true;
        }
    }
}
