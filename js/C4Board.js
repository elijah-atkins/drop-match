import * as THREE from '../../libs/three137/three.module.js';
import { GLTFLoader } from '../../libs/three137/GLTFLoader.js';

class C4Board {

    constructor(options) {
        this.assetsPath = options.assetsPath;
        this.playWidth = options.playWidth;
        this.playHeight = options.playHeight;
        this.scene = options.scene;
        this.loadingBar = options.loadingBar;
        this.loadingBar.visible = false;
        this.render = options.render;
        this.renderer = options.renderer;
        this.clearBoard = options.clearBoard;
        this.loadGLTF();
    }



    loadGLTF() {
        const loader = new GLTFLoader().setPath('../../assets/connect4/');

        // Load a glTF resource
        loader.load(
            // resource URL
            'drop4board.glb',
            // called when the resource is loaded
            gltf => {
                const bbox = new THREE.Box3().setFromObject(gltf.scene);
                //  console.log(`min:${bbox.min.x.toFixed(2)},${bbox.min.y.toFixed(2)},${bbox.min.z.toFixed(2)} -  max:${bbox.max.x.toFixed(2)},${bbox.max.y.toFixed(2)},${bbox.max.z.toFixed(2)}`);


                this.board = gltf.scene;
                //extract the objects from the board
                this.redPuck = this.board.getObjectByName('Puck_Red');
                this.blackPuck = this.board.getObjectByName('Puck_Black');
                this.redGem = this.board.getObjectByName('Gem_Red');
                this.blackGem = this.board.getObjectByName('Gem_Black');
                this.redWin = this.board.getObjectByName('Winner_Red');
                this.blackWin = this.board.getObjectByName('Winner_Black');
                this.edgeBottom = this.board.getObjectByName('Edge_bottom');
                this.edge = this.board.getObjectByName('Edge');
                this.edgeTop = this.board.getObjectByName('Edge_top');
                this.boardBottom = this.board.getObjectByName('Board_b');
                this.boardTop = this.board.getObjectByName('Board_t');
                this.boardMid = this.board.getObjectByName('Board');
                this.hitBox = this.board.getObjectByName('HitBox');


                //remove the original objects
                this.board.remove(this.hitBox);
                this.board.remove(this.edgeBottom);
                this.board.remove(this.edge);
                this.board.remove(this.edgeTop);
                this.board.remove(this.boardBottom);
                this.board.remove(this.boardTop);
                this.board.remove(this.redPuck);
                this.board.remove(this.blackPuck);


                //make red and black gems invisible
                this.redGem.visible = false;
                this.blackGem.visible = false;
                this.redWin.visible = false;
                this.blackWin.visible = false;

                //build the board
                this.buildBoard();


            },
            // called while loading is progressing
            xhr => {

                this.loadingBar.progress = (xhr.loaded / xhr.total);

            },
            // called when loading has errors
            err => {

                console.error(err);

            }
        );

    }
    //helper function to build the board
    buildBoard() {
        this.x = this.playWidth;
        this.y = this.playHeight + 3;
        this.redWin.position.set((this.x - 1) / 2, this.y + .5, 0);
        this.blackWin.position.set((this.x - 1) / 2, this.y + .5, 0);
        this.edges = [];
        for (let i = 0; i == 0; i++) {
            this.edges[i] = [];
            let piece;
            piece = this.edgeBottom.clone();
            piece.position.set(i, 0, 0);
            this.edges[i][0] = piece;
            this.board.add(piece);

            for (let j = 3; j < this.y; j++) {

                if (j == 0) {
                    piece = this.edgeBottom.clone();
                } else if (j == this.y - 1) {
                    piece = this.edgeTop.clone();
                } else {
                    piece = this.edge.clone();
                }
                piece.position.set(i, j, 0);
                this.edges[i][j] = piece;
                this.board.add(piece);
            }
        }

        for (let i = this.x - 1; i == this.x - 1; i++) {
            this.edges[i] = [];
            let piece;
            piece = this.edgeBottom.clone();
            piece.position.set(i, 0, 0);
            this.edges[i][0] = piece;
            piece.rotateY(Math.PI);
            this.board.add(piece);

            for (let j = 3; j < this.y; j++) {

                if (j == 0) {
                    piece = this.edgeBottom.clone();
                } else if (j == this.y - 1) {
                    piece = this.edgeTop.clone();
                } else {
                    piece = this.edge.clone();
                }
                piece.position.set(i, j, 0);
                this.edges[i][j] = piece;
                //flip piece along x axis
                piece.rotateY(Math.PI);
                this.board.add(piece);
            }
        }

        //create the bottom and top boards
        this.boards = [];
        for (let i = 0; i < this.x; i++) {
            this.boards[i] = [];
            for (let j = 3; j < this.y; j++) {
                let piece;
                if (j == 3) {
                    piece = this.boardBottom.clone();
                } else if (j == this.y - 1) {
                    piece = this.boardTop.clone();
                } else {
                    piece = this.boardMid.clone();
                }
                piece.position.set(i, j, 0);
                this.boards[i][j] = piece;
                this.board.add(piece);
            }
        }


        //create a row of hitboxes above the board
        this.hitBoxes = [];
        for (let i = 0; i < this.x; i++) {
            this.hitBoxes[i] = [];
            for (let j = this.y - 1; j < this.y; j++) {
                let piece = this.hitBox.clone();
                piece.position.set(i, j + 1.2, 0);
                this.hitBoxes[i][j] = piece;
                //make the hitbox invisible
                piece.material.transparent = true;
                piece.material.opacity = 0;
                //wireframe
                piece.material.wireframe = true;
                this.board.add(piece);
            }
        }
        //move the board to the center of the play area
        this.board.position.set(-this.x / 2, -3, 0);
        this.scene.add(this.board);
        this.loadingBar.visible = false;
        this.clearBoard();
        this.renderer.setAnimationLoop(this.render.bind(this));
    }

    //helper function to clear the board
    resetBoard() {
        //remove all the pucks
        this.clearBoard();
        //remove all the edgs  
        for (let i = 0; i < this.x; i++) {
            for (let j = 0; j < this.y; j++) {
                this.board.remove(this.boards[i][j]);
                //if i == 0 or i == x-1, remove the edge
                if (i == 0 || i == this.x - 1) {
                    this.board.remove(this.edges[i][j]);
                }
                //remove the board
            }
        }
        //remove the hitboxes(last item in each row)

        for (let i = 0; i < this.x; i++) {
            this.board.remove(this.hitBoxes[i][this.y - 1]);
        }
        //remove the board
        this.scene.remove(this.board);
        //set the new height and width

        //build the board
        this.buildBoard();
    }

}
export { C4Board };