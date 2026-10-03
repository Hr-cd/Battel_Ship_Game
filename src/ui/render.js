export function renderBoard(
    container,
    gameboard,
    showShips = false,
    onCellClick = null
) {

    container.innerHTML = "";

    for (let row = 0; row < 10; row++) {

        for (let col = 0; col < 10; col++) {

            const cell = document.createElement("div");

            cell.classList.add("cell");

            cell.dataset.row = row;
            cell.dataset.col = col;

            // Check if this cell contains a ship
            const hasShip = gameboard.ships.some(({ ship, start, direction }) => {

                const [shipRow, shipCol] = start;

                for (let i = 0; i < ship.length; i++) {

                    let r = shipRow;
                    let c = shipCol;

                    if (direction === "horizontal") {
                        c += i;
                    } else {
                        r += i;
                    }

                    if (r === row && c === col) {
                        return true;
                    }
                }

                return false;
            });

            // Check if this coordinate has been attacked
            const wasAttacked = gameboard.attackedCoordinates.some(
                ([r, c]) => r === row && c === col
            );

            // Check if it's a hit
            const wasHit = hasShip && wasAttacked;

            // Check if it's a miss
            const wasMiss = gameboard.missedAttacks.some(
                ([r, c]) => r === row && c === col
            );

            if (showShips && hasShip) {
                cell.classList.add("ship");
            }

            if (wasHit) {
                cell.classList.add("hit");
            }

            if (wasMiss) {
                cell.classList.add("miss");
            }

            if (onCellClick && !wasAttacked) {

                cell.addEventListener("click", () => {

                    onCellClick(row, col);

                });

            }

            container.appendChild(cell);
        }
    }
}