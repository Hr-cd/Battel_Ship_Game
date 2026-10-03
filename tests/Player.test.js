import Player from "../src/models/Player";

describe("Player", () => {

    test("creates a human player", () => {

        const player = new Player();

        expect(player.isComputer).toBe(false);

    });

    test("creates a computer player", () => {

        const player = new Player(true);

        expect(player.isComputer).toBe(true);

    });

    test("player has a gameboard", () => {

        const player = new Player();

        expect(player.gameboard).toBeDefined();

    });

    test("player attacks enemy board", () => {

        const player1 = new Player();

        const player2 = new Player();

        player2.gameboard.placeShip(

            2,

            [0, 0],

            "horizontal"

        );

        player1.attack(

            player2,

            [0, 0]

        );

        expect(

            player2.gameboard.ships[0].ship.hits

        ).toBe(1);

    });

    test("computer makes one legal attack", () => {

        const computer = new Player(true);

        const human = new Player();

        computer.randomAttack(human);

        expect(

            human.gameboard.attackedCoordinates.length

        ).toBe(1);

    });

});