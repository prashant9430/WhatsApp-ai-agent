const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const axios = require("axios");

const N8N_WEBHOOK = "https://YOUR_N8N_URL/webhook/whatsapp";

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on("creds.update", saveCreds);

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
        text: res.data.reply || "AI busy hai, thoda baad try karein"
      });

    } catch (err) {
      console.error(err);
    }
  });
}

startBot();
