import React, { useState, Dispatch, SetStateAction, JSX } from 'react';
import Box from "@mui/material/Box";
import Button from '@mui/material/Button';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MicIcon from '@mui/icons-material/Mic';
import sample from 'lodash/sample';
import * as randomWords from "random-words";
import config from "../config";

// Define types
type Voice = SpeechSynthesisVoice | null;
type SetState<T> = Dispatch<SetStateAction<T>>;

export default function Home(): JSX.Element {
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [isRepeating, setIsRepeating] = useState<boolean>(false);

    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            gap={2}
            height="95vh"
        >
            <Button
                disabled={isPlaying || isRepeating}
                loading={isPlaying}
                loadingPosition="start"
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={() => pronounceWords(isPlaying, setIsPlaying)}
            >
                Pronounce random words
            </Button>

            <Button
                variant="contained"
                disabled={isPlaying || isRepeating}
                startIcon={<MicIcon />}
                onClick={() => repeatWords(isRepeating, setIsRepeating)}
            >
                Repeat words
            </Button>
        </Box>
    );
}

// TODO: implement repeating
async function repeatWords(isRepeating: boolean, setIsRepeating: SetState<boolean>): Promise<void> {
    setIsRepeating(true);
    await sleep(3000);
    setIsRepeating(false);
}

async function pronounceWords(isPlaying: boolean, setIsPlaying: SetState<boolean>): Promise<void> {
    const voices: Voice[] = await getVoices();
    const randomVoice: Voice = sample(voices);

    setIsPlaying(true);
    const words: string[] = getRandomWords();
    for (const word of words) {
        await speakText(word, randomVoice);
        await sleep(config.pronounceInterval);
    }
    setIsPlaying(false);
}

function getVoices(): Promise<Voice[]> {
    const predicate = (x: SpeechSynthesisVoice) => x.lang === 'en-US';

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

function speakText(text: string, voice: Voice): Promise<void> {
    return new Promise((resolve) => {
        const message = new SpeechSynthesisUtterance(text);
        message.lang = 'en-US';
        message.voice = voice;
        message.onend = () => resolve();
        speechSynthesis.speak(message);
    });
}

function getRandomWords(): string[] {
    return randomWords.generate(config.randomWordsCount);
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
