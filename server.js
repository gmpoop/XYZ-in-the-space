const express = require('express');
const path = require('path');
const cors = require('cors');
const PORT = process.env.PORT || 3000;
const LEVELS_ROUTE = process.env.LEVELS_ROUTE || 'levels';

const Server = require('socket.io').Server;
const http = require('http');
const cannon = require('cannon');
const { Console } = require('console');
const FPS = 60;


const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: "*",
  },
});

let configurations ={};

app.use(express.static(path.join(__dirname, 'Source')));

app.use(express.json());

app.post('/configurations', (req, res) => {
  console.log('POST /configurations');
  console.log(req.body); // Log the body of the request
  if(req.body === undefined) {
    console.log('No configurations received');
    res.status(400).send({
      message: 'No configurations received',
      status: 400,
    });
    return;
  }
  const body = req.body;

  // Log the configurations
  console.log(body);  

  // Store configurations in memory (or replace with a database)
  configurations = body; 

  res.send({
    message: 'Configurations received',
    status: 200,
  });
});

// Definir ruta del servidor
app.get('/level_one', (req, res) => {
  console.log('GET /level_one');  
  console.log(configurations);
  res.sendFile(path.join(__dirname, `Source/scripts/Levels`, 'LevelOne/index.html'));
});

app.get('/level_one/configurations', (req, res) => {
  res.json(configurations);
});

app.get('/level_two', (req, res) => {
  res.sendFile(path.join(__dirname, `${LEVELS_ROUTE}`, 'LevelTwo/index.html'));
});

app.get('/level_three', (req, res) => {
  res.sendFile(path.join(__dirname, `${LEVELS_ROUTE}`, 'LevelThree/index.html'));
});


app.get('/*.jpg', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', req.params['0'].split('/')[0], req.params['0'].split('/')[1] + ".jpg"), {
    headers: {
      'Content-Type': 'image/jpeg'
    }
  });
});

app.get('/*.png', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', req.params['0'].split('/')[0], req.params['0'].split('/')[1] + ".png"), {
    headers: {
      'Content-Type': 'image/png'
    }
  });
});

app.get('/*.obj', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', req.params['0'].split('/')[0], req.params['0'].split('/')[1] + ".obj"), {
    headers: {
      'Content-Type': 'model/obj'
    }
  });
  console.log(req.params);
  console.log(path.join(__dirname, 'public', 'models', req.params['0'].split('/')[1] + ".obj"))
});

app.get('/*.mtl', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', req.params['0'].split('/')[0], req.params['0'].split('/')[1] + ".mtl"), {
    headers: {
      'Content-Type': 'model/mtl'
    }
  });
});

app.get('/*.fbx', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', req.params['0'].split('/')[0], req.params['0'].split('/')[1] + ".fbx"), {
    headers: {
      'Content-Type': 'model/fbx'
    }
  });
});

// Inicializar las variables del mundo de juego
let players = {};
let cannonPlayerBody = {};
const PLAYER_MAX_SPEED = 100;
const PLAYER_ACCELERATION = 50;
const PLAYER_JUMP_HEIGHT = 10;

// Inicializar mundo de cannon js
const world = new cannon.World();
world.gravity.set(0, -9.82, 0);

function createPlayerBody(player) {
  // const shape = new cannon.Box(new cannon.Vec3(1, 1, 1));
  const shape =  new cannon.Sphere(1);
  const body =  new cannon.Body({ mass: 1 });
  body.addShape(shape);
  body.position.set(player.position.x, player.position.y, player.position.z);
  return body;
}

