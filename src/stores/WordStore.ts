import { makeObservable, observable, action, runInAction } from "mobx";
import config from "../config";
import { Stages } from "../types";
import settingsStore from "./SettingsStore";
import {getRandomVoice, speakText} from "../services/voiceService";
import * as randomWords from "random-words";
import isString from "lodash/isString";
import { toWords } from 'number-to-words';
import { soundex } from 'soundex-code'
import { doubleMetaphone } from 'double-metaphone';
import { distance as levenshteinDistance } from 'fastest-levenshtein';

class WordStore {
    stage: Stages = 'initial';
    isListening: boolean = false;

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

        this._initializeRecognition()
    }

    async listenWords(): Promise<void> {
        this.generatedWords = getRandomWords();
        this._addRecognitionGrammar(this.generatedWords)
        console.info(`Generated words: ${this.generatedWords}`)

        this.isListening = true;
        const randomVoice: SpeechSynthesisVoice = await getRandomVoice();
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
        await sleep(2000);
        this.recognition.stop();

        runInAction(() => {
            // Get direct word matches
            const missedWords = this.generatedWords.filter(x => !this.recognizedWords.has(x))
            this.correctWordsCount = this.generatedWords.length - missedWords.length
            console.log(`missedWords`, missedWords)

            // Get words that are similar
            const recognizedList = Array.from(this.recognizedWords)
            const correctWordsBySimilarity = missedWords.filter(missedWord => {
                return recognizedList.some(recognizedWord => {
                    if (phoneticMatch(missedWord, recognizedWord)) {
                        console.log(`phoneticMatch: ${missedWord}-${recognizedWord}`)
                        this.recognizedWords.add(missedWord)
                        this.recognizedWords.delete(recognizedWord)
                        return true;
                    }
                    if (levenMatch(missedWord, recognizedWord)) {
                        console.log(`levenMatch: ${missedWord}-${recognizedWord}`)
                        this.recognizedWords.add(missedWord)
                        this.recognizedWords.delete(recognizedWord)
                        return true;
                    }
                    return false;
                })
            })

            this.correctWordsCount += correctWordsBySimilarity.length
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
                        word = word.trim()
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

function phoneticMatch(a: string, b: string): boolean {
    if (soundex(a) === soundex(b)) {
        return true;
    }

    const [primaryCodeA, secondaryCodeA] = doubleMetaphone(a);
    const [primaryCodeB, secondaryCodeB] = doubleMetaphone(b);

    return Boolean(
        (primaryCodeA && (primaryCodeA === primaryCodeB || primaryCodeA === secondaryCodeB)) ||
        (secondaryCodeA && (secondaryCodeA === primaryCodeB || secondaryCodeA === secondaryCodeB))
    );
}

function levenMatch(a: string, b: string): boolean {
    const distance = levenshteinDistance(a, b);
    return distance <= 2;
}

// @ts-ignore
window.phoneticMatch = phoneticMatch
// @ts-ignore
window.levenMatch = levenMatch
