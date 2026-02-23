const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');

const app = express();
app.use(bodyParser.json());

const EVOLUTION_API_URL = 'https://evolutionapi-evolution-api.ckoomq.easypanel.host';
const EVOLUTION_INSTANCE = 'lugo_email';
const EVOLUTION_API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const GESTORES = ['523318043673', '523312505239', '523318213624'];

async function sendWhatsApp(number, text) {
    if (!number) return;
    const cleanNumber = number.toString().replace(/[^\d+]/g, '');
    return new Promise((resolve) => {
        const urlObj = new URL(EVOLUTION_API_URL);
        const body = JSON.stringify({ number: cleanNumber, text });
        const options = {
            hostname: urlObj.hostname,
            path: `/message/sendText/${EVOLUTION_INSTANCE}`,
            method: 'POST',
            port: urlObj.port || 443,
            headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY, 'Content-Length': Buffer.byteLength(body) }
        };
        const req = https.request(options, res => {
            res.on('data', () => { });
            res.on('end', () => resolve(res.statusCode));
        });
        req.on('error', () => resolve(500));
        req.write(body); req.end();
    });
}

app.post('/webhook', async (req, res) => {
    try {
        const data = req.body;
        console.log(`🚀 LEAD RECIBIDO: ${data.Nombre}`);

        const message = `🏠 *NUEVO LEAD DE EXCEL* 🏠\n━━━━━━━━━━━━━━━\n👤 *Nombre:* ${data.Nombre || 'No disponible'}\n📱 *Teléfono:* ${data.Numero}\n🏠 *Propiedad:* ${data.Propiedad || 'No especificada'}\n🏗️ *Plataforma:* ${data.Plataforma || 'N/A'}\n━━━━━━━━━━━━━━━`;

        await Promise.all(GESTORES.map(num => sendWhatsApp(num, message)));
        res.status(200).json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

app.listen(3000, '0.0.0.0', () => console.log('✅ Receptor Excel listo en puerto 3000'));
