import React from 'react';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';
import Admin from '../page/Admin';
export const Menu: React.FunctionComponent = () => {
  return (
    <Router>
      <div>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/admin">Administration</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
            <Link to="/dashboard">Dashboard</Link>
          </li>
        </ul>
        <hr />
        <Switch>
          <Route exact path="/"></Route>
          <Route path="/admin">
            <Admin />
          </Route>
          <Route path="/about"></Route>
          <Route path="/dashboard"></Route>
        </Switch>
      </div>
    </Router>
  );
};
