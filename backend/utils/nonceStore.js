// In-memory nonce store for wallet-signature login (MVP scope).
// A nonce is generated per wallet address, the user signs a message
// containing it in MetaMask, and the backend verifies the signature
// recovers the same address before issuing a JWT.
const nonces = new Map();

function createNonce(walletAddress) {
  const nonce = `Sign this message to log in to Patient-Centered Medical Records.\n\nWallet: ${walletAddress}\nNonce: ${Math.floor(
    Math.random() * 1e9
  )}-${Date.now()}`;
  nonces.set(walletAddress.toLowerCase(), nonce);
  return nonce;
}

function getNonce(walletAddress) {
  return nonces.get(walletAddress.toLowerCase());
}

function clearNonce(walletAddress) {
  nonces.delete(walletAddress.toLowerCase());
}

module.exports = { createNonce, getNonce, clearNonce };
