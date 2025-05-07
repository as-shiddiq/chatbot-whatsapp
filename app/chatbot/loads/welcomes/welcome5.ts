
import makeWASocket, { DisconnectReason, delay, BufferJSON, useMultiFileAuthState } from 'baileys'
import fs from 'fs';
const CONFIG = './configs/config.json';
const SESSIONS = './writables/chatbots';
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
            let setSession = btoa(randomAdmin.number+"&&"+from);
            mess = '';
            mess += `Ada pesan baru dari *${mGet.pushName}*, silakan akses untuk membalas pesan\n`;
            mess += `${webUrl}?from=${setSession}`;
            await sock.sendMessage(randomAdmin.number+'@s.whatsapp.net',  
                        { text: mess }, 
                        { quoted: mGet });
            //simpan info sebagai sessions chat dan tentukan expirednya
            let expiredAt = Date.now() + 30 * 60 * 1000;
            fs.writeFileSync(SESSIONS+'/'+setSession+'.json', JSON.stringify({"expired":expiredAt.toString()}, null, 2));
        }
    }
    else{
        console.log(`CONFIG belum dibuat di : ${CONFIG}`);
    }
}
