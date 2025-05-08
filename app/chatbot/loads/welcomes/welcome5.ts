
import makeWASocket, { DisconnectReason, delay, BufferJSON, useMultiFileAuthState } from 'baileys'
import fs from 'fs';
import path from 'path';
const CONFIG = './configs/config.json';
const SESSIONS_MEMBER = './writables/members';
const SESSIONS_ADMIN = './writables/admins';
export const welcome5 = async (sock,m): Promise <void> => {
    let mGet = m.messages[0];
    let from =  mGet.key.remoteJid;
    console.log(mGet)
    let participant = mGet.key.participant;
    let msg = mGet?.message?.conversation ?? false;
    let confData = "";

    let mess = '';
    mess += `Anda Memilih untuk menghubungi Admin\n`;
    mess += `Mohon menunggu untuk disambungkan\n`;
    mess += `\n`;
    mess += `_#IDW05_`;
    await sock.sendMessage(from!,  
                 { text: mess }, 
                 { quoted: mGet });
    
    if (fs.existsSync(CONFIG)) {
        confData = fs.readFileSync(CONFIG, 'utf-8');
        let conf = JSON.parse(confData);
        console.log("CHATBOT");
        console.log(mGet);
        const adminData = conf.admin;
        const webUrl = conf.weburl;
        if (adminData && adminData.length > 0) {
            const randomIndex = Math.floor(Math.random() * adminData.length);
            const randomAdmin = adminData[randomIndex];
            await delay(2000);
            mess = '';
            mess += `Anda sudah terhubung dengan *${randomAdmin.name}*`;
            await sock.sendMessage(from!,  
                        { text: mess }, 
                        { quoted: mGet });
            
            //kirim pesan ke web admin untuk memulai chat
            let setSession = btoa(randomAdmin.number+"&&"+(from).split('@').shift());
            mess = '';
            mess += `Ada pesan baru dari *${mGet.pushName}*, silakan akses untuk membalas pesan\n`;
            mess += `${webUrl}?token=${setSession}`;
            await sock.sendMessage(randomAdmin.number+'@s.whatsapp.net',  
                        { text: mess }, 
                        { quoted: mGet });
            //simpan info sebagai chat sessions dan tentukan expirednya
            let expiredAt = Date.now() + 60 * 60 * 1000;
            fs.writeFileSync(SESSIONS_MEMBER+'/'+(from).split('@').shift()+'.json', JSON.stringify({"expired_at":expiredAt.toString(),"to":randomAdmin.number}, null, 2));

            //proses simpan session admin
            const adminSessionDir = path.join(SESSIONS_ADMIN, randomAdmin.number);
            const adminSessionFile = path.join(adminSessionDir, `${from.split('@').shift()}.json`);

            // Buat folder jika belum ada
            if (!fs.existsSync(adminSessionDir)) {
                fs.mkdirSync(adminSessionDir, { recursive: true });
            }
            fs.writeFileSync(adminSessionFile, JSON.stringify({ expired_at: expiredAt.toString(),"name":mGet.pushName,"messages":[] }, null, 2))
        }
    }
    else{
        console.log(`CONFIG belum dibuat di : ${CONFIG}`);
    }
}
