import Gameboard from "../src/models/Gameboard";



describe("Gameboard", () => {



    test("creates an empty board", () => {

        const board = new Gameboard();

        expect(board.ships).toEqual([]);
        expect(board.missedAttacks).toEqual([]);

    });

    test("places a ship", () => {

        const board = new Gameboard();

        board.placeShip(3, [0, 0], "horizontal");

        expect(board.ships.length).toBe(1);

    });
    
    test("attack hits ship", () => {

        const board = new Gameboard();

        board.placeShip(3, [0, 0], "horizontal");

        board.receiveAttack([0, 1]);

        expect(board.ships[0].ship.hits).toBe(1);

    });

    test("attack misses", () => {

        const board = new Gameboard();

        board.placeShip(3, [0, 0], "horizontal");

        board.receiveAttack([5, 5]);

        expect(board.missedAttacks).toContainEqual([5, 5]);

    });

});

test("returns false if not all ships are sunk", () => {

    const board = new Gameboard();

    board.placeShip(2, [0, 0], "horizontal");
    board.placeShip(3, [2, 2], "vertical");

    board.receiveAttack([0, 0]);
    board.receiveAttack([0, 1]);

    expect(board.allShipsSunk()).toBe(false);

});

test("returns true if all ships are sunk", () => {

    const board = new Gameboard();

    board.placeShip(2, [0, 0], "horizontal");

    board.receiveAttack([0, 0]);
    board.receiveAttack([0, 1]);

    expect(board.allShipsSunk()).toBe(true);

});

test("cannot attack same missed coordinate twice", () => {

    const board = new Gameboard();

    board.receiveAttack([5, 5]);

    expect(() => {

        board.receiveAttack([5, 5]);

    }).toThrow();

});

test("cannot attack same ship coordinate twice", () => {

    const board = new Gameboard();

    board.placeShip(2, [0, 0], "horizontal");

    board.receiveAttack([0, 0]);

    expect(() => {

        board.receiveAttack([0, 0]);

    }).toThrow();

});
