import express, { Request, Response } from "express";
import { jwtDecode } from "jwt-decode";
import jwt_decode from "jwt-decode";

import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

import { google } from "googleapis";
import crypto from "crypto";
import session from "express-session";

declare module "express-session" {
  interface SessionData {
    state?: string;
  }
}

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

const OAUTH_CLIENT_ID = process.env.OAuthClientId;
const OAUTH_CLIENT_SECRET = process.env.OAuthClientSecret;
const OAUTH_REDIRECT_URL = process.env.OAuthRedirectUri;

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
        return res.send([]);
      }

      res.send(existingCardsOwned.cards);
    } catch (error) {
      console.error("Error removing owned card:", error);
      res.send([]);
    }
  }
);

app.get("/auth-url", (req, res) => {
  const oauth2Client = new google.auth.OAuth2(
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    OAUTH_REDIRECT_URL
  );

  // Access scopes for two non-Sign-In scopes: Read-only Drive activity and Google Calendar.
  const scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ];

  // Generate a secure random state value.
  // const state = crypto.randomBytes(32).toString("hex");

  // Store state in the session

  // req.session.state = state;

  // Generate a url that asks permissions for the Drive activity and Google Calendar scope
  const authorizationUrl = oauth2Client.generateAuthUrl({
    // 'online' (default) or 'offline' (gets refresh_token)
    access_type: "offline",
    /** Pass in the scopes array defined above.
     * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
    scope: scopes,
    // Enable incremental authorization. Recommended as a best practice.
    include_granted_scopes: true,
    // // Include the state parameter to reduce the risk of CSRF attacks.
    // state: state,
  });

  res.send({ authorizationUrl });
});

type UserInfo = {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  at_hash: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  iat: number;
  exp: number;
};

app.post("/get-tokens", async (req: Request<{}, {}, { code: string }>, res) => {
  const { code } = req.body;
  console.log("code", code);
  const oauth2Client = new google.auth.OAuth2(
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    OAUTH_REDIRECT_URL
  );

  let { tokens, ...value } = await oauth2Client.getToken(code as string);

  const idToken = tokens.id_token;
  const userinfo: UserInfo = jwtDecode(idToken || "");

  const { email, name, picture } = userinfo;
  const formattedEmail = email.toLowerCase();

  const dbClient = await MongoDbClient.getClient();
  const collection = dbClient.db("yugioh").collection("users");

  const existingUser = await collection.findOne({
    email: formattedEmail,
  });

  if (!existingUser) {
    await collection.insertOne({
      email: formattedEmail,
      name,
      picture,
      ...tokens,
    });
  }
  if (existingUser) {
    await collection.updateOne(
      { email: formattedEmail },
      {
        $set: {
          email: formattedEmail,
          name,
          picture,
          ...tokens,
        },
      }
    );
  }

  res.send({
    success: true,
    jwtToken: tokens.id_token,
    email: formattedEmail,
    name,
    picture,
  });
});

type JwtPayload = {
  exp: number;
  [key: string]: any;
};
app.post("/verify-token", async (req, res) => {
  try {
    const headers = req.headers;
    const { email } = req.body;

    const token = headers["authorization"]?.split(" ")[1] || "";

    if (!token || !email) {
      return res
        .status(401)
        .send({ validJwt: false, error: "No token or user provided" });
    }

    const payloadBase64 = token.split(".")[1];
    const payloadJson = Buffer.from(payloadBase64, "base64").toString("utf-8");
    const payload = JSON.parse(payloadJson);

    const currentTime = Math.floor(Date.now() / 1000);

    if (!payload.exp || currentTime >= payload.exp) {
      return res.send({ validJwt: false });
    }

    const formattedEmail = email.toLowerCase();

    const dbClient = await MongoDbClient.getClient();
    const collection = dbClient.db("yugioh").collection("users");

    const existingUser = await collection.findOne({
      email: formattedEmail,
    });

    if (!existingUser) {
      return res.send({ validJwt: false });
    }

    if (existingUser.id_token !== token) {
      return res.send({ validJwt: false });
    }

    return res.send({ validJwt: true });
  } catch (error) {
    console.error("Invalid JWT", error);
    return res.status(400).send({ validJwt: false, error: "Invalid JWT" });
  }
});
//verify token https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=<access_token>

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
