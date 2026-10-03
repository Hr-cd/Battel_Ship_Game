const rooms = new Map();

export function createRoom(socketId) {
    let roomCode;

    do {
        roomCode = Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();
    } while (rooms.has(roomCode));

    rooms.set(roomCode, {
        players: [socketId],
        gameStarted: false,
        readyPlayers: new Set(),
        rematchPlayers: new Set(),
        currentTurn: null,
        boards: new Map()
    });
    return roomCode;
}

export function joinRoom(roomCode, socketId) {
    const room = rooms.get(roomCode);

    if (!room) {
        return {
            success: false,
            message: "Room not found"
        };
    }

    if (room.players.length >= 2) {
        return {
            success: false,
            message: "Room is full"
        };
    }

    if (room.players.includes(socketId)) {
        return {
            success: false,
            message: "You are already in this room"
        };
    }

    room.players.push(socketId);

    return {
        success: true,
        room
    };
}

export function getRoom(roomCode) {
    return rooms.get(roomCode);
}

export function removePlayer(socketId) {
    for (const [roomCode, room] of rooms.entries()) {
        if (room.players.includes(socketId)) {

            room.players = room.players.filter(
                id => id !== socketId
            );

            room.readyPlayers.delete(socketId);
            room.rematchPlayers.delete(socketId);
            room.boards.delete(socketId);

            if (room.players.length === 0) {
                rooms.delete(roomCode);
            }

            return roomCode;
        }
    }

    return null;
}