
import makeWASocket, { DisconnectReason, delay, BufferJSON, useMultiFileAuthState } from 'baileys'

export const notselected = async (sock,m): Promise <void> => {
    let mGet = m.messages[0];
    let from =  mGet.key.remoteJid;
    let participant = mGet.key.participant;
    let msg = mGet?.message?.conversation ?? false;

    let mess = '';
    mess += `Maaf, pilihan yang Anda masukkan tidak ditemukan`;
    await sock.sendMessage(from!,  
                 { text: mess }, 
                 { quoted: mGet });
}
