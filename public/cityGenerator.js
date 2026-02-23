// 对应文档：研究多领域跨视觉模态数据的特征提取与融合技术
class CityGenerator {
    constructor(scene) {
        this.scene = scene;
        this.buildings = [];
        this.mesh = null;
        this.dummy = new THREE.Object3D();
        this.color = new THREE.Color();
        this.geometry = new THREE.BoxGeometry(1, 1, 1);
        this.geometry.translate(0, 0.5, 0);
    }

    async generate(data) {
        this.clear();
        const count = data.structures.length;
        
        console.log(`🏗 Generating ${count} structures`);

        // For single tower or small count, use individual meshes to ensure visibility
        if (count <= 1) {
            data.structures.forEach((b, i) => {
                const geom = new THREE.BoxGeometry(1, 1, 1);
                geom.translate(0, 0.5, 0);
                
                const color = new THREE.Color().setHex(b.color);
                const mat = new THREE.MeshStandardMaterial({ 
                    color: color,
                    roughness: 0.2, 
                    metalness: 0.8
                });
                
                const mesh = new THREE.Mesh(geom, mat);
                mesh.position.set(b.position.x, 0, b.position.z);
                mesh.scale.set(3, b.height, 3);
                mesh.castShadow = true;
                this.scene.add(mesh);
                
                console.log(`✓ Tower ${i}: type=${b.type}, color=0x${b.color.toString(16).padStart(6, '0')}, h=${b.height.toFixed(1)}`);
            });
        } else {
            // For multiple buildings, use InstancedMesh
            const material = new THREE.MeshStandardMaterial({ 
                roughness: 0.2, 
                metalness: 0.8
            });
            
            this.mesh = new THREE.InstancedMesh(this.geometry, material, count);
            this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

            data.structures.forEach((b, i) => {
                this.dummy.position.set(b.position.x, 0, b.position.z);
                this.dummy.scale.set(3, b.height, 3);
                this.dummy.updateMatrix();
                this.mesh.setMatrixAt(i, this.dummy.matrix);
                
                this.color.setHex(b.color);
                this.mesh.setColorAt(i, this.color);
            });
            
            if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
            this.mesh.instanceMatrix.needsUpdate = true;
            this.scene.add(this.mesh);
        }

        const gridHelper = new THREE.GridHelper(400, 40, 0x444444, 0x222222);
        this.scene.add(gridHelper);

        const ambientLight = new THREE.AmbientLight(0x606060, 1.5);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(50, 80, 50);
        dirLight.castShadow = true;
        this.scene.add(dirLight);

        console.log(`✅ Mesh added to scene`);
        return count;
    }

    clear() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            this.mesh = null;
        }

        // Remove non-important helpers/lights conservatively
        for (let i = this.scene.children.length - 1; i >= 0; i--) {
            const c = this.scene.children[i];
            if (c.type === 'GridHelper' || c.type === 'AmbientLight' || c.type === 'DirectionalLight') {
                this.scene.remove(c);
            }
        }
    }
}
