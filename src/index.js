import "./style.css";

import GameController from "./app.js";

import { renderBoard } from "./ui/render.js";

import socket from "./socket.js";

import Gameboard from "./models/Gameboard.js";

import OnlineGame from "./online/OnlineGame.js";


// ====================
// LOBBY ELEMENTS
// ====================

const lobby = document.querySelector("#lobby");

const createdRoom = document.querySelector("#created-room");

const lobbyRoomCode = document.querySelector("#lobby-room-code");

const createGameBtn =
    document.querySelector("#create-game-btn");

const joinGameBtn =
    document.querySelector("#join-game-btn");

const roomCodeInput =
    document.querySelector("#room-code-input");

const lobbyStatus =
    document.querySelector("#lobby-status");

const modeSelection =
    document.querySelector("#mode-selection");

const onlineLobby =
    document.querySelector("#online-lobby");

const computerModeBtn =
    document.querySelector("#computer-mode-btn");

const onlineModeBtn =
    document.querySelector("#online-mode-btn");

const backToModeBtn =
    document.querySelector("#back-to-mode-btn");

const onlineOpponentBoard = document.querySelector(
    "#online-opponent-board"
);

const playAgainBtn = document.querySelector("#play-again-btn");

const backToMenuBtn = document.querySelector(
    "#back-to-menu-btn"
);

const onlineGameSection = document.querySelector("#online-game");

const onlineRoomCode = document.querySelector("#online-room-code");

const onlineStatus = document.querySelector("#online-status");

const onlinePlayerBoard = document.querySelector(
    "#online-player-board"
);

const randomizeShipsBtn = document.querySelector(
    "#randomize-ships-btn"
);

const readyBtn = document.querySelector("#ready-btn");


// ====================
// GAME ELEMENTS
// ====================

const game =
    document.querySelector("#game");

const status =
    document.querySelector("#status");

const restartBtn =
    document.querySelector("#restart-btn");

const playerBoard =
    document.querySelector("#player-board");

const computerBoard =
    document.querySelector("#computer-board");

const roomCodeDisplay =
    document.querySelector("#room-code-display");


// ====================
// GAME STATE
// ====================

let battleshipGame = null;
let onlineGame = null;
let onlineAttackLocked = false;


// ====================
// COMPUTER MODE
// ====================

computerModeBtn.addEventListener("click", () => {

    lobby.hidden = true;
    game.hidden = false;

    startComputerGame();

});

readyBtn.addEventListener("click", () => {
    if (!onlineGame) return;
    if (onlineGame.playerReady) return;
    if (!onlineGame.playerBoard) return;

    onlineGame.setPlayerReady();

    readyBtn.disabled = true;
    randomizeShipsBtn.disabled = true;

    updateOnlineStatus(
        "Waiting for opponent...",
        "waiting"
    );

    socket.emit("player-ready", {
        roomCode: onlineGame.roomCode,
        ships: onlineGame.playerBoard.ships.map(
            ({ ship, start, direction }) => ({
                length: ship.length,
                start,
                direction
            })
        )
    });
});

function startComputerGame() {

    battleshipGame = new GameController();

    status.textContent = "Your Turn";

    render();

}


// ====================
// ONLINE MODE
// ====================

onlineModeBtn.addEventListener("click", () => {

    modeSelection.hidden = true;
    onlineLobby.hidden = false;

});


// ====================
// BACK TO MODE
// ====================

backToModeBtn.addEventListener("click", () => {

    onlineLobby.hidden = true;
    modeSelection.hidden = false;

    lobbyStatus.textContent = "";

});


// ====================
// CREATE GAME
// ====================

createGameBtn.addEventListener("click", () => {

    socket.emit("create-room");

    lobbyStatus.textContent =
        "Creating game...";

});


// ====================
// JOIN GAME
// ====================

joinGameBtn.addEventListener("click", () => {

    const roomCode =
        roomCodeInput.value.trim().toUpperCase();

    if (!roomCode) {

        lobbyStatus.textContent =
            "Please enter a room code.";

        return;
    }

    socket.emit("join-room", roomCode);

    lobbyStatus.textContent =
        "Joining game...";

});


// ====================
// ROOM CREATED
// ====================

socket.on("room-created", ({ roomCode }) => {

    roomCodeDisplay.textContent =
        roomCode;

    lobbyStatus.textContent =
        "Waiting for opponent...";

    createGameBtn.disabled = true;
    joinGameBtn.disabled = true;
    roomCodeInput.disabled = true;

});


// ====================
// ROOM JOINED
// ====================

socket.on("room-joined", ({ roomCode }) => {

    roomCodeDisplay.textContent =
        roomCode;

    lobbyStatus.textContent =
        "Joined game. Waiting for opponent...";

    createGameBtn.disabled = true;
    joinGameBtn.disabled = true;
    roomCodeInput.disabled = true;

});


// ====================
// OPPONENT JOINED
// ====================

socket.on("opponent-joined", () => {

    lobbyStatus.textContent =
        "Opponent joined!";

});

