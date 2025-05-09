import {makeObservable, observable, action, runInAction} from "mobx";
import sample from "lodash/sample";
import config from "../config";
import * as randomWords from "random-words";
import isString from "lodash/isString";
import { Stages } from "../types";
import settingsStore from "./SettingsStore";

class WordStore {
    stage: Stages = 'initial';
    isListening: boolean = false;

    voices: SpeechSynthesisVoice[] = [];
    // @ts-ignore
    recognition: SpeechRecognition | webkitSpeechRecognition;
    generatedWords: string[] = [];
    recognizedWords: Set<string> = new Set<string>();

    constructor() {
        makeObservable(this, {
            stage: observable,
            isListening: observable,
            generatedWords: observable,
            recognizedWords: observable,
            listenWords: action,
            repeatWords: action,
            doneRepeating: action
        });

        getVoices().then((voices) => {
            this.voices = voices;
        });

        this._initializeRecognition()
    }

    async listenWords(): Promise<void> {
        this.generatedWords = getRandomWords();
        const randomVoice: SpeechSynthesisVoice = sample(this.voices) || this.voices[0];

        await runInAction(async () => {
            this.isListening = true;
            await speakText(this.generatedWords.join('. '), randomVoice);
            this.isListening = false;
            this.stage = 'listen';
        });
    }

    async repeatWords(): Promise<void> {
        wordStore.stage = 'repeat';
        this.recognition.start();
    }

    async doneRepeating(): Promise<void> {
        this.stage = 'done_repeat';
        this.recognition.stop();
    }

    startAgain(): void {
        this.stage = 'initial'
    }

    _initializeRecognition(): void {
        // @ts-ignore
        this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        this.recognition.lang = config.lang;
        this.recognition.continuous = true;
        // @ts-ignore
        this.recognition.onerror = (error) => {
            console.error('Error occurred in recognition: ' + error.error);
        };
        // @ts-ignore
        this.recognition.onresult = (event) => {
            this.recognizedWords = new Set(event.results[0][0].transcript.split(' ').map((word: string) => word.toLowerCase()));
        };
    }
}

export const wordStore = new WordStore();


async function getVoices(): Promise<SpeechSynthesisVoice[]> {
    const predicate = (x: SpeechSynthesisVoice) => x.lang === config.lang;

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

function speakText(text: string, voice: SpeechSynthesisVoice): Promise<void> {
    return new Promise((resolve) => {
        const message = new SpeechSynthesisUtterance(text);
        message.lang = config.lang;
        message.voice = voice;
        message.onend = () => resolve();
        speechSynthesis.speak(message);
    });
}

function getRandomWords(): string[] {
    const words = randomWords.generate(settingsStore.randomWordsCount)
    return isString(words) ? [words] : words;
}
