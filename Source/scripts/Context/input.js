import Connection from "../../Server/connection.js";

export default class InputSystem{

    socket = Connection.getConnection();
    Health = 100;


    constructor(player){
        this.player = player;
    }

    initInputSystem(){

        const player = this.player;
        const socket = this.socket;

        const inputInfo = {
            id: player.id,
            inputs: {
                up: false,
                down: false,
                right: false,
                left: false,
                jump: false,
                selfdamge: true,
            },
        };

        document.addEventListener('keydown', (event) => {
            // Manejar el jugador con las teclas del teclado
            if (this.player) {
                if (event.key === 'w' || event.key === 'W') {
                    inputInfo.inputs.up = true;
                }
                if (event.key === 's' || event.key ===  'S') {
                    inputInfo.inputs.down = true;
                }
                if (event.key === 'a' || event.key === 'A') {
                    inputInfo.inputs.left = true; 
                }
                if (event.key === 'd' || event.key === 'D') {
                    inputInfo.inputs.right = true;
                }
                if (event.code === 'Space') { 
                    inputInfo.inputs.jump = true;
                }
                if (event.key === 'q' || event.key === 'Q') {
                    console.log("Self Damage"); 
                    this.SelfDamage(true); 
                    inputInfo.inputs.jump = true;
                }

                console.log(inputInfo);

                socket.emit('input', inputInfo);
            }
        });

        document.addEventListener('keyup', (event) => {
            // Resetear los inputs cuando se sueltan las teclas
            if (this.player) {
                if (event.key === 'w' || event.key === 'W') {
                    inputInfo.inputs.up = false;
                } 
                if (event.key === 's' || event.key ===  'S') {
                    inputInfo.inputs.down = false;
                }
                if (event.key === 'a' || event.key === 'A') {
                    inputInfo.inputs.left = false; 
                }
                if (event.key === 'd' || event.key === 'D') {
                    inputInfo.inputs.right = false;
                }
                if (event.code === 'Space') { 
                    inputInfo.inputs.jump = false;
                }
                if (event.key === 'q' || event.key === 'Q') { 
                    console.log("Self Damage"); 
                    inputInfo.inputs.jump = false;
                }

                console.log(inputInfo.inputs);

                socket.emit('input', inputInfo);
            }
        });
    }

    SelfDamage (damage) {

        const health_bar = document.getElementById('health-bar');
        
        console.log("Self Damage");
        if(damage)
        {   
            console.log("Aplicando damage");
            let currentWidth = parseInt(health_bar.style.width) || 100; 
            let CurrentHealth = (currentWidth - 10); 
            this.Health = this.Health - 10;
            health_bar.style.width = CurrentHealth + '%';
            
            if(this.Health === 0){
                
            }
        }
    }

}