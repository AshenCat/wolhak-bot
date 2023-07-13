import { ActivityType, Client, EmbedBuilder, TextChannel } from 'discord.js';
import { WELCOME_CHANNEL_ID } from '../config';
import User from '../db/models/user.model';

export const onUserJoin = (client: Client) => {
    client.on('guildMemberAdd', async (member) => {
        console.log('member joined: ', member.id);
        await User.create({ discord_user_id: member.id });
        const count = await User.countDocuments();
        console.log(`${member.id}: ${member.displayName} added`);
        client.user?.setActivity({
            name: `Rankers: ${count}`,
            type: ActivityType.Streaming,
        });
        if (!WELCOME_CHANNEL_ID) return;
        const welcomeChannel =
            member.guild.channels.cache.get(WELCOME_CHANNEL_ID) ||
            (await member.guild.channels.fetch(WELCOME_CHANNEL_ID));
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
    });
};
