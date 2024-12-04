import World from "../../Context/world.js";
import Player from "../../Context/player.js";
import Input from "../../Context/input.js";
import Connection from "../../../Server/connection.js";
import ObjModel from "../../Context/model.js";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import * as THREE from 'three';

const FPS = 60;
// const SPEED = 0.1;
// const ROTATION_SPEED = 0.01;
// const JUMP_HEIGHT = 0.1;
// const GRAVITY = 0.01;
// const DAMAGE = 0.1;


export default class Level {

  constructor() {
    this.world = new World();
  
    this.players = new Array().fill(0);

    this.models = new Array().fill(0);
  
    this.socket = Connection.getConnection();
  
    this.clientPlayer = null;

    this.lastPolarAngle = null;
    this.lastAzimuthalAngle = null;

    this.configurations = {};
  }

   #setUpSocketEvents(){    

    const socket = this.socket;

     socket.on('newPlayer', (player) => {
      console.log(player);
      console.log("Recieved message from server: newPlayer\nPlayer: " + player.name + " ID:" + player.id + ' connected');
      this.addPlayer(player);
    });

    socket.on('currentPlayers', (playersData) => {
      Object.keys(playersData).forEach((id) => {
        if (!this.players.find(obj => obj.id === id)) {
          this.addPlayer(playersData[id]);
          console.log("Recieved message from server: currentPlayers\nRecieved new player: " + id);
        }
        else {
          console.log("Recieved message from server: currentPlayers\nPlayer: " + playersData[id].name + " ID:" + id + " is already in the scene");
        }
      });
    });

    socket.on('playerDisconnected', (id) => {
      console.log("Recieved message from server: playerDisconnected");
      let disconnectedPlayer = this.players.find(obj => obj.id === id);
      disconnectedPlayer?.removePlayer();
      this.players = this.players.filter(obj => obj.id === disconnectedPlayer.id);
    });

    socket.on('update', (playersData) => {
      Object.keys(playersData).forEach((id) => {
        const updatedPlayer = this.players.find(obj => obj.id === id);
        if (updatedPlayer) {
          updatedPlayer.updatePlayerFromJSON(playersData[id]);
          // console.log("Recieved message from server: update\nUpdated player: " + id);
        }
        else {
          console.log("Recieved message from server: update\nPlayer " + id + " is not in the scene");
        }
      });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.restartScene();
    });

  }

   async initLevel() {

    this.#setUpSocketEvents();

    this.configurations = await  this.GetConfigurations();

    console.log(this.configurations);

    await this.world.initWorld();

    this.levelCamera = this.world.camera;

    this.levelScene = this.world.scene;

    this.levelRenderer = await this.world.renderer

    this.controls = new OrbitControls(this.levelCamera, this.levelRenderer.domElement);
    this.controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    this.controls.dampingFactor = 0.25;
    this.controls.screenSpacePanning = false;
    this.controls.maxPolarAngle = Math.PI / 2;


    // const dobeto = new ObjModel(this.levelScene, 'models/PORFAVOR.obj', 'models/PORFAVOR.mtl'); 

    const m_Enemyship = new ObjModel(this.levelScene, 'models/enemyShip.obj', 'models/enemyShip.mtl', false); 
    const m_Moon = new ObjModel(this.levelScene, 'models/Moon.obj', 'models/Moon.mtl', false);
    const m_BlackHole = new ObjModel(this.levelScene, 'models/black_hole.obj', 'models/black_hole.mtl', false, '', '');
    const m_Galaxy = new ObjModel(this.levelScene, '', '', false, '', '', 'models/space_station.fbx');



    //Forma de inicializar un modelo 
    // m_ship.initModel().then((object) => {
     
    //   object.position.set(0, 0, 0);

    // });

    // m_Enemyship.initModel().then((object) => {
     
    //   object.position.set(0, 10, 0);

    // });

    // await m_Moon.initModel().then((object) => {
     
    //   object.position.set(-300, 100, -100);

    // });
   
    // await m_Galaxy.initModel().then((object) => {
     
    //   object.position.set(300, -50, 100);

    // });


    // this.models.push(dobeto);

  }

  begin() {
    const fps = FPS;
    const interval = 1000 / fps;
    let lastTime = 0;


    const animate = (time) => {
      if (time - lastTime >= interval) {
        lastTime = time;
        this.levelRenderer.render(this.levelScene, this.levelCamera);
        this.update();
      }
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  checkRotationChange() {
    const currentPolarAngle = this.controls.getPolarAngle();
    const currentAzimuthalAngle = this.controls.getAzimuthalAngle();

    if (currentPolarAngle !== this.lastPolarAngle || currentAzimuthalAngle !== this.lastAzimuthalAngle) {
      
        console.log('La rotación de la cámara ha cambiado');
        this.lastPolarAngle = currentPolarAngle;
        this.lastAzimuthalAngle = currentAzimuthalAngle;

        if (this.clientPlayer) {
          console.log('Enviando rotación al servidor');
          console.log(currentPolarAngle, currentAzimuthalAngle);
          this.socket.emit('cameraRotation', {
          polarAngle: currentPolarAngle,
          azimuthalAngle: currentAzimuthalAngle
          });
        }

        return true;
    }
}
  

  update() {

    this.checkRotationChange();


    if (this.clientPlayer?.mesh) {
      

      this.controls.target = this.clientPlayer.mesh.position;
      
      if(this.prevPOS) {
        this.distance = this.clientPlayer.mesh.position.clone().sub(this.prevPOS); 
        this.levelCamera.position.add(this.distance);

      }

      this.prevPOS = this.clientPlayer.mesh.position?.clone();

      this.controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true


    }

    //Manejo de modelos en la escena
    if (this.m_ship?.mesh) {
      this.m_ship.mesh.rotation.y += 0.01;
    }



  }


  updatePlayers(updatedPlayers) {
    this.players = updatedPlayers;
  }

  currentPlayers(currentPlayers) {
    this.players = currentPlayers;
  }

  addPlayer(newPlayer) {

    let result = true;
    let addedPlayer = null;

    if (!newPlayer) {
      addedPlayer = new Player(this.world.scene);
      result = addedPlayer.initPlayerAsCubeMesh();
    }
    else if (typeof newPlayer === 'Player') {
      addedPlayer = newPlayer;
      addedPlayer.color = Math.random() * 0xFFFFFF;
      result = addedPlayer.initPlayerAsCubeMesh();
    }
    else if (typeof newPlayer === 'object') {
      addedPlayer = new Player(this.world.scene);
      result = addedPlayer.initPlayerFromJSON(newPlayer);
    }

    this.players.push(addedPlayer);

    if (this.players.length == 1) this.#setClientPlayer();

    if (result)
      console.log("Player: " + addedPlayer.name + " ID:" + addedPlayer.id + " successfully added to the scene");

    return addedPlayer;

  }

  getClientPlayer() {
    return this.clientPlayer;
  }

  #setClientPlayer() {
    this.clientPlayer = this.players.find(obj => obj.id === this.socket.id);
    console.log("Nuestro client player", this.clientPlayer)
    this.playerInput = new Input(this.clientPlayer);
    this.playerInput.initInputSystem();
  }

 async GetConfigurations(){
    return await fetch('http://localhost:3000/level_one/configurations', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(response => {

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      console.log('level_one', response);
      return response.json();
    })
 }

  restartScene() {

    delete this.players;
    this.players = new Array().fill(0);

    while (this.levelScene.children.length > 0) {
      this.levelScene.remove(this.levelScene.children[0]);
    }

    this.initLevel();

  }

}