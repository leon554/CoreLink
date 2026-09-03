const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

mongoose.connect(process.env.MONGO_URI);

app.use("/auth", authRoutes);
app.use("/api", userRoutes);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;