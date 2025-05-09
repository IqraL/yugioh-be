import express from "express";
import {
  levels,
  attributes,
  types,
  allRaces,
  archetypes,
  cardSets,
} from "./values.js";

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

staticValuesRouter.get("/get-cardSets", (req, res) => {
  res.send(cardSets.sort((a, b) => {
    return a.tcg_date > b.tcg_date ? -1 : 1;
  }).map((set)=>{return set.set_name;}));
});

export { staticValuesRouter };
