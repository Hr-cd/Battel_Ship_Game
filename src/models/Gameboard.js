import Ship from "./Ship.js";

export default class Gameboard {

    constructor() {

        this.ships = [];
        this.missedAttacks = [];
        this.attackedCoordinates = [];

    }

    placeShip(length, start, direction) {

        if (!this.canPlaceShip(length, start, direction)) {
            return false;
        }

        const ship = new Ship(length);

        this.ships.push({
            ship,
            start,
            direction
        });

        return true;
    }

    receiveAttack([row, col]) {

        const alreadyAttacked = this.attackedCoordinates.some(
            ([r, c]) => r === row && c === col
        );

        if (alreadyAttacked) {
            throw new Error("Coordinate already attacked");
        }

        this.attackedCoordinates.push([row, col]);

        // Check every ship
        for (const placedShip of this.ships) {

            const { ship, start, direction } = placedShip;

            const [shipRow, shipCol] = start;

            for (let i = 0; i < ship.length; i++) {

                let currentRow = shipRow;
                let currentCol = shipCol;

                if (direction === "horizontal") {
                    currentCol += i;
                } else {
                    currentRow += i;
                }

                if (currentRow === row && currentCol === col) {

                    ship.hit();

                    return true;

                }

            }

        }

        // No ship was hit
        this.missedAttacks.push([row, col]);

        return false;

    }

    allShipsSunk() {

        return this.ships.every(

            ({ ship }) => ship.isSunk()

        );

    }
    canPlaceShip(length, [row, col], direction) {

        for (let i = 0; i < length; i++) {

            const r = direction === "vertical" ? row + i : row;
            const c = direction === "horizontal" ? col + i : col;

            // Outside board
            if (r < 0 || r > 9 || c < 0 || c > 9) {
                return false;
            }

            // Overlap another ship
            for (const placed of this.ships) {

                const { ship, start, direction: shipDirection } = placed;

                const [shipRow, shipCol] = start;

                for (let j = 0; j < ship.length; j++) {

                    const sr = shipDirection === "vertical"
                        ? shipRow + j
                        : shipRow;

                    const sc = shipDirection === "horizontal"
                        ? shipCol + j
                        : shipCol;

                    if (sr === r && sc === c) {
                        return false;
                    }

                }
            }
        }

        return true;
    }
    placeRandomShip(length){

        while(true){

            const row=Math.floor(Math.random()*10);

            const col=Math.floor(Math.random()*10);

            const direction=Math.random()<0.5
                ?"horizontal"
                :"vertical";

            if(this.placeShip(length,[row,col],direction))
                break;

        }
    }
}

