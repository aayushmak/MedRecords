const { ethers } = require("ethers");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { createNonce, getNonce, clearNonce } = require("../utils/nonceStore");

function signToken(user) {
  return jwt.sign(
    { id: user._id, walletAddress: user.walletAddress, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// POST /api/auth/nonce { walletAddress }
async function requestNonce(req, res) {
  const { walletAddress } = req.body;
  if (!walletAddress || !ethers.isAddress(walletAddress)) {
    return res.status(400).json({ message: "Valid walletAddress is required" });
  }
  const nonce = createNonce(walletAddress);
  res.json({ message: nonce });
}

// POST /api/auth/register { walletAddress, signature, name, email, role }
async function register(req, res) {
  try {
    const { walletAddress, signature, name, email, role } = req.body;
    if (!walletAddress || !signature || !name || !email || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!["patient", "doctor", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const message = getNonce(walletAddress);
    if (!message) {
      return res.status(400).json({ message: "No nonce found, request one first" });
    }

    const recovered = ethers.verifyMessage(message, signature);
    if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(401).json({ message: "Signature verification failed" });
    }

    const existing = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Wallet already registered, please log in" });
    }

    const user = await User.create({
      walletAddress: walletAddress.toLowerCase(),
      name,
      email,
      role,
    });

    clearNonce(walletAddress);
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
}

// POST /api/auth/login { walletAddress, signature }
async function login(req, res) {
  try {
    const { walletAddress, signature } = req.body;
    if (!walletAddress || !signature) {
      return res.status(400).json({ message: "walletAddress and signature are required" });
    }

    const message = getNonce(walletAddress);
    if (!message) {
      return res.status(400).json({ message: "No nonce found, request one first" });
    }

    const recovered = ethers.verifyMessage(message, signature);
    if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(401).json({ message: "Signature verification failed" });
    }

    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "Wallet not registered, please register first" });
    }

    clearNonce(walletAddress);
    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
}

// GET /api/auth/me
async function me(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user });
}

module.exports = { requestNonce, register, login, me };
