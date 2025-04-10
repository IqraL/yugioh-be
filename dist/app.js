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
import { levels, allRaces, attributes, types } from "./values";
const app = express();
const port = 3000;
app.use(cors({
    origin: ["http://localhost:8000", "http://localhost:4000"], // Update this to your frontend URL
    credentials: true,
}));
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
app.post("/cards", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fname, type, attribute, race, level, sort, page = 1 } = req.body;
        const params = {
            num: 50,
            fname,
            type,
            attribute,
            race,
            level,
            sort,
            offset: (page - 1) * 50,
        };
        if (type && !types.includes(type)) {
            throw new Error(`Invalid type, please pick from: ${types.join(", ")}`);
        }
        const queryString = Object.entries(params)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => `${key}=${value}`)
            .join("&");
        const response = yield axios.get(`https://db.ygoprodeck.com/api/v7/cardinfo.php?${queryString}`);
        res.send(response.data);
    }
    catch (error) {
        res.send({
            //@ts-ignore
            error: `An error occurred while fetching data. ${error.message}`,
        });
    }
}));
app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});
//# sourceMappingURL=app.js.map