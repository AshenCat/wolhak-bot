import {
    Client,
    EmbedBuilder,
    GatewayIntentBits,
    Partials,
    TextChannel,
} from 'discord.js';
import { DATETIME_FORMAT, DEV, TIMEZONE, TOKEN } from './config';
import { onInteractionCreate, onMessageCreate, onReady } from './listeners';
import { onUserJoin } from './listeners/on-user-join';
import cron from 'node-cron';
import moment from 'moment-timezone';
import { getInspirationImageURL } from './helper-functions';
import Server from './db/models/server.model';
import { onBotJoin } from './listeners/on-bot-join';

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
onBotJoin(client);

client.login(TOKEN);

// HEALTH CHECK
cron.schedule('*/30 * * * *', () => {
    const date = new Date(Date.now());
    const date_moment = moment(date);
    const datetimeString = date_moment.tz(TIMEZONE).format(DATETIME_FORMAT);
    console.log(`${datetimeString}: Health check success!`);
});

// DAILY INSPIRATION
cron.schedule('0 0 * * *', async () => {
    try {
        if (DEV) return;
        const servers = await Server.find({});
        for (const server of servers) {
            if (
                !server.general_channel_id ||
                typeof server.general_channel_id !== 'string'
            ) {
                console.log(
                    `DAILY INSPIRATION: server general chat (${server.general_channel_id}) not found`
                );
                return;
            }
            const welcomeChannel =
                client.channels.cache.get(server.general_channel_id) ||
                (await client.channels.fetch(server.general_channel_id));

            const url = await getInspirationImageURL();
            const embed = new EmbedBuilder()
                .setDescription(`*Here's a random inspiration for today!*`)
                .setImage(url)
                .setColor('Blurple');

            if (welcomeChannel?.isTextBased()) {
                (<TextChannel>welcomeChannel).send({ embeds: [embed] });
            }
        }
    } catch (err) {
        console.log(err);
    }
});
