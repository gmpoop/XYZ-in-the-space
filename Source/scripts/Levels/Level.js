import World from "../../Context/world.js";
import Player from "../../Context/player.js";
import Input from "../../Context/input.js";
import Connection from "../../../Server/connection.js";
import ObjModel from "../../Context/model.js";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as THREE from 'three';

const FPS = 60;

export default class Level {

  constructor() {
    this.world = new World();
  
    this.players = new Array().fill(0);

    this.models = new Array().fill(0);
  
    this.socket = Connection.getConnection();
  
    this.clientPlayer = null;
  }

  #setUpSocketEvents(){    

    const socket = this.socket;
    
     socket.on('newPlayer', (player)  => {
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

  initLevel() {
    this.world.initWorld();

    this.levelCamera = this.world.camera;

    this.levelScene = this.world.scene;

    this.levelRenderer = this.world.renderer;

    this.controls = new OrbitControls(this.levelCamera, this.levelRenderer.domElement);
    this.controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    this.controls.dampingFactor = 0.25;
    this.controls.screenSpacePanning = false;
    this.controls.maxPolarAngle = Math.PI / 2;

    this.#setUpSocketEvents();

    const dobeto = new ObjModel(this.levelScene, 'models/PORFAVOR.obj', 'models/PORFAVOR.mtl'); 
    const ship = new ObjModel(this.levelScene, 'models/ChocolateShip.obj', 'models/ChocolateShip.mtl', false); 
    const Enemyship = new ObjModel(this.levelScene, 'models/enemyShip.obj', 'models/enemyShip.mtl', false); 
    

    //Forma de inicializar un modelo 
    ship.initModel().then((object) => {
     
      object.position.set(0, 0, 0);

    });

    Enemyship.initModel().then((object) => {
     
      object.position.set(0, 10, 0);

    });

    
    this.models.push(dobeto);

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

  update() {

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
    if (this.ship?.mesh) {
      this.ship.mesh.rotation.y += 0.01;
    }



  }



  updatePlayers(updatedPlayers) {
    this.players = updatedPlayers;
  }

  currentPlayers(currentPlayers) {
    this.players = currentPlayers;
  }

  async  addPlayer(newPlayer) {

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
      result = await addedPlayer.initPlayerFromJSON(newPlayer);
    }

    await this.players.push(addedPlayer);

    if (this.players.length == 1) await this.#setClientPlayer();

    if (result)
      console.log("Player: " + addedPlayer.name + " ID:" + addedPlayer.id + " successfully added to the scene");

    return addedPlayer;

  }

  getClientPlayer() {
    return this.clientPlayer;
  }

  #setClientPlayer() {
    this.clientPlayer = this.players.find(obj => obj.id === this.socket.id);
    this.playerInput = new Input(this.clientPlayer, this.socket);
    this.playerInput.initInputSystem();
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