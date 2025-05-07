require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const app = require("./app");

const PORT = process.env.PORT || 2021;

connectDB();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
