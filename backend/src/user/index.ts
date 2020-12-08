import { insertOne, mongoFind, updateOne, findMany } from "../repositories";
import { logIntoDB } from "../util/logging";
import { AuthManager } from "../auth";
import { Role } from "../role/roles";
import { signInJwt } from "../jwtMiddleware";

export interface User {
  _id?: string;
  username: string;
  hash: string;
  salt: string;
  role: Role;
  timeout?: number;
  oldPasswords: {
    hash: string;
    salt: string;
  }[];
  failedAttempts: number;
  blocked?: boolean;
  passwordExpireTime: number;
}

export const COLLECTION = "user";

export const getUser = async (username: string): Promise<User> => {
  return (await mongoFind({ username }, COLLECTION)) as User;
}

export const validCreation = async (user: User, password: string): Promise<boolean> => {
  const validRole = Object.values(Role).includes(user.role);
  const validPass = await AuthManager.validatePassword(password);

  return validRole && validPass;
}

export const createUser = async(
  username: string,
  password: string,
  role: Role
): Promise<boolean> => {
  const userExists = await getUser(username);
  if (userExists) return false;

  const salt = AuthManager.generateSalt();
  const hash = AuthManager.hashPasswordWithSalt(password, salt);
  const passwordExpireTime = await AuthManager.setUserPasswordExpiry();

  // TODO: validate username doesn't already exists.
  const user = {
    username,
    role,
    salt,
    hash,
    oldPasswords: [],
    failedAttempts: 0,
    passwordExpireTime
  };
  if (await validCreation(user, password)) {
    logIntoDB(`user: ${username} - Creation with role ${role}`);
    await insertOne(user, COLLECTION);
    return true;
  }
  return false;
}

export const isTimedout = async (user: User): Promise<boolean> => {
  let locked = false;

  if (user?.timeout) {
    locked = new Date().getTime() < user.timeout;
    if (locked) {
      logIntoDB(
        `user: ${user.username} - (Request for authentification) User is timed out`
      );
    }
  }
  return locked;
}

export  const isBlocked = async (user: User): Promise<boolean> => {
  const locked = user?.blocked;

  if (locked) {
    logIntoDB(
      `user: ${user.username} - (Request for authentification) User is blocked`
    );
  }
  return locked;
}

export const isExpired = async(user: User): Promise<boolean> => {

  const locked = new Date().getTime() > user.passwordExpireTime;

  if (locked) {
    logIntoDB(
      `user: ${user.username} - (Request for authentification) User's password has expired`
    );
  }
  return locked;
}

export const validateUser = async (
  user: User,
  password: string
) => async (_req, res, _next) => {
  if (!user) {
    const errorMessage = `user: ${user.username} - (Request for authentification) Username does not exist`;
    logIntoDB(errorMessage);
    res.status(401).send(errorMessage);
  }

  const valid = validPasswordLogin(user, password);
  if (!valid) {
    AuthManager.lockout(user);
    res.status(401).send(`Bad password`);
  }
  const jwtToken = await signInJwt({
    _id: user._id!,
    username: user.username,
    expiresIn: "1h"
  });

  logIntoDB(
    `user: ${user.username} - (Request for authentification) ${
      valid ? "Successful login" : "Wrong password"
    }`
  );
  setUserFailedAttempts(user, valid);
  return jwtToken;
};

export const validPasswordLogin = (user: User, providedPassword: string): boolean => {
  return (
    AuthManager.hashPasswordWithSalt(providedPassword, user.salt) === user.hash
  );
}

export const changePassword = async (
  username: string,
  oldPassword: string,
  newPassword: string,
  isAdmin = false
): Promise<boolean> => {
  logIntoDB(`user: ${username} - (Request to change password) Request sent`);

  // user exists
  const user = (await mongoFind({ username }, COLLECTION)) as User;
  if (!user) {
    logIntoDB(
      `user: ${username} - (Request to change password) Username does not exist`
    );
    return false;
  }

  // password is good (or skip if admin)
  const matchPassword = validPasswordLogin(user, oldPassword) || isAdmin;
  if (!matchPassword) {
    logIntoDB(
      `user: ${username} - (Request to change password) Wrong password`
    );
    return false;
  }

  // new password is OK
  user.oldPasswords.push({ hash: user.hash, salt: user.salt });
  const validNewPassword = await AuthManager.validatePassword(
    newPassword,
    user.oldPasswords
  );
  if (!validNewPassword) {
    logIntoDB(
      `user: ${username} - (Request to change password) New password is not valid`
    );
    return false;
  }

  // change password
  user.salt = AuthManager.generateSalt();
  user.hash = await AuthManager.hashPasswordWithSalt(newPassword, user.salt);
  user.passwordExpireTime = await AuthManager.setUserPasswordExpiry();
  user.blocked = false;
  user.failedAttempts = 0;
  updateOne(user._id, user, COLLECTION);
  logIntoDB(
    `user: ${username} - (Request to change password) Successfully changed password`
  );
  return true;
}

const setUserFailedAttempts = async(
  user: User,
  success: boolean
): Promise<User> => {
  user.failedAttempts = success ? 0 : user.failedAttempts + 1;
  AuthManager.tryToBlock(user);

  await updateOne(user._id, user, COLLECTION);
  return user;
}

export const getUsersByRoleName = async({role}: {role: Role}) => await findMany({role:role},COLLECTION)
