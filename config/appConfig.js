const cors = require("cors");
const express = require("express");
require("dotenv").config();

const setupAppConfig = (app) => {
  // CORS
  app.use(
    cors({
      origin: [
        "http://localhost:5173",
        "https://marketing-frontend.onrender.com",
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.options("*", cors());

  // JSON parser
  app.use(express.json());
};

module.exports = setupAppConfig;
