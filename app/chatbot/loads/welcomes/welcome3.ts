
import makeWASocket, { DisconnectReason, delay, BufferJSON, useMultiFileAuthState } from 'baileys'

export const welcome3 = async (sock,m): Promise <void> => {
    let mGet = m.messages[0];
    let from =  mGet.key.remoteJid;
    let participant = mGet.key.participant;
    let msg = mGet?.message?.conversation ?? false;

    let mess = '';
    mess += `Anda Memilih 3\n`;
    mess += `\n`;
    mess += `_#IDW03_`;
    await sock.sendMessage(from!,  
                 { text: mess }, 
                 { quoted: mGet });
}
