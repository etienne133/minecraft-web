import React from 'react';
import logo from './logo.svg';
import './App.css';
import { Menu } from './components/Menu';

const App = () => {
  return (
    <div className="App">
      <header className="App-header">
        <Menu />
        <p></p>
      </header>
    </div>
  );
};

export default App;
