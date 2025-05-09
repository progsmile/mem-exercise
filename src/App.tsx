import { JSX } from 'react';
import './App.css'
import Home from "./pages/Home";
import { Box } from '@mui/material';
import Header from "./components/Header";

function App(): JSX.Element {
    return (
        <div className="App">
            <Box display="flex" flexDirection="column">
                <Header />
                <Home />
            </Box>
        </div>
    );
}

export default App;
