import axios from 'axios';
import OpenAI from 'openai';
import sharp from 'sharp';
import crypto from 'crypto';
import {
    AWS_ACCESS_KEY,
    AWS_REGION,
    AWS_SECRET_ACCESS_KEY,
    DEV,
    S3_BUCKET_NAME,
    ZODIAC_SIGNS,
} from './config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

if (
    S3_BUCKET_NAME === '' ||
    AWS_REGION === '' ||
    AWS_ACCESS_KEY === '' ||
    AWS_SECRET_ACCESS_KEY === ''
)
    throw new Error('AWS CREDENTIALS MISSING, PLEASE CONTACT ADMINISTRATOR');

const client = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
});

const INSPIRE_URL = 'https://inspirobot.me/api?generate=true';

type InspireResponse = {
    data: string;
};

type AddTextToImageType = {
    zodiac: keyof typeof ZODIAC_SIGNS;
    bgImageURL: string;
    description: string;
    key: string;
};

export const getChatGPTResponse = (
    choices: OpenAI.Chat.Completions.ChatCompletion.Choice[],
    noString?: false
): string => {
    let finalMsg = noString ? 'Chat GPT Responded: \n' : '';
    choices.forEach((msg) => (finalMsg += msg.message?.content));
    return finalMsg;
};

export function getInspirationImageURL(): Promise<string> {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await axios.get<InspireResponse['data']>(
                INSPIRE_URL
            );

            const inspirationImageURL = response.data;

            resolve(inspirationImageURL);
        } catch (err) {
            reject(err);
        }
    });
}

// const getRandomColor = () => {
//     const colors = ['#000', '#fff', '#F00', '#0F0', '#00F'];
//     const randomInt = Math.floor(Math.random() * colors.length);
//     return colors[randomInt];
// };

export const randomToken = (): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            const token = crypto.randomBytes(16).toString('base64url');
            resolve(token);
        } catch (err) {
            reject(err);
        }
    });
};

export function addTextToImage({
    zodiac,
    bgImageURL,
    description,
    key,
}: AddTextToImageType): Promise<{ filename: string; fileBuffer: Buffer }> {
    return new Promise(async (resolve, reject) => {
        try {
            const token = await randomToken();
            const filename = `${
                DEV ? 'dev-' : ''
            }${key}-${zodiac}-${token}.jpg`;
            const width = 512;
            const height = 512;
            const title = `${ZODIAC_SIGNS[zodiac].zodiac} ${ZODIAC_SIGNS[zodiac].sign}`;
            const subtitle = `${ZODIAC_SIGNS[zodiac].range}`;

            const svgImage = `
        <svg width="${width}" height="${height}">
          <style>
            .text-color {  
                fill: white;
                stroke: black;
                stroke-width: 12px;
                stroke-linejoin: round;
                paint-order: stroke;
            }
            .title { font-size: 64px; font-weight: bold }
            .subtitle { font-size: 32px; }
            .horoscope { 
                font-size: 28px;
                stroke-width: 6px;
                stroke-linejoin: round;
                paint-order: stroke;
             }
          </style>
            <text x="50%" y="30%" text-anchor="middle" class="text-color">
            <tspan x="50%" class="title">${title}</tspan>
            <tspan x="50%" dy="1em" class="subtitle">${subtitle}</tspan>
            ${newLineBuilder(description)
                .map(
                    (segment, index) =>
                        `<tspan x="50%" dy="${
                            index === 0 ? '2' : '1'
                        }em" class="horoscope">${segment}</tspan>`
                )
                .join('\n')}
            </text>
        </svg>
        `;
            const svgBuffer = Buffer.from(svgImage);

            let imageFromURL: Buffer | string;
            if (bgImageURL.startsWith('http')) {
                imageFromURL = (
                    await axios({
                        url: bgImageURL,
                        responseType: 'arraybuffer',
                    })
                ).data as Buffer;
            } else {
                imageFromURL = bgImageURL;
            }
            const editedImageBuffer = await sharp(imageFromURL)
                .composite([
                    {
                        input: svgBuffer,
                        top: 0,
                        left: 0,
                    },
                ])

                .toBuffer();
            resolve({ filename, fileBuffer: editedImageBuffer });
        } catch (err) {
            console.error(err);
            reject(err);
        }
    });
}

export const getDateDashSeperated = () => {
    // 2016-03-08T13:51:13.382Z => "08-03-2016"
    return new Date()
        .toISOString()
        .replace(/T.*/, '')
        .split('-')
        .reverse()
        .join('-');
};

// export const getHoroscopeFilename = ({
//     zodiac,
//     key,
// }: {
//     zodiac: keyof typeof ZODIAC_SIGNS;
//     key: string;
// }) => {
//     return `${DEV ? 'dev-' : ''}${key}-${zodiac}-${getDateDashSeperated()}.jpg`;
// };

export const uploadToS3 = (
    filename: string | Buffer,
    fileBuffer: Buffer
): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        const command = new PutObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: `${DEV ? 'dev' : 'prod'}/${filename}`,
            ContentType: 'image/jpg',
            Body: fileBuffer,
        });

        try {
            await client.send(command);
            resolve(`${filename}`);
        } catch (err) {
            console.error(err);
            reject(err);
        }
    });
};

// export const checkIfFileExistsOnS3 = async (filename: string) => {
//     try {
//         const data: HeadObjectCommandOutput = await client.send(
//             new HeadObjectCommand({
//                 Bucket: S3_BUCKET_NAME,
//                 Key: `${DEV ? 'dev' : 'prod'}/${filename}`,
//             })
//         );
//         // return true;
//         const exists = data.$metadata.httpStatusCode === 200;
//         console.log('found');
//         return exists;
//     } catch (error: any) {
//         // return false;
//         if (error.$metadata?.httpStatusCode === 404) {
//             // doesn't exist and permission policy includes s3:ListBucket
//             console.log('not found 404');
//             return false;
//         } else if (error.$metadata?.httpStatusCode === 403) {
//             // doesn't exist, permission policy WITHOUT s3:ListBucket
//             console.log('not found 403');
//             return false;
//         } else {
//             // some other error
//             //...log and rethrow if you like per your requirements
//             console.log('not found OTHER ERROR');
//             console.error(error);
//         }
//     }
// };

const newLineBuilder = (longstring: string) => {
    const splittedString = longstring.match(/.{1,36}/g);
    if (splittedString === null)
        throw new Error('NEW LINE BUILDER RECIEVED EMPTY STRING');
    const newStringArr = [];
    for (let ctr0 = 0; ctr0 < splittedString.length; ctr0++) {
        const currString = splittedString[ctr0];
        if (
            currString.at(-1)!.toUpperCase() ===
            currString.at(-1)!.toLowerCase()
        ) {
            newStringArr.push(currString);
            continue;
        }
        const temp = currString.split(' ');
        const lastItem = temp.pop();
        splittedString[ctr0 + 1] = lastItem + splittedString[ctr0 + 1];
        newStringArr.push(temp.join(' '));
    }
    // console.log(newStringArr);
    return newStringArr;
};

export const getS3FileURL = (filename: string) => {
    // https://wolhak.s3.us-east-1.amazonaws.com/dev/dev-283092691946831885-Taurus-26-02-2024.jpg
    return 'https://' +
        S3_BUCKET_NAME +
        '.s3.' +
        AWS_REGION +
        '.amazonaws.com/' +
        DEV
        ? 'dev/'
        : 'prod/' + filename;
};
