
import {  Role } from "./roles";
import { mongoFind } from "../repositories";
import { User, COLLECTION } from "../user";
import { logIntoDB } from "../util/logging";
import { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";

export const roleMiddleware = (roles: string) => async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = await res.locals.jwtPayload._id;
  const user = (await mongoFind({'_id': new ObjectId(userId)}, COLLECTION)) as User;
  if (!user) {
    logIntoDB(`userid: ${userId} - User does not exist`);
    return;
  }
  //If the user is admin, he shall access everything
  if (user.role === Role.admin) {
    next();
    return; 
  }

  if (roles === user.role) {
    next();
    return; 
  }

  const errorMessage = `Forbidden  userid: ${user.username} - does not have the required role to access this ressource | user : ${user.role} ; required ${roles}`;
  logIntoDB(errorMessage);
  return res.status(403).json({
    message: errorMessage
  });
};
