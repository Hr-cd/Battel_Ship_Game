import Gameboard from "./Gameboard.js";

export default class Player {

    constructor(isComputer = false) {

        this.gameboard = new Gameboard();

        this.isComputer = isComputer;

    }

    attack(enemyPlayer, coordinate) {

        return enemyPlayer.gameboard.receiveAttack(coordinate);

    }

    randomAttack(enemyPlayer) {

        let row;
        let col;

        do {

            row = Math.floor(Math.random() * 10);
            col = Math.floor(Math.random() * 10);

        } while (

            enemyPlayer.gameboard.attackedCoordinates.some(

                ([r, c]) => r === row && c === col

            )

        );

        return enemyPlayer.gameboard.receiveAttack([row, col]);

    }

}