require("dotenv").config();
const express = require("express");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const SECRET_KEY = process.env.SECRET_KEY;

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "Too many login attempts. Try again later." },
});

const users = [{ email: "user@example.com", password: "securePassword123" }];

app.post("/login", loginLimiter, (req, res) => {
  const { email, password } = req.body;

  if (!email || typeof email !== "string") {
    return "Name is required and should be a string.";
  }
  if (!password || typeof password !== "string") {
    return "Email is required and should be a string.";
  }

  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: "1h" });
  res.json({ success: true, token });
});

module.exports = { app };
