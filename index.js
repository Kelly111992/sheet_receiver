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
            headers: {
                'Content-Type': 'application/json',
                'apikey': EVOLUTION_API_KEY,
                'Content-Length': Buffer.byteLength(body)
            },
            timeout: 7000 // 7 segundos máximo para no colgar el servidor
        };

        const req = https.request(options, res => {
            let resData = '';
            res.on('data', chunk => resData += chunk);
            res.on('end', () => {
                console.log(`   📱 Resultado WA (${cleanNumber}): ${res.statusCode}`);
                resolve(res.statusCode);
            });
        });

        req.on('error', (e) => {
            console.error(`   ❌ Error WA (${cleanNumber}): ${e.message}`);
            resolve(500);
        });

        req.on('timeout', () => {
            req.destroy();
            console.error(`   ⏰ Timeout WA (${cleanNumber})`);
            resolve(408);
        });

        req.write(body);
        req.end();
    });
}

app.post('/webhook', async (req, res) => {
    try {
        const data = req.body;
        console.log(`🚀 LEAD RECIBIDO: ${data.Nombre || 'Sin nombre'}`);

        // RESPUESTA INMEDIATA A N8N
        res.status(200).json({ success: true });

        // PROCESAMIENTO BACKGROUND
        const numero = data.Numero || data.numero;
        if (numero) {
            const message = `🏠 *NUEVO LEAD DE EXCEL* 🏠\n━━━━━━━━━━━━━━━\n👤 *Nombre:* ${data.Nombre || 'No disponible'}\n📱 *Teléfono:* ${numero}\n🏠 *Propiedad:* ${data.Propiedad || 'No especificada'}\n🏗️ *Plataforma:* ${data.Plataforma || 'N/A'}\n━━━━━━━━━━━━━━━`;

            console.log(`   📱 Notificando a ${GESTORES.length} gestores...`);
            // Ejecutar envíos
            for (const num of GESTORES) {
                sendWhatsApp(num, message).catch(e => console.error(`Error enviando a ${num}:`, e.message));
            }
        } else {
            console.log('⚠️ Lead sin número, no se puede enviar WhatsApp');
        }
    } catch (err) {
        console.error('💥 Error crítico:', err.message);
    }
});

app.listen(3000, '0.0.0.0', () => console.log('✅ Receptor Excel LUX activo en puerto 3000'));
