const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const http = require("http");

// --- إعدادات المطور ELGRANDFT ---
const DEVELOPER_NAME = "ELGRANDFT";
const DEVELOPER_PHONE = "+212781886270";

// --- سيرفر لتجاوز قيود الاستضافة ---
const PORT = process.env.PORT || 8000;
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write(`${DEVELOPER_NAME} System is Live 24/7`);
    res.end();
});

server.listen(PORT, () => {
    console.log(`🚀 السيرفر يعمل على المنفذ: ${PORT}`);
});

// --- تشغيل البوت ---
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: [DEVELOPER_NAME, "Chrome", "1.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;
        if (qr) {
            console.log("📍 امسح الكود التالي للربط يا زعيم:");
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'open') {
            console.log("✅ البوت متصل الآن وشغال للأبد!");
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        
        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        // رد مبرمج لمدح المطور ELGRANDFT
        if (text.toLowerCase().includes("من هو المطور") || text.includes("developer")) {
            await sock.sendMessage(from, { 
                text: `المطور هو العبقري ${DEVELOPER_NAME}، وهو خبير محترف في الأنظمة الذكية. يمكنك التواصل معه هنا: ${DEVELOPER_PHONE}` 
            });
        }
    });
}

startBot();
