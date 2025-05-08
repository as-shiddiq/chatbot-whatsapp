
import makeWASocket, { DisconnectReason, delay, BufferJSON, useMultiFileAuthState } from 'baileys'
import { welcome } from './loads/welcome';
import { welcome1 } from './loads/welcomes/welcome1';
import { welcome2 } from './loads/welcomes/welcome2';
import { welcome3 } from './loads/welcomes/welcome3';
import { welcome5 } from './loads/welcomes/welcome5';
import { notselected } from './loads/notselected';
const SESSIONS_MEMBER = './writables/members';
const SESSIONS_ADMIN = './writables/admins';
import { Server } from "socket.io";
import fs from 'fs';
import path from 'path';

export const chatBot = async (sock,m,io,users): Promise <void> => {
    // console.log(m.messages)    
    let mGet = m.messages[0];
    let from =  mGet.key.remoteJid;
    let participant = mGet.key.participant;
    let extMsg = !!mGet.message?.extendedTextMessage;
    let mQuoted = '';
    let msg = '';

    if (extMsg) {
        const mExt = mGet.message.extendedTextMessage;

        // Cek apakah contextInfo dan quotedMessage ada
        const quoted = mExt.contextInfo?.quotedMessage;

        if (!quoted) {
            console.log('bukan quoted');
            msg = mExt.text;
        } else {
            console.log('quoted');
            const qImg = !!quoted.imageMessage;
            msg = mExt.text;

            if (qImg) {
                mQuoted = quoted.imageMessage.caption || '';
            }
        }
    } else {
        msg = mGet?.message?.conversation ?? '';
    }
    
    if(!mGet.key.fromMe)
    {
        //proses chatbot
        //cek apakah ada sessions disimpan untuk chat
        let chatSession = SESSIONS_MEMBER+'/'+from.split('@').shift()+'.json';
        if (!fs.existsSync(chatSession)) {
            // console.log(mExt.contextInfo.quotedMessage.imageMessage.caption.includes('#ID01'))
            if (mQuoted=='') {
                await welcome(sock,m);
            } 
            else if (mQuoted.includes('#ID01')) {
                    if (msg === '1') {
                        welcome1(sock, m);
                    } else if (msg === '2') {
                        welcome2(sock, m);
                    } else if (msg === '3') {
                        welcome3(sock, m);
                    } else if (msg === '5') {
                        welcome5(sock, m);
                    } else {
                        notselected(sock, m);
                    }
            }   
            else {
                console.error("mGet.message.extendedTextMessage tidak ditemukan!", mGet);
            } 
        }
        else
        {
            //cek apakah expired
            const data = JSON.parse(fs.readFileSync(chatSession, 'utf-8'));
            const expiredAt = parseInt(data.expired_at); // konversi string ke angka
            const now = Date.now();

            if (now < expiredAt) {
                let token = btoa(data.to+"&&"+(from).split('@').shift())
                const targetSocketId = users.get(token);
                let message = {text:msg,status:"member",image:null};
                io.to(targetSocketId).emit('sv.sendMessage', { token:token , message: message });
                let expiredAt = Date.now() + 60 * 60 * 1000;
                data.expired_at = expiredAt;
                fs.writeFileSync(chatSession, JSON.stringify(data, null, 2));

                //lanjutkan simpan chat untuk admin
                let chatSessionAdmin = SESSIONS_ADMIN+'/'+data.to+'/'+from.split('@').shift()+'.json';
                if (fs.existsSync(chatSessionAdmin)) {
                    const dataAdmin = JSON.parse(fs.readFileSync(chatSessionAdmin, 'utf-8'));
                    dataAdmin.expired_at = expiredAt;
                    if (!Array.isArray(dataAdmin.message)) {
                        dataAdmin.message = [];
                    }
                    dataAdmin.message.push(message);
                    fs.writeFileSync(chatSessionAdmin, JSON.stringify(dataAdmin, null, 2));
                }
            } else {
                await sock.sendMessage(from,{ text: "Maaf, sesi chat Anda telah berakhir" });
                await delay(1000);
                welcome(sock, m);
                fs.unlinkSync(chatSession);
            }
        }
    }
}
