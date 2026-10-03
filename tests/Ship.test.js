import Ship from "../src/models/Ship";

describe("Ship", () => {

    test("creates ship", () => {

        const ship = new Ship(3);

        expect(ship.length).toBe(3);
        expect(ship.hits).toBe(0);

    });

    test("ship registers hit", () => {

        const ship = new Ship(4);

        ship.hit();

        expect(ship.hits).toBe(1);

    });

    test("ship is not sunk initially", () => {

        const ship = new Ship(2);

        expect(ship.isSunk()).toBe(false);

    });

    test("ship sinks after enough hits", () => {

        const ship = new Ship(2);

        ship.hit();
        ship.hit();

        expect(ship.isSunk()).toBe(true);

    });

});