socket.on("opponent-disconnected", () => {
    if (!onlineGame) return;

    onlineGame.gameOver = true;

    onlineAttackLocked = true;

    randomizeShipsBtn.disabled = true;
    readyBtn.disabled = true;

    playAgainBtn.hidden = true;

    updateOnlineStatus("Opponent disconnected.", "error");
});

socket.on("opponent-ready", () => {
    if (!onlineGame) return;

    onlineGame.setOpponentReady();

    if (onlineGame.isReady()) {
        onlineStatus.textContent = "Both players ready!";
    } else {
        onlineStatus.textContent = "Opponent is ready. Waiting for you...";
    }
});


// ====================
// GAME READY
// ====================

socket.on("game-ready", ({ roomCode } = {}) => {
    lobby.hidden = true;
    onlineGameSection.hidden = false;

    onlineGame = new OnlineGame();

    if (roomCode) {
        onlineGame.setRoomCode(roomCode);
        onlineRoomCode.textContent = roomCode;
    }

    setupOnlineShips();

    updateOnlineStatus("Place your ships", "waiting");
});

socket.on("game-started", ({ currentTurn }) => {
    if (!onlineGame) return;

    onlineGame.setCurrentTurn(currentTurn);

    onlineAttackLocked = false;

    playAgainBtn.hidden = true;
    playAgainBtn.disabled = false;

    renderOnlineOpponentBoard();

    if (onlineGame.isMyTurn(socket.id)) {
        updateOnlineStatus("Your Turn", "your-turn");
    } else {
        updateOnlineStatus("Opponent's Turn", "opponent-turn");
    }
});

socket.on("attack-result", ({ coordinate, hit, gameOver }) => {
    if (!onlineGame) return;

    const [row, col] = coordinate;

    onlineGame.recordAttack(row, col, hit);

    onlineAttackLocked = false;

    renderOnlineOpponentBoard();

    if (gameOver) {
        updateOnlineStatus("You Win!", "win");
    }
});

socket.on("opponent-attacked", ({ coordinate, hit, gameOver }) => {
    if (!onlineGame) return;

    const [row, col] = coordinate;

    const cell = onlinePlayerBoard.querySelector(
        `[data-row="${row}"][data-col="${col}"]`
    );

    if (cell) {
        cell.classList.add(hit ? "hit" : "miss");
    }

    if (gameOver) {
        updateOnlineStatus("You Lose!", "lose");
    }
});

socket.on("turn-changed", ({ currentTurn }) => {
    if (!onlineGame) return;

    onlineGame.setCurrentTurn(currentTurn);

    onlineAttackLocked = false;

    renderOnlineOpponentBoard();

    if (onlineGame.isMyTurn(socket.id)) {
        updateOnlineStatus("Your Turn", "your-turn");
    } else {
        updateOnlineStatus("Opponent's Turn", "opponent-turn");
    }
});

socket.on("game-over", ({ winner }) => {
    if (!onlineGame) return;

    onlineGame.setGameOver(winner);

    onlineAttackLocked = true;

    randomizeShipsBtn.disabled = true;
    readyBtn.disabled = true;

    playAgainBtn.hidden = false;
    playAgainBtn.disabled = false;

    renderOnlineOpponentBoard();

    if (winner === socket.id) {
        updateOnlineStatus("You Win!", "win");
    } else {
        updateOnlineStatus("You Lose!", "lose");
    }
});

socket.on("opponent-rematch-ready", () => {
    if (!onlineGame) return;

    onlineStatus.textContent =
        "Opponent is ready for a rematch!";
});

socket.on("rematch-start", ({ roomCode }) => {
    prepareOnlineRematch(roomCode);

    onlineStatus.textContent =
        "New game! Place your ships.";
});


// ====================
// ROOM ERROR
// ====================

socket.on("room-error", ({ message }) => {

    lobbyStatus.textContent =
        message;

});

socket.on("room-created", ({ roomCode }) => {
    lobbyRoomCode.textContent = roomCode;
    createdRoom.hidden = false;

    lobbyStatus.textContent = "Waiting for opponent...";

    createGameBtn.disabled = true;
});

socket.on("attack-error", ({ message }) => {
    onlineAttackLocked = false;

    console.log("Attack error:", message);

    onlineStatus.textContent = message;
});


function prepareOnlineRematch(roomCode) {
    onlineGame = new OnlineGame();

    onlineGame.setRoomCode(roomCode);

    onlineAttackLocked = false;

    randomizeShipsBtn.disabled = false;
    readyBtn.disabled = false;

    playAgainBtn.hidden = true;

    setupOnlineShips();

    updateOnlineStatus("Place your ships", "waiting");
}


// ====================
// START GAME
// ====================

// function startGame() {

//     battleshipGame =
//         new GameController();

//     status.textContent =
//         "Game started!";

//     render();

// }

