import express from "express";
import { APP_PORT, MONGO_URI } from "./config";
import router from "./routes";
import errorHandler from "./middlewares/errorHandler";
import mongoose from "mongoose";
import path from "path";
const app = express();

//Middlewares
app.use(express.json());
app.use("/api", router);

//Error Middleware
app.use(errorHandler);

//Database Connection
mongoose.connect(MONGO_URI);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection Error"));
db.once("open", () => {
  console.log("DB Connected...");
});

global.appRoot = path.resolve(__dirname);
app.use(express.urlencoded({ extended: false }));
app.use("/uploads", express.static("uploads"));

//App Lisetner
app.listen(APP_PORT, () =>
  console.log(`Server listening on PORT : ${APP_PORT}`)
);
