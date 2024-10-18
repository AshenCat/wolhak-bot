import Hug from '../models/hug.model';

type GetHugCountParams = {
    from_discord_id: string;
    to_discord_id: string;
    discord_server_id: string;
};

export const GetHugCount = ({
    from_discord_id,
    to_discord_id,
    discord_server_id,
}: GetHugCountParams): Promise<number> => {
    return new Promise(async (resolve, reject) => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const commandCalls = await Hug.find({
                from_discord_id: from_discord_id,
                to_discord_id: to_discord_id,
                discord_server_id: discord_server_id,
            }).count();
            resolve(commandCalls);
        } catch (err) {
            reject(err);
        }
    });
};
