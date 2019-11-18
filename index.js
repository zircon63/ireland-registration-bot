const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const bot = new TelegramBot(process.env.TOKEN_BOT, {polling: true});
const request = require('request');
const cron = require('node-cron');

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
const URL = 'https://burghquayregistrationoffice.inis.gov.ie/Website/AMSREG/AMSRegWeb.nsf/(getAppsNear)?readform&cat=All&sbcat=All&typ=New';

let users = [];
bot.onText(/\/show/, (msg) => {
    const chatId = msg.chat.id;
    users.push(chatId);
    bot.sendMessage(chatId, `Я сообщу о свободном месте, ${msg.from.first_name} ${msg.from.last_name}!`)
});

cron.schedule('* * * * *', () => {
    request(URL, {json: true}, (err, res, body) => {
        if (err) {
            return console.log(err);
        }
        const hasPlace = !(body['empty'] && body['empty'] === 'TRUE');
        if (hasPlace) {
            users.forEach(user => {
                bot.sendMessage(user, `ЕСТЬ МЕСТО!\n ${JSON.stringify(body)}`);
            });
        }
    });
});
