import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../types';

enum TimeUnit {
    seconds = 'seconds',
    minutes = 'minutes',
    hours = 'hours',
}

const EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

const OPTIONS = Array.from({ length: 10 }, (_, i) => ({
    name: `option${i + 1}`,
    description: `Poll option #${i + 1}`,
    required: i <= 1,
}));

export const PollCommand: SlashCommand = {
    command: (() => {
        const SlashCommand = new SlashCommandBuilder()
            .addIntegerOption((option) =>
                option
                    .setName('time')
                    .setDescription('How much time is the poll going to last')
                    .setRequired(true)
                    .setMinValue(1)
                    .setMaxValue(60)
            )
            .addStringOption((option) =>
                option
                    .setName('time_unit')
                    .setDescription('Time unit')
                    .setRequired(true)
                    .addChoices(
                        { name: TimeUnit.seconds, value: TimeUnit.seconds },
                        { name: TimeUnit.minutes, value: TimeUnit.minutes },
                        { name: TimeUnit.hours, value: TimeUnit.hours }
                    )
            )
            .setName('poll')
            .setDescription('Creates a poll');

        OPTIONS.forEach(({ name, description, required }) => {
            SlashCommand.addStringOption((option) =>
                option
                    .setName(name)
                    .setDescription(description)
                    .setRequired(required)
            );
        });

        SlashCommand.addStringOption((option) =>
            option.setName('title').setDescription('The title of the poll')
        ).addBooleanOption((option) =>
            option
                .setName('dm_notify')
                .setDescription(
                    'Whether the bot should DM you if the poll completed successfully'
                )
        );
        return SlashCommand;
    })(),

    async run(interaction) {
        if (!interaction.inGuild()) {
            await interaction.reply({
                content: 'You can only use this command inside a server',
            });
            return;
        }
        if (!interaction.channel) {
            await interaction.reply({
                content:
                    'You can only use this command inside a chhannel or the client does not have the correct intents.',
            });
            return;
        }

        const buildEmbed = () => {
            let formattedTimeUnit: TimeUnit | string = timeUnit;
            if (time === 1) {
                // 1 hours => 1 hour
                formattedTimeUnit = formattedTimeUnit.slice(0, -1);
            }

            const embed = new EmbedBuilder()
                .setAuthor({
                    name: member.displayName,
                    iconURL: user.displayAvatarURL(),
                })
                .setTitle(title || 'Poll')
                .setDescription(
                    description ||
                        `React to vote. The poll is going to be available for ${time} ${formattedTimeUnit}`
                )
                .setColor('DarkRed')
                .setFooter({
                    text: 'In case of a draw, a random item is selected.',
                });
            shownOptions.forEach(({ label, value, emoji }) => {
                embed.addFields([
                    { name: label, value: `${emoji} - ${value}` },
                ]);
            });
            return embed;
        };

        const buildbuttons = () => {
            return new ActionRowBuilder<ButtonBuilder>().addComponents([
                new ButtonBuilder()
                    .setCustomId('cancel')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('end-poll')
                    .setLabel('End Poll Now')
                    .setStyle(ButtonStyle.Primary),
            ]);
        };

        const { options, user, guildId, client, channel } = interaction;

        const guild = interaction.guild || (await client.guilds.fetch(guildId));
        const member =
            guild.members.cache.get(user.id) ||
            (await guild.members.fetch(user.id));
        const shownOptions = OPTIONS.map(({ name, description }, index) => ({
            emoji: EMOJIS[index],
            label: description,
            value: options.get(name)?.value,
        })).filter(
            (
                shownOption
            ): shownOption is { emoji: string; label: string; value: string } =>
                !!shownOption.value
        );
        const time = options.get('time')?.value;
        const timeUnit = ('' + options.get('time_unit')?.value) as TimeUnit;
        const title = '' + options.get('title')?.value;
        const description = '' + options.get('description')?.value;
        const dmNotify = options.get('dm_notify')?.value ?? true;

        const embed = buildEmbed();
        const buttons = buildbuttons();

        await interaction.reply({
            content: 'Poll successfully created',
        });

        const mesage = await channel.send({
            embeds: [embed],
            components: [buttons],
        });
    },
};
