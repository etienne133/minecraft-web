require("dotenv").config();
import * as express from "express";
import * as bodyParser from "body-parser";
import router from "./controllers";
import { DbClient } from "./repositories";
import cookieParser = require("cookie-parser");
import * as cors from "cors";
const PORT = process.env.PORT || 3000;
const app = express();

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function main() {
  try {
    await DbClient.connect();
    DbClient.connect;

    app.get("/", (req, res) => res.send("Minecraft"));

    // app.use(
    //   cors({
    //     origin: [
    //       "https://localhost:3000",
    //       "http://localhost:3000",
    //       "https://localhost:8080",
    //       "http://127.0.0.1:3001"
    //     ],
    //     credentials: true
    //   })
    // );
    // if(process.env.enforceEncryptedRequest){
    //   app.use(checkCertificate);
    // }

    app.use(cookieParser());
    app.use((_req, res, next) => {
      // res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
      );
      next();
    });

    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    app.use("/v1/", router);
    app.listen(PORT, () => {
      console.log(`Server is running in http://localhost:${PORT}`);
    });
  } catch (e) {
    console.error(e);
  } finally {
    await DbClient.close();
  }
}
main().catch(console.error); //TODO log 