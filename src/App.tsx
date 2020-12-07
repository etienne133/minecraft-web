import React from 'react';
import './App.css';
import { Menu } from './components/Menu';
import Footer from './components/Footer';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Admin from './page/Admin';
import { Box, Container, CssBaseline, ThemeProvider } from '@material-ui/core';
import theme from './theme/theme';
import Typography from '@material-ui/core/Typography';

const App: React.FC = () => {
  return (
    <div className="App">
      <ThemeProvider theme={theme}>
        <CssBaseline />

        <Container maxWidth="md">
          <Box my={4}>
            <Router>
              <Menu />
              <Typography variant="h4" component="h1" gutterBottom>
                Site web dédié au server Minecraft
              </Typography>
              <Switch>
                <Route exact path="/"></Route>
                <Route path="/admin">
                  <Admin />
                </Route>
                <Route path="/about"></Route>
                <Route path="/dashboard"></Route>
                <Route path="/signin"></Route>
              </Switch>
            </Router>
            <Footer />
          </Box>
        </Container>
      </ThemeProvider>
    </div>
  );
};

export default App;
