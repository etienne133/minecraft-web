import * as jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";

const secret = "whosyourdaddy"; //secret for encription TODO remove this from code... 

export const checkJwtMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers["auth"] as string;
  let jwtPayload;
  try {
    jwtPayload = jwt.verify(token, secret);
    res.locals.jwtPayload = jwtPayload;
  } catch (error) {
    res.status(403).send();
    return;
  }

  const { userId, username } = jwtPayload;
  const newToken = jwt.sign({ userId, username }, secret, {
    expiresIn: "1h"
  });
  res.setHeader("token", newToken);
  next();
};

export const signInJwt = async ({
  _id,
  username,
  expiresIn = "1h"
}: {
  _id: string;
  username: string;
  expiresIn: string;
}) =>
  jwt.sign({ _id, username }, secret, {
    expiresIn
  });
