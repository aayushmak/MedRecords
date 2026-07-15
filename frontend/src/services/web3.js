import { BrowserProvider, Contract, keccak256, toUtf8Bytes } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../contractConfig";

export function isMetaMaskInstalled() {
  return typeof window !== "undefined" && Boolean(window.ethereum);
}

/** Prompts MetaMask to connect and returns the selected wallet address. */
export async function connectWallet() {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed. Install it from metamask.io to continue.");
  }
  const provider = new BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  return accounts[0];
}

/** Asks the connected wallet to sign an arbitrary message (used for login). */
export async function signMessage(message) {
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return signer.signMessage(message);
}

/** Returns a Contract instance connected to the current signer (for sending tx). */
export async function getContract() {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address is not configured. Set REACT_APP_CONTRACT_ADDRESS.");
  }
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

/** Computes a 0x-prefixed keccak256 hash of a File's bytes (client-side). */
export async function hashFile(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  return keccak256(bytes);
}

export function hashString(str) {
  return keccak256(toUtf8Bytes(str));
}
