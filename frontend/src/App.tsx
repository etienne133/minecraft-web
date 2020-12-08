import React from 'react';
import './App.css';
import { Menu } from './components/Menu';
import Footer from './components/Footer';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Admin from './page/Admin';
import { Box, Container, CssBaseline, ThemeProvider } from '@material-ui/core';
import theme from './theme/theme';
import Typography from '@material-ui/core/Typography';
import SignIn from './page/Login';

const App: React.FC = () => {
  return (
    <div className="App">
      <Router>
        <Route path="/signin">
          <SignIn />
        </Route>
        <Route path="/home">
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Container maxWidth="md">
              <Box my={4}>
                <Menu />
                <Typography variant="h4" component="h1" gutterBottom>
                  Site web dédié au server Minecraft
                </Typography>
                <Router>
                  <Switch>
                    <Route exact path="/"></Route>
                    <Route path="/admin">
                      <Admin />
                    </Route>
                    <Route path="/about"></Route>
                    <Route path="/dashboard"></Route>
                  </Switch>
                </Router>
                <Footer />
              </Box>
            </Container>
          </ThemeProvider>
        </Route>
      </Router>
    </div>
  );
};

export default App;
