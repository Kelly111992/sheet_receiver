const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');

const app = express();
app.use(bodyParser.json());

// CONFIG EXTERNA E INTERNA
const EVOLUTION_API_URL = 'https://evolutionapi-evolution-api.ckoomq.easypanel.host';
const EVOLUTION_INSTANCE = 'lugo_email';
const EVOLUTION_API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const GESTORES = ['523318043673', '523312505239', '523318213624'];

async function sendWhatsApp(number, text) {
    if (!number) return;
    const cleanNumber = number.toString().replace(/[^\d+]/g, '');

    console.log(`   [DEBUG] Intentando enviar a ${cleanNumber}...`);

    return new Promise((resolve) => {
        const body = JSON.stringify({ number: cleanNumber, text });
        const urlObj = new URL(EVOLUTION_API_URL);

        const options = {
            hostname: urlObj.hostname,
            port: 443,
            path: `/message/sendText/${EVOLUTION_INSTANCE}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': EVOLUTION_API_KEY,
                'Content-Length': Buffer.byteLength(body)
            },
            timeout: 10000 // 10 segundos
        };

        const req = https.request(options, res => {
            let resData = '';
            res.on('data', d => resData += d);
            res.on('end', () => {
                console.log(`   ✅ RESPUESTA API (${cleanNumber}): ${res.statusCode}`);
                resolve(res.statusCode);
            });
        });

        req.on('error', e => {
            console.error(`   ❌ ERROR RED API (${cleanNumber}): ${e.message}`);
            resolve(500);
        });

        req.on('timeout', () => {
            req.destroy();
            console.error(`   ⏰ TIMEOUT API (${cleanNumber})`);
            resolve(408);
        });

        req.write(body);
        req.end();
    });
}

app.post('/webhook', (req, res) => {
    // 1. RESPUESTA INMEDIATA
    res.status(200).json({ success: true });

    // 2. BACKGROUND WORK
    (async () => {
        try {
            const data = req.body;
            // Si Numero viene como Jesus Ernesto, buscamos el Numero real en otros campos
            let nombre = data.Nombre || "Sin nombre";
            let telefono = data.Numero || "Sin numero";

            // Corrección si vienen corridos
            if (nombre === "Meta" || nombre.includes("Jesus")) {
                // Intentamos deducir por el valor
                if (data.Numero && data.Numero.includes("jesus")) {
                    telefono = data.Nombre; // A veces el numero viene en el campo nombre
                }
            }

            console.log(`🚀 NUEVO LEAD: ${nombre} | Tel: ${telefono}`);

            if (telefono && telefono.length > 5) {

                // Formatear Fecha de México
                let fechaFormateada = data.Fecha || 'Hoy';
                if (data.Fecha) {
                    try {
                        const dateObj = new Date(data.Fecha);
                        if (!isNaN(dateObj.getTime())) {
                            fechaFormateada = dateObj.toLocaleString('es-MX', { timeZone: 'America/Mexico_City', hour12: true });
                        }
                    } catch (e) { }
                }

                // Asegurar las Keys de tu Sheet exactas
                const correo = data.Correo || data['Correo si aplica'] || 'No disponible';
                const idInterno = data.ID_Interno || data['ID Interno'] || 'N/A';
                const linkAnuncio = data.LinkAnuncio || data['Link al anuncio'] || 'No disponible';

                const message = `🏠 *NUEVO LEAD DE EXCEL* 🏠
━━━━━━━━━━━━━━━━━━━━━━━
👤 *Nombre:* ${nombre}
📱 *Teléfono:* ${telefono}
📧 *Email:* ${correo}

🏠 *Propiedad:* ${data.Propiedad || 'No especificada'}
🆔 *ID Interno:* ${idInterno}
🎯 *Campaña:* ${data.Campaña || 'N/A'}
🏗️ *Plataforma:* ${data.Plataforma || 'N/A'}
📩 *Modalidad:* ${data.Modalidad || 'whatsapp'}

🔗 *Link Anuncio:*
${linkAnuncio}

📅 *Fecha:* ${fechaFormateada}
━━━━━━━━━━━━━━━━━━━━━━━`;

                // Ejecutamos en paralelo para no perder tiempo
                await Promise.all(GESTORES.map(num => sendWhatsApp(num, message)));
                console.log(`   🏁 Proceso de envío finalizado.`);
            } else {
                console.log(`   ⚠️ Lead ignorado: El número "${telefono}" no parece válido.`);
            }
        } catch (err) {
            console.error(`   💥 Error crítico:`, err.message);
        }
    })();
});

app.listen(3000, '0.0.0.0', () => console.log('✅ RECEPTOR LUX v3.1 LISTO'));
