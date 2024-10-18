import CommandUsage from '../models/command-usage.model';

type CommandCallsParams = {
    discord_user_id: string;
    command_name: string;
    server_id: string;
};

export const getTotalUserCommandCallsToday = ({
    discord_user_id,
    command_name,
    server_id,
}: CommandCallsParams): Promise<number> => {
    return new Promise(async (resolve, reject) => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const commandCalls = await CommandUsage.find({
                discord_user_id: discord_user_id,
                command_name: command_name,
                discord_server_id: server_id,
                createdAt: { $gte: today },
            }).count();
            resolve(commandCalls);
        } catch (err) {
            reject(err);
        }
    });
};

type hasUsedCommandLastGivenTimeParams = {
    command_name: string;
    discord_user_id: string;
    time_in_seconds: number;
};

export const hasUsedCommandLastGivenTime = ({
    command_name,
    discord_user_id,
    time_in_seconds,
}: hasUsedCommandLastGivenTimeParams): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
        try {
            const nextValidCommandUsage = new Date();
            nextValidCommandUsage.setTime(
                nextValidCommandUsage.getTime() - time_in_seconds * 1000
            );
            const lastcommand = await CommandUsage.findOne({
                command_name: command_name,
                discord_user_id: discord_user_id,
                createdAt: { $gte: nextValidCommandUsage },
            });
            resolve(!!lastcommand);
        } catch (err) {
            reject(err);
        }
    });
};
