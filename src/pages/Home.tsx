import React, { JSX } from 'react';
import Box from "@mui/material/Box";
import Button from '@mui/material/Button';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MicIcon from '@mui/icons-material/Mic';
import { observer } from "mobx-react-lite";
import { wordStore } from "../stores/WordStore";
import Typography from '@mui/material/Typography';
import ReplayIcon from '@mui/icons-material/Replay';

function Home(): JSX.Element {
    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            gap={2}
            height="60vh"
        >
            {(wordStore.stage === 'initial') && (
                <Button
                    loading={wordStore.isListening}
                    loadingPosition="start"
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    onClick={() => wordStore.listenWords()}
                >Listen to random words</Button>
                )
            }

            {wordStore.stage === 'listen' && (
                <Button
                    variant="contained"
                    startIcon={<MicIcon />}
                    onClick={() => wordStore.repeatWords()}
                >Repeat words</Button>
                )
            }

            {(wordStore.stage === 'repeat' || wordStore.stage === 'done_repeat') && (
                <Button
                    variant="contained"
                    loading={wordStore.stage === 'done_repeat'}
                    loadingPosition="start"
                    startIcon={<MicIcon />}
                    onClick={() => wordStore.doneRepeating()}
                >Done repeating</Button>
            )
            }

            {wordStore.stage === 'results' && (
                <Box>
                    <Button
                        variant="contained"
                        startIcon={<ReplayIcon />}
                        onClick={() => wordStore.startAgain()}
                    >Start again</Button>
                    <Box>
                        <Typography color="primary" variant="h4" >Results: {" "}
                            {wordStore.correctWordsCount} {" "} of {wordStore.generatedWords.length}
                        </Typography>
                        <Typography color="primary" variant="h5">Generated words: {wordStore.generatedWords.join(', ')}</Typography>
                        <Typography color="primary" variant="h5">Recognized words: {Array.from(wordStore.recognizedWords).join(', ')}</Typography>
                    </Box>
                </Box>
                )
            }
        </Box>
    );
}

export default observer(Home);
