import makeWASocket, { DisconnectReason, delay, BufferJSON, useMultiFileAuthState, Browsers } from 'baileys'
import P from 'pino'
import {Boom} from '@hapi/boom'
import { chatBot } from './app/chatbot';
import { welcome } from './app/chatbot/loads/welcome';
import {splash} from './app/splash';
import QRCode from 'qrcode'
import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from "socket.io";
import fs from 'fs';
import path from 'path';
const SESSIONS_ADMIN = './writables/admins';

// (globalThis as any).crypto = crypto;

//buat webserver
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});

httpServer.listen(3000, () => {
  splash();
  console.log('server running at http://localhost:3000/');
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
// Jika akses root, arahkan ke index.html
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/chatlist', (req: Request, res: Response) => {
  let token = req.query.token as string;
  if(!token)
  {
     return res.status(500).json({ error: 'Token tidak sesuai' });
  }
  let tokenDec = atob(token);
  let chatSessionAdmin = SESSIONS_ADMIN+'/'+tokenDec.split('&&').shift()+'/'+tokenDec.split('&&').pop()+'.json';
  if (fs.existsSync(chatSessionAdmin)) {
    const data = JSON.parse(fs.readFileSync(chatSessionAdmin, 'utf-8'));
    res.json(data);
  }
  else
  {
    return res.status(500).json({ error: 'Token tidak ditemukan' });
  } 
  console.log(req.query.token);
});
// Socket.IO handler
const users = new Map<string, string>(); 
//WhatsApp Baileys
const waConnect = new Map();

async function connectToWhatsApp () {
    const { state, saveCreds } = await useMultiFileAuthState('.sessions')
    const sock = makeWASocket({
        auth: state, // auth state of your choosing,
        logger: P(), // you can configure this as much as you want, even including streaming the logs to a ReadableStream for upload or saving to a file
        browser:Browsers.macOS("ZETA")  
    })

    //update credintials
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

    //chat masuk
    sock.ev.on('messages.upsert', async m => {
        console.log("UPSERT");
        console.log(m.messages[0]);
        console.log("\n\n");
        //cek apakah dari chat pribadi
        let jId = m.messages[0].key.remoteJid;
        let fromMe = m.messages[0].key.fromMe;
        if(jId.endsWith('@s.whatsapp.net'))
        {
            console.log(`Private : ${jId}`);
            await chatBot(sock,m,io,users);
        }
        else{
            console.log(`Bukan private : ${jId}`);
        }
    });


    //IO Handler
    io.on('connection', async (socket) => {
      const userId = socket.handshake.query.userId as string;
      if (userId) {
        users.set(userId, socket.id);
        console.log(`User ${userId} connected with socket ID ${socket.id}`);
      }


      //jika ada pesan yang dikirim dari client dalam hal ini admin
      socket.on("cl.sendMessage", async (resp,callback) => {
        console.log(`[${userId}] says:`, resp);
        //cek apakah token ada
        let token = resp.token;
        
        //tambah informasi pesan dibuat
        let message = resp.message;
        message.timestamp = Date.now();

        const targetSocketId = users.get(token);
        let tokenDec = atob(resp.token);

        let chatSessionAdmin = SESSIONS_ADMIN+'/'+tokenDec.split('&&').shift()+'/'+tokenDec.split('&&').pop()+'.json';
        if (fs.existsSync(chatSessionAdmin)) {
          const dataAdmin = JSON.parse(fs.readFileSync(chatSessionAdmin, 'utf-8'));
          const expiredAt = parseInt(dataAdmin.expired_at); 
          const now = Date.now();
          if (now < expiredAt) {
            let dest = tokenDec.split('&&').pop()+'@s.whatsapp.net';
            await sock.sendMessage(dest,{ text: message.text });

            //update chat admin
            if (!Array.isArray(dataAdmin.message)) {
                  dataAdmin.message = [];
              }
              dataAdmin.message.push(message);
              fs.writeFileSync(chatSessionAdmin, JSON.stringify(dataAdmin, null, 2));
              callback({ success: true });
          } else {
            io.to(targetSocketId).emit('sv.sendMessage', { token:token , message: {text:"❌ chat session sudah tidak aktif",status:"error"} });
          }
          console.log(`Chat session : ${token}`);
        }
        else
        {
          io.to(targetSocketId).emit('sv.sendMessage', { token:token , message: {text:"🚫 chat session tidak ada",status:"error"} });
        } 

       
      });

      socket.on('disconnect', () => {
        if (userId) {
          users.delete(userId);
        }
      });
    });

}

connectToWhatsApp()
