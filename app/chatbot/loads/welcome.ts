
import makeWASocket, { DisconnectReason, delay, BufferJSON, useMultiFileAuthState } from 'baileys'

export const welcome = async (sock,m): Promise <void> => {
    let mGet = m.messages[0];
    let from =  mGet.key.remoteJid;
    let participant = mGet.key.participant;
    let msg = mGet?.message?.conversation ?? false;

    let mess = '';
    mess += `*Selamat datang di WhatsApp Chatbot*\n`;
    mess += `silakan reply pesan dan masukkan nomor untuk memilih layanan\n`;
    mess += `1. Pilih satu\n`;
    mess += `2. Pilih dua\n`;
    mess += `3. Pilih tiga\n`;
    mess += `4. Pilih empat\n`;
    mess += `5. Chat Admin\n`;
    mess += `\n`;
    mess += `_#ID01_`;
    await sock.sendMessage(from!, {  
                image: {
                    url: './assets/logo.png'
                },caption: mess }, { quoted: mGet });
}
