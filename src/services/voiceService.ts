import { sample } from "lodash";
import config from "../config";

async function loadVoices(): Promise<SpeechSynthesisVoice[]> {
    const predicate = (x: SpeechSynthesisVoice) => x.lang === config.lang && x.voiceURI !== 'Google US English';

    return new Promise((resolve) => {
        let voices = speechSynthesis.getVoices();
        if (voices.length) {
            resolve(voices.filter(predicate));
            return;
        }

        speechSynthesis.onvoiceschanged = () => {
            voices = speechSynthesis.getVoices().filter(predicate);
            resolve(voices);
        };
    });
}

let loadedVoices: Array<SpeechSynthesisVoice> = [];

export async function getRandomVoice(): Promise<SpeechSynthesisVoice> {
    if (loadedVoices.length === 0) {
        loadedVoices = await loadVoices();
    }
    return sample(loadedVoices) || loadedVoices[0];
}

export async function speakText(text: string, voice: SpeechSynthesisVoice): Promise<void> {
    return new Promise((resolve) => {
        const message = new SpeechSynthesisUtterance(text);
        message.lang = config.lang;
        message.voice = voice;
        message.onend = () => resolve();
        speechSynthesis.speak(message);
    });
}
