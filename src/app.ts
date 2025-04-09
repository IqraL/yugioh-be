import express, { Request } from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import { levels, allRaces, attributes, types } from "./values";

const app = express();
const port = 3000;

app.use(
  cors({
    origin: ["http://localhost:8000", "http://localhost:4000"], // Update this to your frontend URL
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/get-levels", (req, res) => {
  res.send(levels);
});

app.get("/get-attributes", (req, res) => {
  res.send(attributes);
});
app.get("/get-types", (req, res) => {
  res.send(types);
});
app.get("/get-allRaces", (req, res) => {
  res.send(allRaces);
});

app.post("/cards", (req: Request<{},{},{}>, res) => {
  res.send(allRaces);
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
