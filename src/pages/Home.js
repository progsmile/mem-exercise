import React, {useState} from 'react';
import Box from "@mui/material/Box";
import Button from '@mui/material/Button';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MicIcon from '@mui/icons-material/Mic';
import sample from 'lodash/sample'
import * as randomWords from "random-words";
import config from "./../config"

export default function Home() {
    const [isPlaying, setIsPlaying] = useState(false)
    const [isRepeating, setIsRepeating] = useState(false)

    return (<Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        gap={2}
        height="95vh"
    >
        <Button disabled={isPlaying || isRepeating}
                loading={isPlaying}
                loadingPosition="start"
                variant="contained"
                startIcon={<PlayArrowIcon/>}
                onClick={() => pronounceWords(isPlaying, setIsPlaying)}>
            Pronounce random words
        </Button>

        <Button variant="contained"
                disabled={isPlaying || isRepeating}
                startIcon={<MicIcon/>}
                onClick={() => repeatWords(isRepeating, setIsRepeating)}>
            Repeat words
        </Button>
    </Box>);
}

// TODO: implement repeating
async function repeatWords(isRepeating, setIsRepeating) {
    setIsRepeating(true)
    await sleep(3000)
    setIsRepeating(false)
}

async function pronounceWords(isPlaying, setIsPlaying) {
    const voices = await getVoices()
    const randomVoice = sample(voices)

    setIsPlaying(true)
    const randomWords = getRandomWords()
    for (const word of randomWords) {
        await speakText(word, randomVoice);
        await sleep(config.pronounceInterval);
    }
    setIsPlaying(false)
}


function getVoices() {
    const predicate = x => x.lang === 'en-US'

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

function speakText(text, voice) {
    return new Promise((resolve) => {
        const message = new SpeechSynthesisUtterance(text);
        message.lang = 'en-US';
        message.voice = voice;
        message.onend = () => resolve();
        speechSynthesis.speak(message);
    });
}

function getRandomWords() {
    return randomWords.generate(config.randomWordsCount);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
