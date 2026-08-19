const TelegramBot = require('node-telegram-bot-api');

const token = '8739783518:AAFrbcvTXCm6zRUAmYSpiQIKgqyNjTQS79w';

if (!token) {
    console.error('❌ TELEGRAM_TOKEN no está definido');
    process.exit(1);
}

const bot = new TelegramBot('8739783518:AAFrbcvTXCm6zRUAmYSpiQIKgqyNjTQS79w', {
    polling: true
});

bot.on('message', (msg) => {
    console.log('📩 Mensaje recibido:', msg.text);
});

bot.on('polling_error', (error) => {
    console.error('❌ Polling error:', error.message);
});

module.exports = bot;