import { GuildMemberRoleManager, SlashCommandBuilder } from 'discord.js';
import { COMMAND_NAMES } from '../config';
import { SlashCommand } from '../types';
import Server, { IServerDoc } from '../db/models/server.model';

export const ManageCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .addStringOption((option) =>
            option
                .setName('command')
                .setRequired(true)
                .setDescription('Sets the action of the command to manage')
                .addChoices(
                    ...[
                        ...Object.values(COMMAND_NAMES).filter(command => command.limitable).map((command) => ({
                            name: command.command_name,
                            value: command.command_name,
                        })),
                    ]
                )
        )
        .addStringOption((option) =>
            option
                .setName('type')
                .setRequired(true)
                .setDescription('Sets the action of the command to manage')
                .addChoices({ name: 'usage-limit', value: 'usage-limit' })
        )
        .addNumberOption((option) =>
            option
                .setName('value')
                .setRequired(true)
                .setDescription(
                    'Sets the value of the action. Set to any negative number to delete limit.'
                )
        )
        .addRoleOption((option) =>
            option
                .setName('role')
                .setRequired(false)
                .setDescription('Optional role to be limited')
        )
        .setName(COMMAND_NAMES.manage.command_name)
        .setDescription('manages wolhak`s commands'),

    async run(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            if (!interaction.inCachedGuild()) {
                await interaction.editReply({
                    content: 'You can not use /manage command',
                });
                return;
            }

            const guildId = interaction.guildId;

            const userId = interaction.user.id;

            const userRoles = (
                interaction.member.roles as GuildMemberRoleManager
            ).cache;

            const serverDBSettings = await Server.findOne({
                discord_server_id: guildId,
            });

            if (!serverDBSettings) {
                await interaction.editReply({
                    content: 'Server does not have registered settings',
                });
                return;
            }

            const serverAdminIds = serverDBSettings.admin_ids;
            const serverAdminRoleIds = serverDBSettings.admin_role_ids;

            // console.log('userRoles');
            // console.log([...userRoles.keys()]);
            // console.log(
            //     !userRoles.some((role) =>
            //         serverAdminRoleIds.some((admin_role) => {
            //             console.log('role: ' + role);
            //             console.log('admin_role: ' + admin_role);
            //             return admin_role === role.id;
            //         })
            //     )
            // );

            const userRolesHaveAdminRoles = userRoles.some((role) =>
                serverAdminRoleIds.some((admin_role) => admin_role === role.id)
            );

            if (!(serverAdminIds.includes(userId) || userRolesHaveAdminRoles)) {
                await interaction.editReply({
                    content: 'You can not use /manage command',
                });
                return;
            }

            const type = '' + interaction.options.get('type')?.value;
            const command = '' + interaction.options.get('command')?.value;
            const value = parseInt(
                '' + interaction.options.get('value')?.value
            );
            const targetRole = interaction.options.get('role')?.value as
                | string
                | undefined;

            switch (type) {
                case 'usage-limit':
                    await usageLimitFunction({
                        command,
                        value,
                        targetRole,
                        guildId,
                    });
                    break;
                default:
                    await interaction.editReply({
                        content: 'Unknown type provided. Please try again.',
                    });
                    return;
            }

            await interaction.editReply({
                content: `Command /${command} updated successfully. The new limit ${
                    targetRole ? `for <@&${targetRole}>` : ''
                } is ${value}.`,
            });
        } catch (err) {
            console.log(err);
            await interaction.editReply({
                content: `Error: ${String(
                    err
                )}.\n Please contact administrator`,
            });
        }
    },
};

type UsageLimitFunctionType = {
    command: string;
    value: number;
    targetRole: string | undefined;
    guildId: string;
};

const usageLimitFunction = ({
    command,
    value,
    targetRole,
    guildId,
}: UsageLimitFunctionType): Promise<IServerDoc> => {
    return new Promise(async (resolve, reject) => {
        try {
            const server = await Server.findOne({
                discord_server_id: guildId,
            });
            if (!server) {
                reject(
                    `Server ID ${guildId} is not registered at the database.`
                );
                return;
            }

            const command_limit = server.commands_limit;
            if (!command_limit) {
                server.commands_limit = new Map<
                    string,
                    {
                        limit?: number | undefined;
                        roles_limit: Map<string, number>;
                    }
                >();
            }

            if (value < 0) {
                const prev = server.commands_limit.get(command);
                if (targetRole && prev) {
                    prev.roles_limit.delete(targetRole);
                    // if prev doesn't exist, there's nothing to delete
                } else {
                    server.commands_limit.delete(command);
                }
            } else {
                const prev = server.commands_limit.get(command);

                let new_roles_limit = prev?.roles_limit;
                if (!new_roles_limit) {
                    new_roles_limit = new Map<string, number>();
                }

                if (targetRole) {
                    new_roles_limit.set(targetRole, value);
                }

                server.commands_limit.set(command, {
                    limit: targetRole ? prev?.limit : value,
                    roles_limit: new_roles_limit,
                });
            }

            await server.save();
            resolve(server);
        } catch (err) {
            reject(err);
        }
    });
};
