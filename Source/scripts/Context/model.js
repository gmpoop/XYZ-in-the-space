import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export default class ObjModel {
    constructor(scene, objPath, mtlPath, selfInit = true, ka = [1.0, 1.0, 1.0], kd  = [1.0, 1.0, 1.0], fbxPath = null) {
        this.scene = scene;
        this.objPath = objPath;
        this.mtlPath = mtlPath;
        this.ka = ka;
        this.kd = kd;
        this.fbxPath = fbxPath;
    
        if (selfInit) {
            this.initModel();
        }
    }

    async initModel() {
        if (this.fbxPath) {
            console.log('Cargando modelo FBX:', this.fbxPath);  
            return await this.loadFBXModel();
        } else {
            console.log('Cargando modelo OBJ:', this.objPath, this.mtlPath);
            return await this.loadOBJModel();
        }
    }

    async loadOBJModel() {
        const objLoader = new OBJLoader();
        const mtlLoader = new MTLLoader();

        if(this.mesh) {
            this.scene.remove(this.mesh);
        }

        return new Promise((resolve, reject) => {
            mtlLoader.load(this.mtlPath, (materials) => {
                materials.preload();
                objLoader.setMaterials(materials);
                objLoader.load(this.objPath, (object) => {
                    this.scene.add(object);
                    this.mesh = object;
                    resolve(object);
                }, undefined, reject);
            });
        });
    }

  

    async loadFBXModel() {
        const fbxLoader = new FBXLoader();
    
        // Elimina el modelo previo de la escena    
        this.clean_memory();
    
        return new Promise((resolve, reject) => {
            fbxLoader.load(
                this.fbxPath,
                (object) => {
                    // Verifica si el modelo cargado es válido
                    if (!object) {
                        return reject(new Error('El modelo cargado no es válido.'));
                    }
    
                    // Agrega el modelo a la escena
                    this.scene.add(object);
                    this.mesh = object;

                    fbxLoader.load(this.fbxPath, (object) => {
                    
                        // Inspeccionar los materiales del modelo
                        object.traverse((child) => {
                            if (child.isMesh) {
                                const material = child.material;
                    
                                if (Array.isArray(material)) {
                                    material.forEach((mat, index) => {
                                        console.log(`Material ${index}:`, mat);
                                        if (mat.map) console.log('Textura cargada:', mat.map);
                                        else console.warn(`Material ${index} no tiene textura.`);
                                    });
                                } else {
                                    console.log('Material:', material);
                                    if (material.map) console.log('Textura cargada:', material.map);
                                    else console.warn('Este material no tiene textura.');
                                }
                            }
                        });
                    });
                    
    
                    // Resuelve la promesa con el modelo cargado
                    resolve(object);
                },
                undefined,
                (error) => {
                    console.error('Error al cargar el modelo FBX:', error);
                    reject(error); // Rechaza la promesa con el error
                }
            );
        });
    }
    

    isLoaded() {
        return this.mesh !== undefined;
    }

    clean_memory(){
         
        // Elimina el modelo previo de la escena
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry?.dispose(); // Libera la geometría de memoria
            this.mesh.material?.dispose(); // Libera el material de memoria
            this.mesh = null; // Limpia la referencia
        }

    }

    destroy() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
    }

    
}