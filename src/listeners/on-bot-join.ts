import { Client, PermissionsBitField } from 'discord.js';
import Server from '../db/models/server.model';

export const onBotJoin = (client: Client) => {
    client.on('guildCreate', async (guild) => {
        const guildId = guild.id;
        const me = guild.members.me;
        try {
            const newServer: { [key: string]: string } = {
                discord_server_id: guildId,
                owner_discord_id: guild.ownerId,
            };
            if (me) {
                const channel = guild.channels.cache.find(
                    (channel) =>
                        channel.type === 4 &&
                        channel
                            .permissionsFor(me)
                            .has(PermissionsBitField.Flags.SendMessages)
                );
                if (channel && channel.isTextBased()) {
                    newServer.general_channel_id = channel.id;
                    channel.send('Thank you for inviting me!');
                }
            }

            await Server.create(newServer);
            console.log(`Wolhak joined ${guild.name} (${guildId})`);
        } catch (err) {
            console.error('On Wolhak Join Error:');
            console.error(err);
        }
    });
};
