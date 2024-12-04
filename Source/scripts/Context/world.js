import * as THREE from 'three'
import Skydome from "./skydome.js";
import ObjModel from "../Context/model.js";


const SUN_LIGHT_COLOR = 0xfcffb5;
const FLOOR_COLOR = 0x02ab5f;
const METEROID_QUANTITY = 1;

export default class World {

    constructor(){
    // Creamos la escena (mundo) que contendrá todos los objetos que se mostrarán
    this.scene = new THREE.Scene();
    
    // Creamos la cámara desde la que se verá el mundo
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Creamos el renderizador que graficará toda la lógica de three.js en nuestra página
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Creamos el skydome
    this.skydome = {};
    this.skydome.background = new Skydome(this.scene, 'textures/parallax-space-backgound.png', 500, 500, 500);

    // Inicializamos el mundo


    // Creamos la luz direccional (sol)



    this.sun = new THREE.SpotLight(SUN_LIGHT_COLOR, 1);

  }

  async initWorld(){      

    document.body.style.cursor = 'wait';

    const scene = this.scene;
    const camera = this.camera;
    const renderer = this.renderer;
    const sun = this.sun;
    
    
    const data = await this.render_waiting();


    if(data.error){
      console.error(data.message);
      return;
    }

    this.skydome.background .initSkydome();

    camera.position.set(0, 1, 15);
    camera.lookAt(0, 0, 0);
    
    // Juntamos el renderizador a nuestro documento html
    document.body.appendChild(renderer.domElement);
        
    // Inicializamos la luz direccional (sol)
    sun.position.set(100, 100, 100);
    sun.target.position.set(0, 0, 0);
    sun.angle = Math.PI / 4;
    sun.penumbra = 0.1;
    sun.castShadow = true;
  
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 500;


    scene.add(sun);
    scene.add(sun.target);
    
    // Inicializamos la luz ambiental
    const light = new THREE.AmbientLight(0xb3b3b3);
    scene.add(light);
    
    // Inicializamos la geometría del suelo, en este caso empezamos con un plano
    // const floorGeometry = new THREE.PlaneGeometry(130, 130);
    // const floorMaterial = new THREE.MeshStandardMaterial({ color: FLOOR_COLOR, side: THREE.DoubleSide });
    // const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    
    // // Rotamos el plano para que esté alineado al horizonte
    // floorMesh.position.set(0, 0.5, 0)
    // floorMesh.rotateX(Math.PI / 2);
    // floorMesh.receiveShadow = true;
    
    // scene.add(floorMesh);
    this.charging_screen();
    

    // Manejamos el cambio del tamaño de la ventana
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }   

  async render_waiting(){
    // Renderizamos la escena

    const data = await this.models_rendering(METEROID_QUANTITY, 'models/asteroid.obj' , 'models/asteroid.mtl', 200);
    
    if(data.error){
      return data;
    }

    return data;
  }

  async  models_rendering(quantity, model, mtl, spacing = 20) {

    try{
        for (let i = 0; i < quantity; i++) {
          // Crea una nueva instancia en cada iteración
          const object = new ObjModel(this.scene, model, mtl, false);
      
            // Espera a que el modelo se inicialice antes de proceder
            const obj = await object.initModel();
      
            // Establece la posición del objeto
            obj.position.set(
              spacing * (Math.random() * 2 - 1),
              spacing * (Math.random() * 2 - 1),
              spacing * (Math.random() * 2 - 1)
            );

            this.scene.add(obj);
        }

        return {
          error: false,
          message: 'Modelos cargados correctamente'
        }
    }
    catch(error){
        console.error('Error al inicializar el modelo:', error);
        return {
          error: true,
          message: 'Error al inicializar el modelo',
        }
    }
    
  }

  charging_screen(){
    // Renderizamos la escena
    document.body.style.cursor = 'default';
    document.getElementById('screen').style.display = 'none';    
  }
  
  
}
