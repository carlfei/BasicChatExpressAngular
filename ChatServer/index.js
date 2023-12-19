const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const readLine = require('readline');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:4200", // Quita la barra al final de la URL
        methods: ["GET", "POST"]
    }
});

const users = {};
const rooms = new Set();

io.on('connection', (socket) => {
    console.log(`Usuario ${socket.id} conectado`);

    socket.on('join', (data) => {
        const { username, room } = data;
        users[socket.id] = { username, room };
        socket.join(room);
        rooms.add(room);

        socket.emit('chat', `¡Bienvenido, ${username}!`);

        io.to(room).emit('chat', `${username} se ha unido a la sala ${room}`);
    });

    socket.on('chat', (msg) => {
        const user = users[socket.id];
        const room = user.room;
        io.to(room).emit('chat', { msg: `${user.username} >>> ${msg}`, room: room });
    });

    socket.on('disconnect', () => {
        const user = users[socket.id];
        if (user) {
            const room = user.room;
            io.to(room).emit('chat', `${user.username} se ha ido del chat`);
        }
        console.log(`Usuario ${socket.id} desconectado`);
    });
});

server.listen(3000, () => {
    console.log("Servidor ejecutándose");
});

const rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function getMsg() {
    rl.question('Respuesta: ', (msg) => {
        io.emit('chat', `Server: ${msg}`);
        getMsg();
    });
}

// Descomenta la siguiente línea si deseas habilitar la entrada del servidor por consola.
// getMsg();
