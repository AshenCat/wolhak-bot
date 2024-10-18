import dotenv from 'dotenv';

dotenv.config();

export const TOKEN = process.env.TOKEN || '';
export const APPLICATION_ID = process.env.APPLICATION_ID || '';
// export const GUILD_ID = process.env.GUILD_ID || '';
export const WHS_GUILD_ID = process.env.WHS_GUILD_ID || '';
export const WHS_OWNER_ID = process.env.WHS_OWNER_ID || '';
export const WHS_WELCOME_CHANNEL_ID = process.env.WHS_WELCOME_CHANNEL_ID || '';
export const WHS_ADMIN_ROLE = process.env.WHS_ADMIN_ROLE || '';
export const TENOR_API_KEY = process.env.TENOR_API_KEY || '';
export const DB_USER = process.env.DB_USER || false;
export const DB_PASS = process.env.DB_PASS || false;
export const DEV = process.env.DEV || false;
export const DB_LOCAL_URI = process.env.DB_LOCAL_URI || false;
export const DB_REMOTE_URI = process.env.DB_REMOTE_URI || false;
// export const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID || false;
export const OPEN_API_KEY = process.env.OPEN_API_KEY || '';
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || '';
export const AWS_REGION = process.env.AWS_REGION || '';
export const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY || '';
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
export const GPT_INTERVAL = (() => {
    const GPT_INT = Number(process.env.GPT_INTERVAL);
    if (!isNaN(GPT_INT)) return GPT_INT;
    return 15;
})();
export const TIMEZONE = 'America/Toronto';
export const DATETIME_FORMAT = 'YYYY-MM-DD hh:mm:ss a z';

export const ZODIAC_SIGNS = {
    Aries: {
        range: 'March 21 – April 19',
        zodiac: 'Aries',
        sign: '♈',
    },
    Taurus: {
        range: 'April 20 – May 20',
        zodiac: 'Taurus',
        sign: '♉',
    },
    Gemini: {
        range: 'May 21 – June 20',
        zodiac: 'Gemini',
        sign: '♊',
    },
    Cancer: {
        range: 'June 21 – July 22',
        zodiac: 'Cancer',
        sign: '♋',
    },
    Leo: {
        range: 'July 23 – August 22',
        zodiac: 'Leo',
        sign: '♌',
    },
    Virgo: {
        range: 'August 23 – September 22',
        zodiac: 'Virgo',
        sign: '♍',
    },
    Libra: {
        range: 'September 23 – October 22',
        zodiac: 'Libra',
        sign: '♎',
    },
    Scorpio: {
        range: 'October 23 – November 21',
        zodiac: 'Scorpio',
        sign: '♏',
    },
    Sagittarius: {
        range: 'November 22 – December 21',
        zodiac: 'Sagittarius',
        sign: '♐',
    },
    Capricorn: {
        range: 'December 22 – January 19',
        zodiac: 'Capricorn',
        sign: '♑',
    },
    Aquarius: {
        range: 'January 20 – February 18',
        zodiac: 'Aquarius',
        sign: '♒',
    },
    Pisces: {
        range: 'February 19 – March 20',
        zodiac: 'Pisces',
        sign: '♓',
    },
};

export const COMMAND_NAMES = {
    add_roles: {
        command_name: (DEV ? 'dev_' : '') + 'add_roles',
        limitable: false,
    },
    add: {
        command_name: (DEV ? 'dev_' : '') + 'add',
        limitable: true,
    },
    get_random_anime: {
        command_name: (DEV ? 'dev_' : '') + 'get_random_anime',
        limitable: false,
    },
    google: {
        command_name: (DEV ? 'dev_' : '') + 'google',
        limitable: false,
    },
    horoscope: {
        command_name: (DEV ? 'dev_' : '') + 'horoscope',
        limitable: true,
    },
    hug: {
        command_name: (DEV ? 'dev_' : '') + 'hug',
        limitable: false,
    },
    inspire: {
        command_name: (DEV ? 'dev_' : '') + 'inspire',
        limitable: true,
    },
    poll: {
        command_name: (DEV ? 'dev_' : '') + 'poll',
        limitable: false,
    },
    user_info: {
        command_name: (DEV ? 'dev_' : '') + 'user_info',
        limitable: false,
    },
    wolhak_gpt: {
        command_name: (DEV ? 'dev_' : '') + 'wolhak_gpt',
        limitable: true,
    },
    wolhak_image_gpt: {
        command_name: (DEV ? 'dev_' : '') + 'wolhak_image_gpt',
        limitable: true,
    },
    manage: {
        command_name: (DEV ? 'dev_' : '') + 'manage',
        limitable: false,
    },
    register_server: {
        command_name: (DEV ? 'dev_' : '') + 'register_server',
        limitable: false,
    },
};
