
import makeWASocket, { DisconnectReason, delay, BufferJSON, useMultiFileAuthState } from 'baileys'
import { welcome } from './loads/welcome';
import { welcome1 } from './loads/welcomes/welcome1';
import { welcome2 } from './loads/welcomes/welcome2';
import { welcome3 } from './loads/welcomes/welcome3';
import { welcome5 } from './loads/welcomes/welcome5';
import { notselected } from './loads/notselected';

export const chatBot = async (sock,m): Promise <void> => {
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
        // console.log(mExt.contextInfo.quotedMessage.imageMessage.caption.includes('#ID01'))
        if (mQuoted=='') {
            if(msg.toLocaleLowerCase()=='halo')
            {
                //selamat datang
                await welcome(sock,m);
            }
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
}
