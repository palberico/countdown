import React from 'react';
import Home from '../src/components/pages/Home';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  // Customize MUI theme if desired
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Home />
    </ThemeProvider>
  );
}

export default App;
