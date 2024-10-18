import Server from '../models/server.model';

type CommandLimitTypeParams = {
    server_id: string;
    command_name: string;
    role_ids?: string[];
};

export const getCommandLimit = ({
    server_id,
    command_name,
    role_ids,
}: CommandLimitTypeParams): Promise<number> => {
    return new Promise(async (resolve, reject) => {
        try {
            const server = await Server.findOne({
                discord_server_id: server_id,
            });
            if (!server) {
                reject('GETCOMMANDLIMIT ERROR: SERVER NOT FOUND');
                return;
            }
            if (!server.commands_limit) {
                resolve(-1);
            }
            const command_limit = server.commands_limit.get(command_name);
            if (!command_limit) {
                resolve(-1);
                return;
            }
            if (role_ids) {
                let highest_limit = -1;
                for (const role of role_ids) {
                    const current_limit = command_limit.roles_limit.get(role);
                    if (current_limit && current_limit > highest_limit) {
                        highest_limit = current_limit;
                    }
                }
                if (highest_limit > -1) {
                    resolve(highest_limit);
                    return;
                }
            }
            resolve(command_limit.limit || -1);
        } catch (err) {
            reject(err);
        }
    });
};
