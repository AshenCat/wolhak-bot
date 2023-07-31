import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { DATETIME_FORMAT, TIMEZONE, TOKEN } from './config';
import { onInteractionCreate, onMessageCreate, onReady } from './listeners';
import { onUserJoin } from './listeners/on-user-join';
import cron from 'node-cron';
import moment from 'moment-timezone';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.Channel, Partials.Message],
});

onReady(client);
onMessageCreate(client);
onInteractionCreate(client);
onUserJoin(client);

client.login(TOKEN);

cron.schedule('*/5 * * * *', () => {
    const date = new Date(Date.now());
    const date_moment = moment(date);
    const datetimeString = date_moment.tz(TIMEZONE).format(DATETIME_FORMAT);
    console.log(`${datetimeString}: Health check success!`);
});
