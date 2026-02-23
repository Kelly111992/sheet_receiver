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
            hostname: urlObj.hostname, path: `/message/sendText/${EVOLUTION_INSTANCE}`, method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY, 'Content-Length': Buffer.byteLength(body) },
            timeout: 7000
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
        console.log(`🚀 PROCESANDO LEAD COMPLETO: ${data.Nombre}`);

        res.status(200).json({ success: true });

        const numero = data.Numero || data.numero;
        if (numero) {
            const message = `🏠 *NUEVO LEAD DE EXCEL* 🏠
━━━━━━━━━━━━━━━━━━━━━━━
👤 *Nombre:* ${data.Nombre || 'No disponible'}
📱 *Teléfono:* ${numero}
📧 *Email:* ${data.Correo || 'No disponible'}

🏠 *Propiedad:* ${data.Propiedad || 'No especificada'}
🆔 *ID Interno:* ${data.ID_Interno || 'N/A'}
🎯 *Campaña:* ${data.Campaña || 'N/A'}
🏗️ *Plataforma:* ${data.Plataforma || 'N/A'}
📩 *Modalidad:* ${data.Modalidad || 'N/A'}

🔗 *Link Anuncio:*
${data.LinkAnuncio || 'No disponible'}

📅 *Fecha:* ${data.Fecha || 'Hoy'}
🌐 *Fuente:* ${data.Fuente || 'Google Sheets'}
━━━━━━━━━━━━━━━━━━━━━━━`;

            GESTORES.forEach(num => sendWhatsApp(num, message).catch(e => console.error(e)));
        }
    } catch (err) { console.error(err); }
});

app.listen(3000, '0.0.0.0', () => console.log('✅ Receptor Excel LUX activo v2.0'));
