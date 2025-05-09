var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import express from "express";
import { google } from "googleapis";
import { jwtDecode } from "jwt-decode";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
// declare module "express-session" {
//   interface SessionData {
//     state?: string;
//   }
// }
import { staticValuesRouter } from "./routes/index.js";
import { levels, allRaces, attributes, types, sortingValues, archetypes, } from "./routes/values.js";
import { MongoDbClient } from "./db/mongodbclient.js";
const app = express();
const port = process.env.port || 3000;
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
app.post("/cards", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fname, type, attribute, race, level, archetype, sort, page = 1, } = req.body;
        const validate = (value, validList, name) => {
            if (value === undefined || value === null || value === "") {
                return; // Allow undefined values (optional fields)
            }
            const isValid = (currentValue) => validList.includes(currentValue.trim());
            const values = typeof value === "string" ? value.split(",") : [value];
            if (!values.every(isValid)) {
                throw new Error(`Invalid ${name}, please pick from: ${validList.join(", ")}`);
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
        const params = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ num: 50, offset: (page - 1) * 50 }, (fname && { fname })), (type && { type })), (attribute && { attribute })), (race && { race })), (archetype && { archetype })), (level && { level })), (sort && { sort }));
        const queryString = new URLSearchParams(params).toString();
        const response = yield axios.get(`https://db.ygoprodeck.com/api/v7/cardinfo.php?${queryString}`);
        res.send(response.data);
    }
    catch (error) {
        res.send({
            error: `No data found for this search`,
        });
    }
}));
const client = MongoDbClient.getClient();
app.post("/add-owned-card", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cardId, userId } = req.body;
        if (!cardId || !userId) {
            return res.status(400).send({ error: "Card ID & User Id is required" });
        }
        const dbClient = yield client;
        const collection = dbClient.db("yugioh").collection("ownedCards");
        const existingCardsOwned = yield collection.findOne({
            userId: new RegExp(`^${userId}$`, "i"),
        });
        if (!existingCardsOwned) {
            yield collection.insertOne({
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
            yield collection.updateOne({ userId: new RegExp(`^${userId}$`, "i") }, 
            //@ts-ignore
            { $push: { cards: cardId } });
        }
        res.send({ success: true });
    }
    catch (error) {
        console.error("Error adding owned card:", error);
        res.status(500).send({ error: "Failed to add owned card" });
    }
}));
app.post("/remove-owned-card", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cardId, userId } = req.body;
        if (!cardId || !userId) {
            return res.status(400).send({ error: "Card ID & User Id is required" });
        }
        const dbClient = yield client;
        const collection = dbClient.db("yugioh").collection("ownedCards");
        const existingCardsOwned = yield collection.findOne({
            userId: new RegExp(`^${userId}$`, "i"),
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
        const value = yield collection.updateOne({ userId: new RegExp(`^${userId}$`, "i") }, 
        //@ts-ignore
        { $pull: { cards: cardId } });
        res.send({ success: value.acknowledged });
    }
    catch (error) {
        console.error("Error removing owned card:", error);
        res.status(500).send({ error: "Failed to remove owned card" });
    }
}));
app.post("/get-card-set-info", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { setName, page = 1 } = req.body;
        if (!setName) {
            return res.status(400).send({ error: "Set name is required" });
        }
        const num = 50;
        const offset = (page - 1) * 50;
        const response = yield axios.get(`https://db.ygoprodeck.com/api/v7/cardinfo.php?cardset=${setName}&num=${num}&offset=${offset}`);
        res.send(response.data);
    }
    catch (error) {
        res.send([]);
    }
}));
app.post("/get-owned-cards", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).send({ error: "User Id is required" });
        }
        const dbClient = yield client;
        const collection = dbClient.db("yugioh").collection("ownedCards");
        const existingCardsOwned = yield collection.findOne({
            userId: new RegExp(`^${userId}$`, "i"),
        });
        if (!existingCardsOwned) {
            return res.send([]);
        }
        res.send(existingCardsOwned.cards);
    }
    catch (error) {
        console.error("Error removing owned card:", error);
        res.send([]);
    }
}));
function paginate(array, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    return array.slice(offset, offset + limit);
}
app.post("/get-owned-cards-with-details", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    try {
        const { userId, page, limit } = req.body;
        if (!userId) {
            return res.status(400).send({ error: "User Id is required" });
        }
        const dbClient = yield client;
        const collection = dbClient.db("yugioh").collection("ownedCards");
        const existingCardsOwned = yield collection.findOne({
            userId: new RegExp(`^${userId}$`, "i"),
        });
        if (!existingCardsOwned) {
            return res.send([]);
        }
        const cardsWithDetails = [];
        const paginatedCardIds = paginate(existingCardsOwned.cards, page, limit);
        try {
            for (var _d = true, paginatedCardIds_1 = __asyncValues(paginatedCardIds), paginatedCardIds_1_1; paginatedCardIds_1_1 = yield paginatedCardIds_1.next(), _a = paginatedCardIds_1_1.done, !_a; _d = true) {
                _c = paginatedCardIds_1_1.value;
                _d = false;
                const cardId = _c;
                const response = yield axios.get(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${cardId}`);
                cardsWithDetails.push(response.data.data[0]);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = paginatedCardIds_1.return)) yield _b.call(paginatedCardIds_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        res.send(cardsWithDetails);
    }
    catch (error) {
        console.error("Error removing owned card:", error);
        res.send([]);
    }
}));
app.get("/auth-url", (req, res) => {
    const oauth2Client = new google.auth.OAuth2(OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, OAUTH_REDIRECT_URL);
    const scopes = [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
    ];
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
app.post("/get-tokens", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { code } = req.body;
    const oauth2Client = new google.auth.OAuth2(OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, OAUTH_REDIRECT_URL);
    let _a = yield oauth2Client.getToken(code), { tokens } = _a, value = __rest(_a, ["tokens"]);
    const idToken = tokens.id_token;
    const userinfo = jwtDecode(idToken || "");
    const { email, name, picture } = userinfo;
    const formattedEmail = email.toLowerCase();
    const dbClient = yield MongoDbClient.getClient();
    const collection = dbClient.db("yugioh").collection("users");
    const existingUser = yield collection.findOne({
        email: formattedEmail,
    });
    if (!existingUser) {
        yield collection.insertOne(Object.assign({ email: formattedEmail, name,
            picture }, tokens));
    }
    if (existingUser) {
        yield collection.updateOne({ email: formattedEmail }, {
            $set: Object.assign({ email: formattedEmail, name,
                picture }, tokens),
        });
    }
    res.send({
        success: true,
        jwtToken: tokens.id_token,
        email: formattedEmail,
        name,
        picture,
    });
}));
app.post("/verify-token", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const headers = req.headers;
        const { email } = req.body;
        const token = ((_a = headers["authorization"]) === null || _a === void 0 ? void 0 : _a.split(" ")[1]) || "";
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
        const dbClient = yield MongoDbClient.getClient();
        const collection = dbClient.db("yugioh").collection("users");
        const existingUser = yield collection.findOne({
            email: formattedEmail,
        });
        if (!existingUser) {
            return res.send({ validJwt: false });
        }
        if (existingUser.id_token !== token) {
            return res.send({ validJwt: false });
        }
        return res.send({ validJwt: true });
    }
    catch (error) {
        console.error("Invalid JWT", error);
        return res.status(400).send({ validJwt: false, error: "Invalid JWT" });
    }
}));
app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});
//# sourceMappingURL=app.js.map