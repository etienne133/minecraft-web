import Typography from '@material-ui/core/Typography';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

export const Menu: React.FunctionComponent = () => {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      <BrowserRouter>
        <div color="inherit">Par Étienne F.</div> {new Date().getFullYear()}
        {'.'}
      </BrowserRouter>
    </Typography>
  );
};

export default Menu;
