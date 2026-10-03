export default class OnlineGame {
    constructor() {
        this.playerBoard = null;
        this.opponentReady = false;
        this.playerReady = false;
        this.roomCode = null;
        this.currentTurn = null;
        this.opponentAttacks = [];
        this.gameOver = false;
        this.winner = null;
    }

    setCurrentTurn(socketId) {
        this.currentTurn = socketId;
    }

    setGameOver(winner) {
        this.gameOver = true;
        this.winner = winner;
    }

    isMyTurn(socketId) {
        return this.currentTurn === socketId;
    }

    setRoomCode(roomCode) {
        this.roomCode = roomCode;
    }

    setPlayerBoard(gameboard) {
        this.playerBoard = gameboard;
    }

    setPlayerReady() {
        this.playerReady = true;
    }

    setOpponentReady() {
        this.opponentReady = true;
    }

    isReady() {
        return this.playerReady && this.opponentReady;
    }

    recordAttack(row, col, hit) {
        this.opponentAttacks.push({
            row,
            col,
            hit
        });
    }
}