import { makeObservable, observable, action, runInAction } from "mobx";
import sample from "lodash/sample";
import config from "../config";
import * as randomWords from "random-words";
import isString from "lodash/isString";
import { Stages } from "../types";
import settingsStore from "./SettingsStore";
import { toWords } from 'number-to-words';

class WordStore {
    stage: Stages = 'initial';
    isListening: boolean = false;

    voices: SpeechSynthesisVoice[] = [];
    // @ts-ignore
    recognition: SpeechRecognition | webkitSpeechRecognition;
    generatedWords: string[] = [];
    recognizedWords: Set<string> = new Set<string>();
    correctWordsCount: number = 0

    constructor() {
        makeObservable(this, {
            stage: observable,
            isListening: observable,
            generatedWords: observable,
            recognizedWords: observable,
            correctWordsCount: observable,
            listenWords: action,
            repeatWords: action,
            doneRepeating: action,
            startAgain: action,
        });

        getVoices().then((voices) => {
            this.voices = voices;
        });

        this._initializeRecognition()
    }

    async listenWords(): Promise<void> {
        this.generatedWords = getRandomWords();
        this._addRecognitionGrammar(this.generatedWords)
        console.info(`Generated words: ${this.generatedWords}`)

        const randomVoice: SpeechSynthesisVoice = sample(this.voices) || this.voices[0];
        console.info(`Pronouncing name: ${randomVoice.voiceURI}`)

        this.isListening = true;
        for (const word of this.generatedWords) {
            await speakText(word, randomVoice);
        }
        runInAction(() => {
            this.isListening = false;
            this.stage = 'listen';
        })
    }

    async repeatWords(): Promise<void> {
        this.stage = 'repeat';
        this.recognition.start();
    }

    async doneRepeating(): Promise<void> {
        this.stage = 'done_repeat';
        await sleep(1200);
        this.recognition.stop();

        runInAction(() => {
            this.correctWordsCount = this.generatedWords.filter(word => this.recognizedWords.has(word)).length
            this.stage = 'results'
        });
    }

    async startAgain(): Promise<void> {
        this.stage = 'initial';
        await this.listenWords();
    }

    _initializeRecognition(): void {
        // @ts-ignore
        this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        this.recognition.lang = config.lang;
        this.recognition.continuous = true;
        this.recognition.maxAlternatives = 5;
        // @ts-ignore
        this.recognition.onerror = (error) => {
            console.error('Error occurred in recognition: ' + error.error);
        };
        // @ts-ignore
        this.recognition.onresult = (event) => {
            const speechResults = event.results[0];
            const recognizedWords = new Set<string>()

            runInAction(() => {
                for (const speechResult of speechResults) {
                    speechResult.transcript.split(' ').forEach((word: string) => {
                        word = normalizeNumbers(word)
                        word = word.toLowerCase()
                        recognizedWords.add(word)
                    })
                }
                this.recognizedWords = recognizedWords;
            })
        };
    }

    _addRecognitionGrammar(words: string[]): void {
        const grammar = `#JSGF V1.0; grammar words; public <word> = ${words.join(' | ')} ;`;
        // @ts-ignore
        const speechRecognitionList = new (window.SpeechGrammarList || window.webkitSpeechGrammarList)();
        speechRecognitionList.addFromString(grammar, 1);
        this.recognition.grammars = speechRecognitionList;
    }
}

export const wordStore = new WordStore();


async function getVoices(): Promise<SpeechSynthesisVoice[]> {
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

function normalizeNumbers(text: string): string {
    return text.replace(/\d+/g, (match) =>
        toWords(parseInt(match, 10)).replace(/-/g, ' ')
    );
}

async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), ms);
    });
}