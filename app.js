import * as THREE from '../../libs/three137/three.module.js';
import { RGBELoader } from '../../libs/three137/RGBELoader.js';
import { OrbitControls } from '../../libs/three137/OrbitControls.js';
import { LoadingBar } from '../../libs/LoadingBar.js';
import { C4Board } from './js/C4Board.js';
import { TWEEN } from '../../libs/tween.module.min.js';
import { SFX } from '../../libs/SFX.js';

class App {
    constructor() {

        const container = document.createElement('div');
        document.body.appendChild(container);
        //set board size and win condition
        this.columns = 7; //width of the board
        this.rows = 5;  //height of the board
        this.winSize = 4; //number of squares in a row to win
        this.fullSquares = 0;
        //mouse position
        this.mouse = new THREE.Vector2();
        this.falling = false;
        //raycaster
        this.raycaster = new THREE.Raycaster();
        //players object to hold the player cola and names
        this.players = {
            red: 'Red',   //player 1 
            black: 'Black' //player 2
        };


        this.player = this.players.red; //set the current player to red
        this.gameOver = true;

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 60);


        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xaaaaaa);

        const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 0.5);
        this.scene.add(ambient);

        const light = new THREE.DirectionalLight(0xFFFFFF, 1.5);
        light.position.set(0.2, 1, 1);
        this.scene.add(light);

        //light on other side
        const light2 = new THREE.DirectionalLight(0xFFFFFF, 3.5);
        light2.position.set(-0.2, -1, -1);
        this.scene.add(light2);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.physicallyCorrectLights = true;
        container.appendChild(this.renderer.domElement);
        this.setEnvironment();

        this.loadingBar = new LoadingBar();
        this.loadSFX();

        this.boardOptions = {
            scene: this.scene,
            assetsPath: '../../assets/connect4/',
            playHeight: this.rows,
            playWidth: this.columns,
            loadingBar: this.loadingBar,
            render: this.render.bind(this),
            renderer: this.renderer,
            clearBoard: this.clearBoard.bind(this)
        };
        //get start button
        this.startButton = document.getElementById('startButton');
        //get width and height input fields
        this.widthInput = document.getElementById('widthInput');
        this.heightInput = document.getElementById('heightInput');
        //get matchSize input field
        this.matchSizeInput = document.getElementById('matchSizeInput');

        this.hideUI();
        this.C4Board = new C4Board(this.boardOptions);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        //move the controls up half the height of the board
        this.controls.target.set(0, this.rows / 2, 0);
        //move the camera back half the width of the board
        this.camera.position.set(0, this.rows / 2, this.columns * 1.5);
        window.addEventListener('resize', this.resize.bind(this));
        //event listeners for mouse over hitbox
        window.addEventListener('mousemove', this.mouseMove.bind(this));
        //event listeners for mouse click
        window.addEventListener('click', this.mouseClick.bind(this));
        //event listener for start button
        this.startButton.addEventListener('click', this.startGame.bind(this));
    }

        
    startGame() {
        //hide the start button and input fields
        this.hideUI();

        //get the width and height from the input fields
        let width = parseInt(this.widthInput.value);
        let height = parseInt(this.heightInput.value);

        let matchSize = parseInt(this.matchSizeInput.value);


        if (width < 4 || width > 25 || height < 4 || height > 25 || isNaN(width) || isNaN(height)) {
            alert('Please enter an Integer betweeen 4 and 25 for both width and height');
            this.showUI();
            return;
        }
        //check if the match size is valid
        if (matchSize < 3 || matchSize > 7 || isNaN(matchSize)) {
            alert('Please enter an Integer betweeen 3 and 7 for the match size');
            this.showUI();
            return;
        }
        //set the match size
        this.winSize = matchSize;
        
        //update the board size
        this.updateBoardSize(width, height);
        //reset the game
    }

    hideUI() {
        this.startButton.style.display = 'none';
        this.widthInput.style.display = 'none';
        this.heightInput.style.display = 'none';
        this.matchSizeInput.style.display = 'none';
    }

    showUI() {
        this.startButton.style.display = 'block';
        this.widthInput.style.display = 'block';
        this.heightInput.style.display = 'block';
        this.matchSizeInput.style.display = 'block';
    }

    //load sound effects
    loadSFX() {
        this.sfx = new SFX(this.camera, '../../assets/sounds/');
        this.sfx.load('drop');
        this.sfx.load('horizontal');
        this.sfx.load('vertical');
        this.sfx.load('diagonal');
    }

    updateBoardSize(width, height) {
        this.columns = width;
        this.rows = height;
        //update width and height of the board C4Board object
        this.C4Board.playHeight = this.rows;
        this.C4Board.playWidth = this.columns;
        //update the camera position
        //this.camera.position.set(0, this.rows / 2, this.columns * 1.5);
        //update the controls target
        //this.controls.target.set(0, this.rows / 2, 0);
        //reset board geometry
        this.C4Board.resetBoard();
        
    }

    setEnvironment() {
        const loader = new RGBELoader();
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        pmremGenerator.compileEquirectangularShader();

        const self = this;

        loader.load('../../assets/hdr/venice_sunset_1k.hdr', (texture) => {
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            pmremGenerator.dispose();

            self.scene.environment = envMap;

        }, undefined, (err) => {
            console.error('An error occurred setting the environment');
        });
    }

    //javascript board object
    generateBoard() {
        //create a 2d array of 0s
        let board = [];
        for (let i = 0; i < this.columns; i++) {
            board[i] = [];
            for (let j = 0; j < this.rows; j++) {
                board[i][j] = 0;
            }
        }
        this.totalSquares = this.columns * this.rows;
        return board;
    }

    //add a piece to the board with column id and player and return row id
    addPiece(column, player) {
        //check if column is full
        if (this.board[column][this.rows - 1] != 0) {
            return -1;
        }
        //find the first empty row in the column
        let row = 0;
        while (this.board[column][row] != 0) {
            row++;
        }
        //add the piece to the board

        this.board[column][row] = player;
        //increment the number of full squares
        this.fullSquares++;
        return row;
    }

    // //check for a win
    checkWin(column, row, player) {
        //check horizontal
        let count = this.checkHorizontal(column, row, player);
        if (count >= this.winSize) {
            console.log("Horizontal win", count, player)
            this.sfx.play('horizontal');
            this.showWinner();
            return true;
        }
        //check vertical
        count = this.checkVertical(column, row, player);
        if (count >= this.winSize) {
            console.log("Vertical win", count, player)
            this.sfx.play('vertical');
            this.showWinner();
            return true;
        }
        //check diagonal
        count = this.checkDiagonal(column, row, player);
        if (count >= this.winSize) {
            console.log("Diagonal win", count, player)
            this.sfx.play('diagonal');
            this.showWinner();
            return true;
        }
        //check anti-diagonal
        count = this.checkAntiDiagonal(column, row, player);
        if (count >= this.winSize) {
            console.log("Anti-Diagonal win", count, player)
            this.sfx.play('diagonal');
            this.showWinner();
            return true;
        }
        //check if board is full
        if (this.fullSquares == this.totalSquares) {
            console.log("Tie");
            this.showUI();
            return true;
        }
        return false;
    }

    //make winner object visible
    showWinner() {
        this.showUI();
        if (this.player == this.players.red) {
            this.C4Board.redWin.visible = true;
        } 
        if (this.player == this.players.black){
            this.C4Board.blackWin.visible = true;
        }

    }



    // check for horizontal win
    checkHorizontal(column, row, player) {
        //check left
        let count = 0;
        for (let i = row; i >= 0; i--) {
            if (this.board[i][column] == player) {
                count++;
            } else {
                break;
            }
        }
        //check right

        for (let i = row + 1; i <= this.columns - 1; i++) {
            if (this.board[i][column] == player) {
                count++;
            } else {
                break;
            }
        }
        //check if there are 4 in a row
        return count;
    }
    //check for vertical win
    checkVertical(column, row, player) {
        //start from column and go down row counting player pieces
        let count = 0;
        for (let i = column; i >= 0; i--) {
            if (this.board[row][i] == player) {
                count++;
            } else {
                break;
            }
        }
        //return count
        return count;
    }

    //check for diagonal win
    checkDiagonal(column, row, player) {
        //check down and left
        let count = 0;
        let i = column;
        let j = row;
        while (i >= 0 && j >= 0) {
            if (this.board[j][i] == player) {
                count++;
            } else {
                break;
            }
            i--;
            j--;
        }
        //check up and right
        i = column + 1;
        j = row + 1;
        while (i <= this.rows - 1 && j <= this.columns - 1) {
            if (this.board[j][i] == player) {
                count++;
            } else {
                break;
            }
            i++;
            j++;
        }
        //return count
        return count;
    }

    //check for anti-diagonal win
    checkAntiDiagonal(column, row, player) {
        //check down and right
        let count = 0;
        let i = column;
        let j = row;
        while (i >= 0 && j <= this.columns - 1) {
            if (this.board[j][i] == player) {
                count++;
            } else {
                break;
            }
            i--;
            j++;
        }
        //check up and left
        i = column + 1;
        j = row - 1;
        while (i <= this.rows - 1 && j >= 0) {
            if (this.board[j][i] == player) {
                count++;
            } else {
                break;
            }
            i++;
            j--;
        }
        //return count
        return count;
    }



    mouseMove(event) {
        //check if mouse is over a hitbox

        if (!this.gameOver) {
            //hide the non-active player's gem

                this.C4Board.blackGem.visible = false;

                this.C4Board.redGem.visible = false;

            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
            this.raycaster.setFromCamera(this.mouse, this.camera);

            //if mouse is over a hitbox, move the gem to that hitbox
            let intersects = this.raycaster.intersectObjects(this.C4Board.hitBoxes?.flat());
            if (intersects.length > 0) {

                //make the player's puck visible
                if (this.player == this.players.red) {
                    this.C4Board.redGem.visible = true;
                    //move the red puck to the hitbox
                    this.C4Board.redGem.position.set(intersects[0].object.position.x, intersects[0].object.position.y, intersects[0].object.position.z);
                } else {
                    this.C4Board.blackGem.visible = true;
                    //move the black puck to the hitbox
                    this.C4Board.blackGem.position.set(intersects[0].object.position.x, intersects[0].object.position.y, intersects[0].object.position.z);
                }
            } else {
                //make the player's puck invisible
                if (this.player == this.players.red ) {
                    this.C4Board.redGem.visible = false;
                } else {
                    this.C4Board.blackGem.visible = false;
                }
            }

        }else{
            //if c4board is loaded, hide the gems
            if(this.C4Board.redGem){
                this.C4Board.redGem.visible = false;
                this.C4Board.blackGem.visible = false;
            }

        }
    }

    mouseClick(event) {
        //check if mouse is over a hitbox
        if (!this.gameOver && !this.falling) {
            
            this.C4Board.blackGem.visible = false;

            this.C4Board.redGem.visible = false;
            //make current player's puck visible
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
            this.raycaster.setFromCamera(this.mouse, this.camera);

            //if mouse is over a hitbox, switch the player
            let intersects = this.raycaster.intersectObjects(this.C4Board.hitBoxes?.flat());
            if (intersects.length > 0) {
                this.dropPuck(intersects[0].object.position.x, intersects[0].object.position.y, intersects[0].object.position.z);
                this.switchPlayer();
            }
        }
    }

    dropPuck(x, y, z) {
        //clone the player's puck and drop it into the hitbox
        let puck;
        if (this.player == this.players.red) {
            puck = this.C4Board.redPuck.clone();
            this.C4Board.redPuck.visible = false;
        } else {
            puck = this.C4Board.blackPuck.clone();
            this.C4Board.blackPuck.visible = false;
        }
        puck.position.set(x, y - 3, z);

        let row = this.addPiece(puck.position.x, this.player)
        let column = puck.position.x;
        //offset the puck postion by -playHeight+3/2 and -playWidth/2
        //if row is not -1, add the puck to the scene
        if (row != -1) {
            puck.position.x -= this.columns / 2;

            if (this.checkWin(row, column, this.player)) {
                this.gameOver = true;

            };
            this.scene.add(puck);
            //animate the piece falling
            this.animatePuck(puck, row);
        }
    }

    clearBoard() {
        //remove all pucks from the scene
        for (let i = 0; i < this.scene.children.length; i++) {
            //remove all Puck_Red and Puck_Black objects
            if (this.scene.children[i].name == 'Puck_Red' || this.scene.children[i].name == 'Puck_Black') {
                this.scene.remove(this.scene.children[i]);
                i--;
            }
        }
        //reset the board
        this.board = this.generateBoard();
        this.fullSquares = 0;
        this.gameOver = false;
        //hide the win objects
        this.C4Board.redWin.visible = false;
        this.C4Board.blackWin.visible = false;

        return true;
    }



    switchPlayer() {
        if (this.player == this.players.red) {
            this.player = this.players.black;
        } else {
            this.player = this.players.red;
        }
    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animatePuck(puck, row) {
        //animate the puck falling into row slot
        //calculate the distance between the puck's current position and the row
        //make puck visible
        puck.visible = true;
        //play the drop sfx
        this.sfx.play('drop');
        let distance = (puck.position.y - row) / this.rows;
        this.falling = true;
        let tween = new TWEEN.Tween(puck.position)
            .to({ y: row }, (distance*500)+200)
            .easing(TWEEN.Easing.Bounce.Out)
            .start().onComplete(() => {
                this.falling = false;
            });
    }


    render() {

        this.renderer.render(this.scene, this.camera);

        TWEEN.update();
        //rotate redgem and blackgem
        this.C4Board.redGem.rotation.y += 0.01;
        this.C4Board.blackGem.rotation.y += 0.01;
        //if game is over
        if (this.gameOver) {
            //rotate redWin and blackWin
            this.C4Board.redWin.rotation.y += 0.01;
            this.C4Board.blackWin.rotation.y += 0.01;
        }
    }
}

export { App };