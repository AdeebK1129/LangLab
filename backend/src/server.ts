import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./firebase";

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// ←–– your new Hello World endpoint
app.get("/api/hello", (_req, res) => {
    res.json({ message: "Hello, world!" });
  });
  
  app.listen(port, () => {
    console.log(`🚀 Backend listening on http://localhost:${port}`);
  });