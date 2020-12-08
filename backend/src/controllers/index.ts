import {
  createUser,
  validateUser,
  isTimedout,
  isBlocked,
  changePassword,
  isExpired,
  getUser,
} from "../user";
import {
  AuthManager,
  AuthSettings,
  PasswordSettings
} from "../auth";
import { Response, Request, Router } from "express";
import { roleMiddleware } from "../role";
import { ROLE, Role } from "../role/roles";
import { checkJwtMiddleware } from "../jwtMiddleware";
import { logIntoDB } from "../util/logging";

const router = Router();

router.get("/example/:id", (req, res) => {
  return res.send("example");
});

router.get("/me", checkJwtMiddleware, async (req, res) => {
  const username = res.locals.jwtPayload.username;
  const user = await getUser(res.locals.jwtPayload.username);
  if (!user)
    return res
      .status(404)
      .send(`user: ${username} - (Request info) User does not exist`);

  return res
    .status(200)
    .send({ id: user._id, role: user.role, username: user.username });
});

/** Create User, must be admin */
router.post("/users",  
[checkJwtMiddleware, roleMiddleware(ROLE.admin)],
async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const role = req.body.role;

  const created = await createUser(username, password, role);
  return res
    .status(created ? 200 : 400)
    .send(created ? "User created" : "User already exists or invalid password");
});

/** Update Password */
router.post("/users/:username/password/", 
[checkJwtMiddleware, roleMiddleware(ROLE.user)],
async (req, res) => {
  const username = req.params.username;
  const password = req.body.password;
  const newPassword = req.body.newPassword;

  const changed = await changePassword(username, password, newPassword);

  return res.sendStatus(changed ? 200 : 400);
});

/** Login */
router.post("/auth", async (req, res, next) => {
  const username: string = req.body.username;
  const password: string  = req.body.password;
  const user = await getUser(username.toLowerCase());
  if (!user)
    return res
      .status(404)
      .send(
        `user: ${username} - (Request for authentification) Username does not exist`
      );

  const expired = await isExpired(user);

  if (expired)
    return res
      .status(400)
      .send("Password expired: Please change your password");

  const locked = await isTimedout(user);
  if (locked) return res.status(400).send("Timed out: Try again later");

  const blocked = await isBlocked(user);
  if (blocked)
    return res.status(400).send("Locked: Ask an administrator to unblock");

  const validatedUser = await validateUser(user, password);

  const token = await validatedUser(req, res, next);

  const response = {
    AccessToken : token,
    Id: user._id, 
    Role: user.role, 
    Username: user.username
  }

  return res.status(200).send(response);
});

/** LOGIN with cookie response  */
router.post("/auth2", async (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;
  const user = await getUser(username);

  if (!user)
    return res
      .status(400)
      .send(
        `user: ${username} - (Request for authentification) Username does not exist`
      );

  const expired = await isExpired(user);
  if (expired)
    return res
      .status(400)
      .send("Password expired: Please change your password");

  const locked = await isTimedout(user);
  if (locked) return res.status(400).send("Timed out: Try again later");

  const blocked = await isBlocked(user);
  if (blocked)
    return res.status(400).send("Locked: Ask an administrator to unblock");

  // STEP 3: ACTUAL AUTHENTICATION
  const validatedUser = await validateUser(user, password);

  const token = await validatedUser(req, res, next);

  // return res.status(200).send(token);
  return res
    .cookie("auth", token, {
      expires: new Date(Date.now() + "1h"),
      secure: false, // true si https
      httpOnly: true
    })
    .status(200)
    .send(token);
});

/* Config */
router.put("/config/auth", async (req, res) => {
  const config = req.body as Partial<AuthSettings>;
  AuthManager.updateAuthSettings(config);

  return res.sendStatus(200);
});

router.put("/config/password", async (req, res) => {
  const config = req.body as Partial<PasswordSettings>;
  AuthManager.updatePassSettings(config); 
  return res.sendStatus(200);
});

/* Check is logged and token status **for testing purpose** */
router.get(
  "/isLogged",
  checkJwtMiddleware,
  async (_req: Request, res: Response) => res.sendStatus(200)
);

router.get(
  "/checkUserIsAdmin",
  [checkJwtMiddleware, roleMiddleware(ROLE.admin)],
  async (_req: Request, res: Response) => res.sendStatus(200)
);

router.get(
  "/checkUserIsUser",
  [checkJwtMiddleware, roleMiddleware(ROLE.user)],
  async (_req: Request, res: Response) => res.sendStatus(200)
);

router.get(
  "/checkUserIsPoweruser",
  [checkJwtMiddleware, roleMiddleware(ROLE.poweruser)],
  async (_req: Request, res: Response) => res.sendStatus(200)
);

export default router;
