import React from 'react';
import { BrowserRouter as Router, Link } from 'react-router-dom';

export const Menu: React.FunctionComponent = () => {
  return (
    <Router>
      <div>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/admin">Admin</Link>
          </li>
          <li>
            <Link to="/about">À propos</Link>
          </li>
          <li>
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li>
            <Link to="/signin">Connexion</Link>
          </li>
        </ul>
        <hr />
      </div>
    </Router>
  );
};
