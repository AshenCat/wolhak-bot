import { ActivityType, Client } from 'discord.js';
import mongoose from 'mongoose';
import { GUILD_ID } from '../config';
import { DB_CONFIG_STRING } from '../db/config';
import User from '../db/models/user.model';
import { SlashCommands } from '../slash-commands';

export const onReady = (client: Client) => {
    client.on('ready', () => {
        console.log(`${client.user?.username} is online`);
        const commands = SlashCommands.map((slashCommand) =>
            slashCommand.command.toJSON()
        );
        client.application?.commands.set(commands);

        const MONGO_URI = DB_CONFIG_STRING();

        mongoose.connect(MONGO_URI, async () => {
            console.log('Connected to DB');

            const guild = client.guilds.cache;
            const GUILD_MEMBERS = await guild.get(GUILD_ID)?.members.fetch();

            // loop through the members and save to db if not on db
            GUILD_MEMBERS?.map(async (value, key) => {
                const exists = await User.findOne({ discord_user_id: key });
                if (exists) {
                    console.log(`${key}: ${value.displayName} found`);
                    return;
                }
                await User.create({ discord_user_id: key });
                console.log(`${key}: ${value.displayName} added`);
            });

            const count = await User.countDocuments();
            client.user?.setActivity({
                name: `Rankers: ${count}`,
                type: ActivityType.Streaming,
            });
        });
    });
};
