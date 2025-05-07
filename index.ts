import makeWASocket, { DisconnectReason, delay, BufferJSON, useMultiFileAuthState, Browsers } from 'baileys'
import P from 'pino'
import {Boom} from '@hapi/boom'
import { chatBot } from './app/chatbot';
import QRCode from 'qrcode'
import * as crypto from 'crypto';
import express from 'express';
import { createServer } from 'http';
import { Server } from "socket.io";

(globalThis as any).crypto = crypto;

//buat webserver
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});

httpServer.listen(3000, () => {
  console.log('Socket.IO server running at http://localhost:3000/');
});

// Socket.IO handler
const users = new Map<string, string>(); 
io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId as string;
  if (userId) {
    users.set(userId, socket.id);
    console.log(`User ${userId} connected with socket ID ${socket.id}`);
  }

  socket.on("cl.sendMessage", (msg) => {
    console.log(`[${userId}] says:`, msg);
  });

  socket.on('disconnect', () => {
    if (userId) {
      users.delete(userId);
    }
  });
});



//WhatsApp Baileys
const waConnect = new Map();

async function connectToWhatsApp () {
    const { state, saveCreds } = await useMultiFileAuthState('.sessions')
    const sock = makeWASocket({
        auth: state, // auth state of your choosing,
        logger: P(), // you can configure this as much as you want, even including streaming the logs to a ReadableStream for upload or saving to a file
        browser:Browsers.macOS("ZETA")  
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect,qr } = update
        if (qr) {
            console.log(await QRCode.toString(qr, {type:'terminal',margin: 1,small: true   }))
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('Connection closed due to', lastDisconnect?.error, ', reconnecting', shouldReconnect)
            if (shouldReconnect) {
                connectToWhatsApp() // Reconnect if necessary
            }
        } else if (connection === 'open') {
            console.log('Opened connection');
            waConnect.set('connected', { sock, saveCreds});
        }
    });

    sock.ev.on('messages.upsert', async m => {
        console.log("UPSERT");
        console.log(m);
        console.log("\n\n");
        await chatBot(sock,m);

        //
        const targetSocketId = users.get('6285156202101');
        io.to(targetSocketId).emit('sv.forwardMessage', { from: "akay", message: "beheh" });
    });
}

connectToWhatsApp()
