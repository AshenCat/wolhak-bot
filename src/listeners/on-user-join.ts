import { ActivityType, Client, EmbedBuilder, TextChannel } from 'discord.js';
// import { WELCOME_CHANNEL_ID } from '../config';
import User from '../db/models/user.model';
import Server from '../db/models/server.model';

export const onUserJoin = (client: Client) => {
    client.on('guildMemberAdd', async (member) => {
        console.log('member joined: ', member.id);
        try {
            await User.create({
                discord_user_id: member.id,
                server_id: member.guild.id,
            });
            const count = await User.countDocuments();
            console.log(`${member.id}: ${member.displayName} added`);
            client.user?.setActivity({
                name: `Rankers: ${count}`,
                type: ActivityType.Streaming,
            });
            const serverGuild = await Server.findOne({
                discord_server_id: member.guild.id,
            });
            if (!serverGuild) {
                console.log('SERVER GUILD NOT FOUND: ' + member.guild.id);
                return;
            }
            const welcomeChannel =
                member.guild.channels.cache.get(
                    serverGuild.general_channel_id
                ) ||
                (await member.guild.channels.fetch(
                    serverGuild.general_channel_id
                ));
            const embed = new EmbedBuilder()
                .setTitle(`A new challenger arrived!`)
                .setDescription(
                    `Will <@${member.id}> be able to conquer the tower?`
                )
                .setColor('Blurple');
            if (member.avatarURL()) embed.setThumbnail('' + member.avatarURL());

            if (welcomeChannel?.isTextBased()) {
                (<TextChannel>welcomeChannel).send({ embeds: [embed] });
            }
            console.log(
                `${new Date(Date.now())}: ${member.displayName} has joined!`
            );
        } catch (err) {
            console.error('========================= Guild Member Add Error');
            console.error(err);
        }
    });
};
