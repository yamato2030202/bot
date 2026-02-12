const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const axios = require("axios");
const fs = require("fs");
const http = require('http');

// --- 🌐 نظام البقاء 24/24 (رابط الربط بـ UptimeRobot) ---
http.createServer((req, res) => {
    res.write("ELGRANDFT System is Online 24/7");
    res.end();
}).listen(8080, () => {
    console.log("\n" + "=".repeat(40));
    console.log("🚀 نظام ELGRANDFT جاهز للعمل!");
    console.log("🔗 استخدم هذا الرابط في UptimeRobot:");
    console.log(`👉 https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.app`);
    console.log("=".repeat(40) + "\n");
}); 

// --- ⚙️ إعدادات المطور ELGRANDFT ---
const ADMIN_NUMBER = "212781886270@s.whatsapp.net"; 
const DEVELOPER_NAME = "ELGRANDFT";
const DEVELOPER_PHONE = "+212781886270";
const DB_FILE = "users_db.json";
const GROQ_KEY = "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";

// إدارة قاعدة البيانات
let userDB = fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE)) : {};
function saveDB() { fs.writeFileSync(DB_FILE, JSON.stringify(userDB, null, 2)); }

let tempSessions = {}; 

/**
 * 🧠 محرك الرد الذكي (مدح المطور)
 */
async function getSmartReply(text) {
    try {
        const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [{ 
                role: "system", 
                content: `أنت مساعد ذكي ومباشر. مطورك هو العبقري ${DEVELOPER_NAME}. 
                أنت تجيب على أي سؤال، معادلات، أو تحليل صور. 
                إذا سُئلت عن المطور، امدحه بشدة وقل إنه محترف وخبير، وأعطهم رقمه ${DEVELOPER_PHONE}.` 
            }, { role: "user", content: text }],
            temperature: 0.2
        }, { headers: { "Authorization": `Bearer ${GROQ_KEY}` } });
        return res.data.choices[0].message.content;
    } catch (e) { return "⚠️ السيرفر مشغول حالياً."; }
}

async function startAI() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({ 
        auth: state, 
        printQRInTerminal: true, 
        browser: ["ELGRANDFT-System", "Chrome", "1.0"] 
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        let text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();

        // 🛡️ تفعيل المستخدمين بالكود
        if (text === "abdessamad2014") {
            const list = Object.keys(userDB).map((u, i) => `${i+1}. wa.me/${u.split('@')[0]}`).join('\n');
            await sock.sendMessage(from, { text: `📊 القائمة النشطة:\n${list}` }); return;
        }

        if (from !== ADMIN_NUMBER && (!userDB[from] || !userDB[from].authorized)) {
            if (text === "FT2026") { 
                userDB[from] = { authorized: true }; saveDB(); 
                await sock.sendMessage(from, { text: "✅ تم تفعيلك بنجاح في نظام ELGRANDFT!" }); 
            } else { 
                await sock.sendMessage(from, { text: "👋 أرسل كود التفعيل للبدء." }); 
            }
            return;
        }

        // 📧 إيميل وهمي
        if (text === "إيميل وهمي") {
            try {
                const res = await axios.get("https://api.guandaba.top/api/tempmail/create");
                tempSessions[from] = res.data;
                await sock.sendMessage(from, { text: `📧 إيميلك: *${res.data.email}*\nأرسل "الرسائل" للكود.` });
            } catch (e) { await sock.sendMessage(from, { text: "⚠️ حاول مجدداً." }); }
            return;
        }

        if (text === "الرسائل") {
            const session = tempSessions[from];
            if (!session) return await sock.sendMessage(from, { text: "❌ اطلب إيميلاً أولاً." });
            try {
                const res = await axios.get(`https://api.guandaba.top/api/tempmail/messages?token=${session.token}`);
                if (res.data.length === 0) return await sock.sendMessage(from, { text: "📥 لا توجد رسائل." });
                for (let m of res.data) {
                    await sock.sendMessage(from, { text: `📩 من: ${m.from}\nالمحتوى: ${m.body}` });
                }
            } catch (e) { await sock.sendMessage(from, { text: "⚠️ انتهت الجلسة." }); }
            return;
        }

        // 🧠 الرد الذكي الافتراضي
        if (text) {
            const reply = await getSmartReply(text);
            await sock.sendMessage(from, { text: reply });
        }
    });
}

// تشغيل البوت
startAI();
