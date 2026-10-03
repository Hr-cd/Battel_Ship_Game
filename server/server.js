import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import Gameboard from "../src/models/Gameboard.js";

import {
    createRoom,
    joinRoom,
    getRoom,
    removePlayer
} from "./rooms.js";

const app = express();

app.use(
    cors({
        origin: clientUrl
    })
);

const httpServer = createServer(app);
const clientUrl = process.env.CLIENT_URL || "http://localhost:8080";

const io = new Server(httpServer, {
    cors: {
        origin: clientUrl,
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {

    console.log("Player connected:", socket.id);

    // CREATE ROOM
    socket.on("create-room", () => {

        const roomCode = createRoom(socket.id);

        socket.join(roomCode);

        socket.emit("room-created", {
            roomCode
        });

        console.log(
            `Room ${roomCode} created by ${socket.id}`
        );
    });


    // JOIN ROOM
    socket.on("join-room", (roomCode) => {

        const result = joinRoom(
            roomCode.toUpperCase(),
            socket.id
        );

        if (!result.success) {

            socket.emit("room-error", {
                message: result.message
            });

            return;
        }

        socket.join(roomCode.toUpperCase());

        socket.emit("room-joined", {
            roomCode: roomCode.toUpperCase()
        });

        socket.to(roomCode.toUpperCase()).emit(
            "opponent-joined"
        );

        console.log(
            `${socket.id} joined room ${roomCode}`
        );

        const room = getRoom(roomCode.toUpperCase());

        if (room.players.length === 2) {

            io.to(roomCode.toUpperCase()).emit("game-ready", {
                roomCode: roomCode.toUpperCase()
            });

            console.log(
                `Room ${roomCode} is ready`
            );
        }
    });


    socket.on("leave-room", ({ roomCode }) => {
        const room = getRoom(roomCode);

        if (!room) return;

        if (!room.players.includes(socket.id)) {
            return;
        }

        removePlayer(socket.id);

        socket.leave(roomCode);

        socket.to(roomCode).emit("opponent-disconnected");

        console.log(
            `Player ${socket.id} left room ${roomCode}`
        );
    });

    // DISCONNECT
    socket.on("disconnect", () => {
        console.log("Player disconnected:", socket.id);

        const roomCode = removePlayer(socket.id);

        if (roomCode) {
            socket.to(roomCode).emit("opponent-disconnected");

            console.log(
                `Player removed from room ${roomCode}`
            );
        }
    });

    socket.on("player-ready", ({ roomCode, ships }) => {
        const room = getRoom(roomCode);

        if (!room) {
            socket.emit("room-error", {
                message: "Room not found"
            });
            return;
        }

        if (room.players.length !== 2) {
            socket.emit("room-error", {
                message: "Waiting for opponent"
            });
            return;
        }

        if (room.readyPlayers.has(socket.id)) {
            return;
        }

        const expectedFleet = [5, 4, 3, 3, 2];

        const receivedFleet = ships
            .map(ship => ship.length)
            .sort((a, b) => b - a);

        if (
            receivedFleet.length !== expectedFleet.length ||
            receivedFleet.some(
                (length, index) => length !== expectedFleet[index]
            )
        ) {
            socket.emit("room-error", {
                message: "Invalid fleet configuration"
            });
            return;
        }

        for (const shipData of ships) {
            if (
                !shipData ||
                !Number.isInteger(shipData.length) ||
                !Array.isArray(shipData.start) ||
                shipData.start.length !== 2 ||
                !shipData.start.every(Number.isInteger) ||
                !["horizontal", "vertical"].includes(shipData.direction)
            ) {
                socket.emit("room-error", {
                    message: "Invalid ship data"
                });
                return;
            }
        }   

        const gameboard = new Gameboard();

        for (const shipData of ships) {
            const placed = gameboard.placeShip(
                shipData.length,
                shipData.start,
                shipData.direction
            );

            if (!placed) {
                socket.emit("room-error", {
                    message: "Invalid ship placement"
                });
                return;
            }
        }

        room.boards.set(socket.id, gameboard);

        room.readyPlayers.add(socket.id);

        console.log(
            `Player ${socket.id} is ready in room ${roomCode}`
        );

        socket.to(roomCode).emit("opponent-ready");

        if (
            room.readyPlayers.size === 2 &&
            room.players.length === 2
        ) {
            room.gameStarted = true;

            room.currentTurn = room.players[0];

            io.to(roomCode).emit("game-started", {
                currentTurn: room.currentTurn
            });

            console.log(
                `Game started in room ${roomCode}`
            );

            console.log(
                `First turn: ${room.currentTurn}`
            );
        }
    });

    socket.on("attack", ({ roomCode, coordinate }) => {
        const room = getRoom(roomCode);

        if (!room) {
            socket.emit("attack-error", {
                message: "Room not found"
            });
            return;
        }

        if (!room.gameStarted) {
            socket.emit("attack-error", {
                message: "Game has not started"
            });
            return;
        }

        if (room.currentTurn !== socket.id) {
            socket.emit("attack-error", {
                message: "It is not your turn"
            });
            return;
        }

        const opponentId = room.players.find(
            playerId => playerId !== socket.id
        );

        if (!opponentId) {
            socket.emit("attack-error", {
                message: "Opponent not found"
            });
            return;
        }

        const opponentBoard = room.boards.get(opponentId);

        if (!opponentBoard) {
            socket.emit("attack-error", {
                message: "Opponent board not found"
            });
            return;
        }

        const [row, col] = coordinate;

        if (
            !Number.isInteger(row) ||
            !Number.isInteger(col) ||
            row < 0 ||
            row > 9 ||
            col < 0 ||
            col > 9
        ) {
            socket.emit("attack-error", {
                message: "Invalid coordinate"
            });
            return;
        }

        let hit;

        try {
            hit = opponentBoard.receiveAttack([row, col]);
        } catch (error) {
            socket.emit("attack-error", {
                message: error.message
            });
            return;
        }

        const gameOver = opponentBoard.allShipsSunk();

        socket.emit("attack-result", {
            coordinate,
            hit,
            gameOver
        });

        socket.to(roomCode).emit("opponent-attacked", {
            coordinate,
            hit,
            gameOver
        });

        if (gameOver) {
            io.to(roomCode).emit("game-over", {
                winner: socket.id
            });

            room.gameStarted = false;

            return;
        }

        room.currentTurn = opponentId;

        io.to(roomCode).emit("turn-changed", {
            currentTurn: room.currentTurn
        });
    });

    socket.on("play-again", ({ roomCode }) => {
        const room = getRoom(roomCode);

        if (!room) {
            socket.emit("room-error", {
                message: "Room not found"
            });
            return;
        }

        if (!room.players.includes(socket.id)) {
            socket.emit("room-error", {
                message: "You are not in this room"
            });
            return;
        }

        room.rematchPlayers.add(socket.id);

        console.log(
            `Player ${socket.id} wants a rematch in room ${roomCode}`
        );

        socket.to(roomCode).emit("opponent-rematch-ready");

        if (room.rematchPlayers.size === 2) {

            room.rematchPlayers.clear();

            room.readyPlayers.clear();

            room.boards.clear();

            room.currentTurn = null;

            room.gameStarted = false;

            io.to(roomCode).emit("rematch-start", {
                roomCode: roomCode.toUpperCase()
            });

            console.log(
                `Rematch started in room ${roomCode}`
            );
        }
    });

});

const PORT = 3000;

httpServer.listen(PORT, () => {

    console.log(
        `Server running on http://localhost:${PORT}`
    );

});

app.get("/health", (req, res) => {
    res.json({
        status: "ok"
    });
});