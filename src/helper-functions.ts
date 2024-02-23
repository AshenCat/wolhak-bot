import axios from 'axios';
import Jimp from 'jimp';
import OpenAI from 'openai';

const INSPIRE_URL = 'https://inspirobot.me/api?generate=true';

type InspireResponse = {
    data: string;
};

export const getChatGPTResponse = (
    choices: OpenAI.Chat.Completions.ChatCompletion.Choice[]
): string => {
    let finalMsg = 'Chat GPT Responded: \n';
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