function handleOnlineAttack(row, col) {
    if (!onlineGame) return;

    if (onlineGame.gameOver) return;

    if (onlineAttackLocked) return;

    if (!onlineGame.isMyTurn(socket.id)) {
        return;
    }

    onlineAttackLocked = true;

    socket.emit("attack", {
        roomCode: onlineGame.roomCode,
        coordinate: [row, col]
    });
}

// function endOnlineGame() {
//     randomizeShipsBtn.disabled = true;
//     readyBtn.disabled = true;
// }

function setupOnlineShips() {
    const gameboard = new Gameboard();

    const ships = [5, 4, 3, 3, 2];

    ships.forEach(length => {
        gameboard.placeRandomShip(length);
    });

    onlineGame.setPlayerBoard(gameboard);

    renderOnlineBoard();
}


// ====================
// PLAYER ATTACK
// ====================

function handleAttack(row, col) {

    if (!battleshipGame) return;

    if (battleshipGame.isGameOver()) return;

    try {

        battleshipGame.playerAttack([row, col]);

        render();

        if (battleshipGame.isGameOver()) {

            showWinner();

            return;
        }

        status.textContent = "Computer Turn";

        setTimeout(() => {

            battleshipGame.computerAttack();

            render();

            if (battleshipGame.isGameOver()) {

                showWinner();

                return;
            }

            status.textContent = "Your Turn";

        }, 600);

    } catch (error) {

        console.log(error.message);

    }

}

function showWinner() {

    if (
        battleshipGame.player.gameboard.allShipsSunk()
    ) {

        status.textContent = "Computer Wins!";

    } else {

        status.textContent = "You Win!";

    }

}


// ====================
// RENDER
// ====================

function render() {

    if (!battleshipGame) return;

    const gameOver =
        battleshipGame.isGameOver();


    renderBoard(
        playerBoard,
        battleshipGame.player.gameboard,
        true
    );


    renderBoard(
        computerBoard,
        battleshipGame.computer.gameboard,
        false,
        gameOver ? null : handleAttack
    );

}

function renderOnlineBoard() {
    renderBoard(
        onlinePlayerBoard,
        onlineGame.playerBoard,
        true
    );
}

function renderOnlineOpponentBoard() {
    onlineOpponentBoard.innerHTML = "";

    const myTurn =
        onlineGame &&
        onlineGame.isMyTurn(socket.id) &&
        !onlineGame.gameOver &&
        !onlineAttackLocked;

    onlineOpponentBoard.classList.toggle(
        "board-active",
        myTurn
    );

    onlineOpponentBoard.classList.toggle(
        "board-disabled",
        !myTurn
    );

    for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
            const cell = document.createElement("div");

            cell.classList.add("cell");

            cell.dataset.row = row;
            cell.dataset.col = col;

            const attack = onlineGame.opponentAttacks.find(
                ({ row: r, col: c }) =>
                    r === row && c === col
            );

            if (attack) {
                cell.classList.add(
                    attack.hit ? "hit" : "miss"
                );
            }

            if (myTurn && !attack) {
                cell.addEventListener("click", () => {
                    handleOnlineAttack(row, col);
                });
            }

            onlineOpponentBoard.appendChild(cell);
        }
    }
}

function returnToMenu() {
    onlineGame = null;

    onlineAttackLocked = false;

    // Hide game screens
    onlineGameSection.hidden = true;
    onlineLobby.hidden = true;
    game.hidden = true;

    // Show main lobby
    lobby.hidden = false;
    modeSelection.hidden = false;

    // Reset lobby text
    lobbyStatus.textContent = "";
    onlineStatus.textContent = "";

    // Reset controls
    randomizeShipsBtn.disabled = false;
    readyBtn.disabled = false;

    playAgainBtn.hidden = true;
    playAgainBtn.disabled = false;

    createdRoom.hidden = true;
    lobbyRoomCode.textContent = "";
    createGameBtn.disabled = false;
}

function updateOnlineStatus(message, type = "") {
    onlineStatus.textContent = message;

    onlineStatus.classList.remove(
        "status-your-turn",
        "status-opponent-turn",
        "status-win",
        "status-lose",
        "status-waiting",
        "status-error"
    );

    if (type) {
        onlineStatus.classList.add(`status-${type}`);
    }
}

// ====================
// NEW GAME
// ====================

restartBtn.addEventListener("click", () => {

    battleshipGame =
        new GameController();

    status.textContent =
        "Game started!";

    render();

});

randomizeShipsBtn.addEventListener("click", () => {
    if (!onlineGame || onlineGame.playerReady) return;

    setupOnlineShips();

    updateOnlineStatus("Ships randomized", "waiting");
});

playAgainBtn.addEventListener("click", () => {
    if (!onlineGame) return;

    playAgainBtn.disabled = true;

    updateOnlineStatus("Waiting for opponent...", "waiting");

    socket.emit("play-again", {
        roomCode: onlineGame.roomCode
    });
});

backToMenuBtn.addEventListener("click", () => {
    if (onlineGame?.roomCode) {
        socket.emit("leave-room", {
            roomCode: onlineGame.roomCode
        });
    }

    returnToMenu();
});