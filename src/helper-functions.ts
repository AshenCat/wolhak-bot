import { CreateChatCompletionResponseChoicesInner } from 'openai';

export const getChatGPTResponse = (
    choices: CreateChatCompletionResponseChoicesInner[]
): string => {
    let finalMsg = 'Chat GPT Responded: \n';
    choices.forEach((msg) => (finalMsg += msg.message?.content));
    return finalMsg;
};
