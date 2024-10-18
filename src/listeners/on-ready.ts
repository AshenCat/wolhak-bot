import { ActivityType, Client } from 'discord.js';
import mongoose from 'mongoose';
import { DB_CONFIG_STRING } from '../db/config';
import User from '../db/models/user.model';
import { SlashCommands } from '../slash-commands';
import Server from '../db/models/server.model';
import {
    DEV,
    WHS_ADMIN_ROLE,
    WHS_GUILD_ID,
    WHS_OWNER_ID,
    WHS_WELCOME_CHANNEL_ID,
} from '../config';

export const onReady = (client: Client) => {
    client.on('ready', () => {
        console.log(`${client.user?.username} is online`);
        const commands = SlashCommands.map((slashCommand) =>
            slashCommand.command.toJSON()
        );
        client.application?.commands.set(commands);

        const MONGO_URI = DB_CONFIG_STRING();

        console.log(MONGO_URI);

        mongoose.set('strictQuery', false);
        mongoose.connect(MONGO_URI, async (err) => {
            if (err) {
                console.error('Error: ', err);
                process.exit(1);
            }
            console.log('Connected to DB');

            const servers = await Server.find({});

            if (!servers || servers.length === 0) {
                console.log('NO SERVERS FOUND');
                if (!DEV) {
                    console.log('PROD: ADDING WOLHAKSONG GUILD TO THE DB');

                    if (!WHS_GUILD_ID || WHS_GUILD_ID === '') {
                        console.log("WHS_GUILD_ID is missing. SHUTTING DOWN")
                        return;
                    };
                    if (!WHS_OWNER_ID || WHS_OWNER_ID === '') {
                        console.log("WHS_OWNER_ID is missing. SHUTTING DOWN")
                        return;
                    };
                    if (
                        !WHS_WELCOME_CHANNEL_ID ||
                        WHS_WELCOME_CHANNEL_ID === ''
                    )
                        {
                            console.log("WHS_WELCOME_CHANNEL_ID is missing. SHUTTING DOWN")
                            return;
                        };
                    if (!WHS_ADMIN_ROLE || WHS_OWNER_ID === '') {
                        console.log("WHS_ADMIN_ROLE is missing. SHUTTING DOWN")
                        return;
                    };

                    const newServer = {
                        discord_server_id: WHS_GUILD_ID,
                        owner_discord_id: WHS_OWNER_ID,
                        general_channel_id: WHS_WELCOME_CHANNEL_ID,
                        admin_role_ids: WHS_ADMIN_ROLE,
                    };

                    await Server.create(newServer);

                    console.log('WHS ADDED TO DB');
                }

                return;
            }

            for (const server of servers) {
                if (typeof server.discord_server_id !== 'string') {
                    throw new Error(`ERROR: SERVER _id ${server.id}`);
                }

                const guild = client.guilds.cache;
                try {
                    const GUILD_MEMBERS = await guild
                        .get(server.discord_server_id)
                        ?.members.fetch();

                    // loop through the members and save to db if not on db
                    GUILD_MEMBERS?.forEach(async (value, key) => {
                        const exists = await User.findOne({
                            discord_user_id: key,
                            server_id: server.discord_server_id,
                        });
                        if (exists) {
                            console.log(
                                `${key}: ${value.displayName} found at ${server.discord_server_id}`
                            );
                            if (!exists.server_id) {
                                exists.server_id = server.discord_server_id;
                                console.log(
                                    `${key}: Adding server id ${server.discord_server_id} to user.`
                                );
                                await exists.save();
                            }
                            return;
                        }
                        await User.create({
                            discord_user_id: key,
                            server_id: server.discord_server_id,
                        });
                        console.log(
                            `${key}: ${value.displayName} added with server ${server.discord_server_id}`
                        );
                    });

                    const count = await User.countDocuments();
                    client.user?.setActivity({
                        name: `Rankers: ${count}`,
                        type: ActivityType.Streaming,
                    });
                } catch (err) {
                    console.error('======================= On Ready Error');
                    console.error(err);
                }
            }
        });
    });
};
