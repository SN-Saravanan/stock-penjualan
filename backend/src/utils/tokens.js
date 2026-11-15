const { createHmac } = require("node:crypto");
const jwt = require("jsonwebtoken");

// Changes even when two password updates fall within the same timestamp second.
const credentialVersion = (passwordHash) =>
  createHmac("sha256", process.env.JWT_SECRET).update(passwordHash).digest("hex");

const generateToken = (user) => jwt.sign({
  id: user.id,
  email: user.email,
  role: user.role,
  credentialVersion: credentialVersion(user.password),
}, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  algorithm: "HS256",
});

module.exports = { credentialVersion, generateToken };
