import express, { Request } from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

import { staticValuesRouter } from "./routes";
import {
  levels,
  allRaces,
  attributes,
  types,
  sortingValues,
  archetypes,
} from "./values";

const app = express();
const port = 3000;


app.use(cors());
app.use(express.json());
app.use(express.urlencoded());

app.get("/", (req, res) => {
  res.send("hello world");
});

app.use(staticValuesRouter);

type SearchParams = {
  fname?: string;
  type?: string;
  attribute?: string;
  race?: string;
  level?: string;
  archetype?: string;
  sort?: string;
  page: number;
};

app.post("/cards", async (req: Request<{}, {}, SearchParams>, res) => {
  try {
    const {
      fname,
      type,
      attribute,
      race,
      level,
      archetype,
      sort,
      page = 1,
    } = req.body;


    const validate = (value: any, validList: any[], name: string) => {
      if (value === undefined || value === null || value === "") {
        return; // Allow undefined values (optional fields)
      }

      const isValid = (currentValue: string) =>
        validList.includes(currentValue.trim());
      const values = typeof value === "string" ? value.split(",") : [value];

      if (!values.every(isValid)) {
        throw new Error(
          `Invalid ${name}, please pick from: ${validList.join(", ")}`
        );
      }
    };

    // Validate each field
    validate(type, types, "type");
    validate(attribute, attributes, "attribute");
    validate(race, allRaces, "race");
    validate(archetype, archetypes, "archetype");
    validate(level, levels, "level");
    validate(sort, sortingValues, "sorting value");

    // Build params
    const params: Record<string, string | number> = {
      num: 50,
      offset: (page - 1) * 50,
      ...(fname && { fname }),
      ...(type && { type }),
      ...(attribute && { attribute }),
      ...(race && { race }),
      ...(archetype && { archetype }),
      ...(level && { level }),
      ...(sort && { sort }),
    };

    const queryString = new URLSearchParams(
      params as Record<string, string>
    ).toString();

    console.log("Query String:", queryString);

    const response = await axios.get(
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?${queryString}`
    );

    res.send(response.data);
  } catch (error: any) {
    res.send({
      error: `An error occurred while fetching data. ${error.message}`,
    });
  }
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
