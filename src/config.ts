import dotenv from 'dotenv';

dotenv.config();

export const TOKEN = process.env.TOKEN || '';
export const APPLICATION_ID = process.env.APPLICATION_ID || '';
export const GUILD_ID = process.env.GUILD_ID || '';
export const TENOR_API_KEY = process.env.TENOR_API_KEY || '';
export const DB_USER = process.env.DB_USER || false;
export const DB_PASS = process.env.DB_PASS || false;
export const DEV = process.env.DEV || false;
export const DB_LOCAL_URI = process.env.DB_LOCAL_URI || false;
export const DB_REMOTE_URI = process.env.DB_REMOTE_URI || false;
export const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID || false;
export const OPEN_API_KEY = process.env.OPEN_API_KEY || '';
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || '';
export const AWS_REGION = process.env.AWS_REGION || '';
export const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY || '';
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
export const GPT_INTERVAL = (() => {
    const GPT_INT = Number(process.env.GPT_INTERVAL);
    if (typeof GPT_INT === 'number') return GPT_INT;
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
