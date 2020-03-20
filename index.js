const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const bot = new TelegramBot(process.env.TOKEN_BOT, {polling: true});
const request = require('request');
const cron = require('node-cron');
const URL = 'https://www.vtb.ru/api/currency-exchange/table-info?contextItemId=%7BC5471052-2291-4AFD-9C2D-1DBC40A4769D%7D&conversionPlace=1&conversionType=1&renderingId=ede2e4d0-eb6b-4730-857b-06fd4975c06b&renderingParams=LegalStatus__%7BF2A32685-E909-44E8-A954-1E206D92FFF8%7D;IsFromRuble__1;CardMaxPeriodDays__1;CardRecordsOnPage__1;ConditionsUrl__%2Fpersonal%2Fplatezhi-i-perevody%2Fobmen-valjuty%2Fspezkassy%2F;Multiply100JPYand10SEK__1';

let users = [];
let tasks = {};
bot.onText(/\/show (\d)/, (msg, match) => {
    const chatId = msg.chat.id;
    users.push(chatId);
    const minutes = match[1];
    bot.sendMessage(chatId, `Уведомления о курсе каждые ${minutes} минут`);
    if (tasks[chatId]) {
        tasks[chatId].destroy();
    }
    const task = createTask(chatId, minutes);
    tasks[chatId] = task;
    task.start();
});
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const task = tasks[chatId];
    if (!task) {
        bot.sendMessage(chatId, `В системе не зарегистрировано задание для вас!`);
    } else {
        task.start();
        bot.sendMessage(chatId, `Уведомления запущены`);
    }
});
bot.onText(/\/stop/, (msg) => {
    const chatId = msg.chat.id;
    const task = tasks[chatId];
    if (!task) {
        bot.sendMessage(chatId, `В системе не зарегистрировано задание для вас!`);
    } else {
        task.stop();
        bot.sendMessage(chatId, `Уведомления остановлены`);
    }
});
bot.onText(/\/destroy/, (msg) => {
    const chatId = msg.chat.id;
    const task = tasks[chatId];
    if (!task) {
        bot.sendMessage(chatId, `В системе не зарегистрировано задание для вас!`);
    } else {
        task.destroy();
        bot.sendMessage(chatId, `Уведомления прекращены`);
    }
});

const createTask = (chatId, minutes) =>
    cron.schedule(`*/${minutes} * * * *`, () => {
        request(URL, {json: true}, (err, res, body) => {
            if (err) {
                return console.log(err);
            }
            const group = body.GroupedRates.find(group => {
                return group.MoneyRates.find(rates => {
                    return rates.FromCurrency.Code === 'EUR' && rates.ToCurrency.Code === 'RUR'
                })
            });
            const rates = group.MoneyRates[0];
            bot.sendMessage(chatId, `Покупка: ${rates.BankBuyAt} RUR \nПродажа: ${rates.BankSellAt}\n RUR`);
        });
    });
