import express, { Request, Response } from "express";
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
import { MongoDbClient } from "./db/mongodbclient";

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
      error: `No data found for this search`,
    });
  }
});

type AddOwnedCardParam = {
  cardId: string;
  userId: string;
};
const client = MongoDbClient.getClient();

app.post(
  "/add-owned-card",
  async (req: Request<{}, {}, AddOwnedCardParam>, res: Response) => {
    try {
      const { cardId, userId } = req.body;

      if (!cardId || !userId) {
        return res.status(400).send({ error: "Card ID & User Id is required" });
      }
      const dbClient = await client;
      const collection = dbClient.db("yugioh").collection("ownedCards");
      const existingCardsOwned = await collection.findOne({
        userId,
      });

      if (!existingCardsOwned) {
        await collection.insertOne({
          userId,
          cards: [cardId],
        });
      }

      if (existingCardsOwned) {
        const { cards } = existingCardsOwned;
        const cardExists = cards.includes(cardId);

        if (cardExists) {
          return res.status(400).send({ error: "Card already exists" });
        }

        await collection.updateOne(
          { userId },
          //@ts-ignore
          { $push: { cards: cardId } }
        );
      }

      console.log("existingCardsOwned", existingCardsOwned);

      res.send({ success: true });
    } catch (error) {
      console.error("Error adding owned card:", error);
      res.status(500).send({ error: "Failed to add owned card" });
    }
  }
);

app.post(
  "/remove-owned-card",
  async (req: Request<{}, {}, AddOwnedCardParam>, res: Response) => {
    try {
      const { cardId, userId } = req.body;
      if (!cardId || !userId) {
        return res.status(400).send({ error: "Card ID & User Id is required" });
      }
      const dbClient = await client;
      const collection = dbClient.db("yugioh").collection("ownedCards");
      const existingCardsOwned = await collection.findOne({
        userId,
      });
      if (!existingCardsOwned) {
        return res.status(400).send({ error: "Card does not exist" });
      }
      const { cards } = existingCardsOwned;
      const cardExists = cards.includes(cardId);
      if (!cardExists) {
        return res.status(400).send({ error: "Card does not exist" });
      }

      //@ts-ignore
      const value = await collection.updateOne(
        { userId },
        { $pull: { cards: cardId } }
      );

      res.send({ success: value.acknowledged });
    } catch (error) {
      console.error("Error removing owned card:", error);
      res.status(500).send({ error: "Failed to remove owned card" });
    }
  }
);

app.post(
  "/get-owned-cards",
  async (req: Request<{}, {}, { userId: string }>, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).send({ error: "User Id is required" });
      }
      const dbClient = await client;
      const collection = dbClient.db("yugioh").collection("ownedCards");
      const existingCardsOwned = await collection.findOne({
        userId,
      });

      if (!existingCardsOwned) {
        return res.send([])
      }
      
      res.send(existingCardsOwned.cards);
    } catch (error) {
       console.error("Error removing owned card:", error);
       res.send([])
    }
  }
);
app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
