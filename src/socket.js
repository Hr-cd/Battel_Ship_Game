import { io } from "socket.io-client";

const socket = io(
    process.env.BACKEND_URL || "http://localhost:3000"
);

// socket.on("connect", () => {

//     console.log("Connected to server:", socket.id);

// });

// socket.on("disconnect", () => {

//     console.log("Disconnected from server");

// });

// socket.on("room-created", ({ roomCode }) => {
//     console.log("ROOM CREATED:", roomCode);
// });

// socket.on("room-joined", ({ roomCode }) => {
//     console.log("ROOM JOINED:", roomCode);
// });

// socket.on("opponent-joined", () => {
//     console.log("OPPONENT JOINED!");
// });

// socket.on("game-ready", () => {
//     console.log("GAME READY!");
// });

// socket.on("room-error", ({ message }) => {
//     console.log("ROOM ERROR:", message);
// });

export default socket;