import Player from "./models/Player.js";

export default class GameController {

    constructor() {

        this.player = new Player();

        this.computer = new Player(true);

        this.currentPlayer = this.player;

        this.setupBoards();

    }
    setupBoards() {

        const ships = [5, 4, 3, 3, 2];

        ships.forEach(length => {
            this.player.gameboard.placeRandomShip(length);
        });

        ships.forEach(length => {
            this.computer.gameboard.placeRandomShip(length);
        });

    }
    playerAttack(coordinate) {

        return this.player.attack(

            this.computer,

            coordinate

        );

    }
    computerAttack() {
        return this.computer.randomAttack(

            this.player

        );

    }
    isGameOver() {

        return (

            this.player.gameboard.allShipsSunk()

            ||

            this.computer.gameboard.allShipsSunk()

        );

    }
    getWinner() {

        if (

            this.player.gameboard.allShipsSunk()

        ) {

            return "Computer";

        }

        if (

            this.computer.gameboard.allShipsSunk()

        ) {

            return "Player";

        }

        return null;

    }
    
}   