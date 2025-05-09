import React, { JSX, useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import SettingsIcon from '@mui/icons-material/Settings';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import { observer } from 'mobx-react-lite';
import settingsStore, {RANDOM_WORDS_COUNT_MIN, RANDOM_WORDS_COUNT_MAX} from '../stores/SettingsStore';
import range from 'lodash/range'

function Header(): JSX.Element {
    const [isSettingsOpen, setSettingsOpen] = useState(false);

    const handleOpenSettings = () => setSettingsOpen(true);
    const handleCloseSettings = () => setSettingsOpen(false);

    const handleRandomWordsChange = (_: Event, newValue: number | number[]) => {
        if (typeof newValue === 'number') {
            settingsStore.setRandomWordsCount(newValue);
        }
    };

    const marks = range(RANDOM_WORDS_COUNT_MIN, RANDOM_WORDS_COUNT_MAX + 1)
        .map(x => ({value: x, label: `${x}`}));

    return (
        <Box>
            <Box display="flex" justifyContent="flex-end" p={2}>
                <IconButton onClick={handleOpenSettings}>
                    <SettingsIcon />
                </IconButton>
            </Box>
            <Modal
                open={isSettingsOpen}
                onClose={handleCloseSettings}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box
                    bgcolor="background.paper"
                    p={4}
                    borderRadius={2}
                    boxShadow={24}
                    width={'20vw'}
                    marginLeft={'auto'}
                    marginRight={'auto'}
                    marginTop={'20vh'}
                >
                    <Typography variant="h6" component="h2" gutterBottom>
                        Settings
                    </Typography>
                    <Typography sx={{ mb: 2 }}>
                        Select the number of random words:
                    </Typography>
                    <Slider
                        value={settingsStore.randomWordsCount}
                        onChange={handleRandomWordsChange}
                        min={RANDOM_WORDS_COUNT_MIN}
                        max={RANDOM_WORDS_COUNT_MAX}
                        step={1}
                        marks={marks}
                    />
                </Box>
            </Modal>
        </Box>
    );
}

export default observer(Header);