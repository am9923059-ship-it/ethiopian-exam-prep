const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const USERS_FILE = './users.json';

// 1. አካውንት መፍጠሪያ (Register)
app.post('/api/auth/register', (req, res) => {
    try {
        const { username, password } = req.body;
        let users = [];
        if (fs.existsSync(USERS_FILE)) {
            users = JSON.parse(fs.readFileSync(USERS_FILE));
        }
        
        // ተጠቃሚው አስቀድሞ መኖሩን መፈተሽ
        if (users.find(u => u.username === username)) {
            return res.status(400).json({ message: "ይህ ተጠቃሚ አስቀድሞ አለ!" });
        }

        users.push({ username, password });
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        console.log(`አዲስ አካውንት ተፈጠረ: ${username}`);
        res.status(201).json({ message: "አካውንት ተፈጥሯል!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. መግቢያ (Login)
app.post('/api/auth/login', (req, res) => {
    try {
        const { username, password } = req.body;
        if (!fs.existsSync(USERS_FILE)) {
            return res.status(400).json({ message: "ምንም ተጠቃሚ አልተመዘገበም!" });
        }
        const users = JSON.parse(fs.readFileSync(USERS_FILE));
        const user = users.find(u => u.username === username && u.password === password);
        
        if (!user) {
            return res.status(400).json({ message: "የተጠቃሚ ስም ወይም የይለፍ ቃል ተሳስቷል!" });
        }

        res.json({ message: "በተሳካ ሁኔታ ገብተሃል!", token: "telelo_local_token_123", user: { username } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



io.on('connection', (socket) => {
    socket.on('send_message', (data) => { io.emit('receive_message', data); });
});

const PORT = 5000;
server.listen(PORT, () => console.log(`TeleLo Local ሰርቨር በፖርት ${PORT} ላይ ተነስቷል!`));
