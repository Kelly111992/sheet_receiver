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
    // Si los datos vienen dentro de .body (clásico de n8n) o directos
    const data = req.body.body || req.body;

    console.log(`🚀 PROCESANDO LEAD: ${data.Nombre || 'Sin nombre'}`);

    // RESPUESTA RÁPIDA PARA EVITAR TIMEOUT EN N8N
    res.status(200).json({ success: true, status: 'Processing' });

    // PROCESAMIENTO EN BACKGROUND
    if (data.Numero) {
        const message = `🏠 *NUEVO LEAD DE EXCEL* 🏠\n━━━━━━━━━━━━━━━\n👤 *Nombre:* ${data.Nombre || 'No disponible'}\n📱 *Teléfono:* ${data.Numero}\n🏠 *Propiedad:* ${data.Propiedad || 'No especificada'}\n🏗️ *Plataforma:* ${data.Plataforma || 'N/A'}\n━━━━━━━━━━━━━━━`;

        // No usamos await aquí para que no bloquee, lanzamos las promesas
        GESTORES.forEach(num => sendWhatsApp(num, message).catch(e => console.error(e)));
    } else {
        console.log('⚠️ Lead recibido sin número de teléfono');
    }
});

app.listen(3000, '0.0.0.0', () => console.log('✅ LUX LUX Excel encendido en puerto 3000'));
