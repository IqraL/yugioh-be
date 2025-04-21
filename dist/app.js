var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
import { staticValuesRouter } from "./routes";
import { levels, allRaces, attributes, types, sortingValues, archetypes, } from "./values";
const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded());
app.get("/", (req, res) => {
    res.send("hello world");
});
app.use(staticValuesRouter);
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
        console.log("Query String:", queryString);
        const response = yield axios.get(`https://db.ygoprodeck.com/api/v7/cardinfo.php?${queryString}`);
        res.send(response.data);
    }
    catch (error) {
        res.send({
            error: `No data found for this search`,
        });
    }
}));
app.post("/add-owned-card", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cardId } = req.body;
        if (!cardId) {
            return res.status(400).send({ error: "Card ID is required" });
        }
        res.send({ success: true });
    }
    catch (error) {
        console.error("Error adding owned card:", error);
        res.status(500).send({ error: "Failed to add owned card" });
    }
}));
app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});
//# sourceMappingURL=app.js.map