import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { TOKEN } from './config';
import { onInteractionCreate, onMessageCreate, onReady } from './listeners';
import { onUserJoin } from './listeners/on-user-join';
import cron from 'node-cron';

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

cron.schedule('0 * * * *', () => {
    console.log(`${new Date(Date.now())}: Health check success!`);
});
