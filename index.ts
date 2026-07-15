import express from "express";
import cors from "cors";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test Route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Salesforce Jobs API Running 🚀"
    });
});



export default app;