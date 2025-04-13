import express from "express";
import { levels, attributes, types, allRaces, archetypes } from "../values";

const staticValuesRouter = express.Router();

staticValuesRouter.get("/get-levels", (req, res) => {
  res.send(levels);
});

staticValuesRouter.get("/get-attributes", (req, res) => {
  res.send(attributes);
});
staticValuesRouter.get("/get-types", (req, res) => {
  res.send(types);
});
staticValuesRouter.get("/get-allRaces", (req, res) => {
  res.send(allRaces);
});
staticValuesRouter.get("/get-archetypes", (req, res) => {
  res.send(archetypes);
});

export { staticValuesRouter };