// Manejar las conexiones de socket.io
io.on('connection', (socket)  => {
  console.log('User ' + socket.id + ' connected');
  socket.on('disconnect', () => {
    console.log('User ' + socket.id + ' disconnected');
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });

  players[socket.id] = { //TODO: Agregar atributo mesh, hacemos que el Sourcee pueda seleccionar su modelo
    "name": 'tests',
    "color": 0xFFFFFF * Math.random(),
    "id": socket.id,
    "position": { x: 20 * Math.random() - 10, y: 5 * Math.random() + 2, z: 5 * Math.random() },
    "mesh": 'fighter',
  }

  cannonPlayerBody[socket.id] = {};

  cannonPlayerBody[socket.id].body = createPlayerBody(players[socket.id]);
  cannonPlayerBody[socket.id].body.linearDamping = 1;
  world.addBody(cannonPlayerBody[socket.id].body);

  console.log('Player', players[socket.id], 'connected');

  io.emit(
    'newPlayer',
    players[socket.id]
  );

  socket.emit(
    'currentPlayers',
    players,
  )

  socket.on('input', (data) => {
    const playerBody = cannonPlayerBody[data.id];

    if (!playerBody?.body) {
      console.error(`Player with ID ${data.id} does not exist!`);
      return;
    }

    //Continua
    
    // Procesa la entrada del jugador
    processPlayerInput(playerBody.body, data.inputs);

    // Actualiza la posición del jugador en el registro global
    updatePlayerPosition(data.id, playerBody.body.position);

    console.log(`Player ${data.id} moved to`, players[data.id].position);
  });

  // Función para procesar la entrada del jugador
  function processPlayerInput(body, inputs) {
    const force = new cannon.Vec3();
    const jumpImpulse = new cannon.Vec3(0, PLAYER_JUMP_HEIGHT, 0);

    if (inputs.up) {
      console.log('up');
      applyForce(body, 'z', -PLAYER_ACCELERATION, PLAYER_MAX_SPEED);
    }
    if (inputs.down) {
      console.log('down');
      applyForce(body, 'z', PLAYER_ACCELERATION, PLAYER_MAX_SPEED);
    }
    if (inputs.left) {
      console.log('left');
      applyForce(body, 'x', -PLAYER_ACCELERATION, PLAYER_MAX_SPEED);
    }
    if (inputs.right) {
      console.log('right');
      applyForce(body, 'x', PLAYER_ACCELERATION, PLAYER_MAX_SPEED);
    }
    if (inputs.jump && canJump(body)) {
      body.applyImpulse(jumpImpulse, body.position);
    }

    body.applyForce(force, body.position);
  }

  // Función para aplicar fuerza en un eje
  function applyForce(body, axis, acceleration, maxSpeed) {
    const velocityAxis = axis === 'x' ? 'x' : axis === 'z' ? 'z' : null;
    if (!velocityAxis) return;

    console.log("Aplicando fuerzas");
    
    if (body.velocity[velocityAxis] > -maxSpeed && body.velocity[velocityAxis] < maxSpeed) {
      body.velocity[velocityAxis] = acceleration;
    } else {
      body.velocity[velocityAxis] = Math.sign(acceleration) * maxSpeed;
    }
  }

  // Función para verificar si el jugador puede saltar
  function canJump(body) {
    return body.velocity.y <= 0.1 && body.position.y <= 2;
  }

  // Función para actualizar la posición del jugador
  function updatePlayerPosition(playerId, position) {
    players[playerId].position = {
      x: position.x,
      y: position.y,
      z: position.z,
    };
  }


});

function quaternionToEuler(q) {
  const ysqr = q.y * q.y;

  const t0 = 2.0 * (q.w * q.x + q.y * q.z);
  const t1 = 1.0 - 2.0 * (q.x * q.x + ysqr);
  const roll = Math.atan2(t0, t1);

  let t2 = 2.0 * (q.w * q.y - q.z * q.x);
  t2 = t2 > 1.0 ? 1.0 : t2;
  t2 = t2 < -1.0 ? -1.0 : t2;
  const pitch = Math.asin(t2);

  const t3 = 2.0 * (q.w * q.z + q.x * q.y);
  const t4 = 1.0 - 2.0 * (ysqr + q.z * q.z);
  const yaw = Math.atan2(t3, t4);

  return {
    x: roll,
    y: pitch,
    z: yaw
  };
}

// Agregar el suelo al mundo
const plane = new cannon.Plane();
const floor = new cannon.Body({ mass: 0 });
floor.addShape(plane);
floor.quaternion.setFromAxisAngle(new cannon.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(floor);

// Actualizar las físicas
function updatePhysics() {
  setInterval(() => {
    world.step(1 / FPS); // Avanzar el mundo de cannon js

    for (const id in players) {
      const player = players[id];
      player.position = cannonPlayerBody[player.id].body.position;
    }
    io.emit('update', players);
  }, 1000 / FPS);
}

updatePhysics();

//Inciar servidor
server.listen(3000, () => {
  console.log('listening on *:http://127.0.0.1:' + PORT);
});

