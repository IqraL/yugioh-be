import express, { Request } from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

import { levels, allRaces, attributes, types, sortingValues } from "./values";

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

type SearchParams = {
  fname?: string;
  type?: string;
  attribute?: string;
  race?: string;
  level?: string;
  sort?: string;
  page: number;
};

app.post("/cards", async (req: Request<{}, {}, SearchParams>, res) => {
 try {
   const { fname, type, attribute, race, level, sort, page = 1 } = req.body;

   // Validate input helper
   const validate = (value: any, validList: any[], name: string) => {
     if (value !== undefined && !validList.includes(value)) {
       throw new Error(
         `Invalid ${name}, please pick from: ${validList.join(", ")}`
       );
     }
   };

   // Validate each field
   validate(type, types, "type");
   validate(attribute, attributes, "attribute");
   validate(race, allRaces, "race");
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
     ...(level && { level }),
     ...(sort && { sort }),
   };

   // Convert to query string
   const queryString = new URLSearchParams(
     params as Record<string, string>
   ).toString();

   // Fetch from API
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
