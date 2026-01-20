const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const axios = require("axios");
const P = require("pino");

const N8N_WEBHOOK = "https://YOUR_N8N_URL/webhook/whatsapp";

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    browser: ["WhatsApp AI", "Chrome", "1.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { qr, connection } = update;

    if (qr) {
      console.log("SCAN THIS QR CODE 👇");
      console.log(qr);
    }

    if (connection === "open") {
      console.log("✅ WhatsApp connected successfully");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text;

    if (!text) return;

    try {
      const res = await axios.post(N8N_WEBHOOK, {
        text,
        from: msg.key.remoteJid
      });

      await sock.sendMessage(msg.key.remoteJid, {
        text: res.data.reply || "AI busy hai"
      });

    } catch (err) {
      console.log("Error:", err.message);
    }
  });
}

startBot();
