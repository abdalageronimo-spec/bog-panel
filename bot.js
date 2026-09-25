const TelegramBot = require('node-telegram-bot-api');

<<<<<<< HEAD
const token = '8739783518:AAFcTJUeh1CRrBRn8_MJHbhSk6AvCC9pBJk';
=======
const token = '8739783518:AAEaFadl7ti9hmuwzns0zFsVSyM9BsCh-oc';
>>>>>>> 407a49d (Actualizacion del proyecto)

if (!token) {
    console.error('❌ TELEGRAM_TOKEN no está definido');
    process.exit(1);
}

<<<<<<< HEAD
const bot = new TelegramBot('8739783518:AAFcTJUeh1CRrBRn8_MJHbhSk6AvCC9pBJk', {
=======
const bot = new TelegramBot('8739783518:AAEaFadl7ti9hmuwzns0zFsVSyM9BsCh-oc', {
>>>>>>> 407a49d (Actualizacion del proyecto)
    polling: true
});

bot.on('message', (msg) => {
    console.log('📩 Mensaje recibido:', msg.text);
});

bot.on('polling_error', (error) => {
    console.error('❌ Polling error:', error.message);
});

module.exports = bot;
