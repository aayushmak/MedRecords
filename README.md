# Patient-Centered Medical Records Management System

A blockchain-integrated web app for patients to upload, manage, and control
access to their medical records. Files are stored off-chain; the blockchain
stores each file's hash, ownership, and access permissions.

Simple, flat blue-and-white interface — no gradients.

## How it fits together

```
medrecords-dapp/
├── blockchain/    Solidity smart contract + Hardhat project
├── backend/       Express + MongoDB API (users, files, access requests)
└── frontend/      React + Tailwind UI (patient / doctor / admin)
```

- **Files** live on the backend's disk (`backend/uploads/`), referenced in MongoDB.
- **Proof of ownership** lives on-chain: `addRecord()` stores a hash of the
  file plus the uploading wallet address and timestamp.
- **Access control** is enforced twice, on purpose: on-chain via
  `requestAccess` / `grantAccess` / `revokeAccess` (source of truth, tamper-proof),
  and mirrored in MongoDB (`AccessRequest`) so the backend can gate file
  downloads without re-querying the chain on every request.
- The **frontend talks to the smart contract directly through MetaMask** —
  the patient's or doctor's own wallet signs every blockchain transaction.
  The backend never holds a private key.

## Prerequisites

- Node.js 18+
- MongoDB running locally (or a connection string to a hosted instance)
- [MetaMask](https://metamask.io) browser extension

## 1. Run a local blockchain and deploy the contract

```bash
cd blockchain
npm install
npx hardhat node          # keep this running — it's your local chain
```

In a second terminal:

```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

This prints the deployed contract address and writes
`blockchain/deployed/MedicalRecords.json` (address + ABI).

**Import a test account into MetaMask:** `hardhat node` prints 20 funded
accounts with private keys — import two of them (one for a "patient", one
for a "doctor") into MetaMask, and add a custom network:

- Network name: `Hardhat Local`
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency symbol: `ETH`

## 2. Start the backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
- `MONGO_URI` — your MongoDB connection string
- `JWT_SECRET` — any long random string

```bash
npm run dev
```

The API runs on `http://localhost:5000`.

## 3. Start the frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env` and paste the contract address from step 1 into
`REACT_APP_CONTRACT_ADDRESS`.

```bash
npm start
```

The app opens at `http://localhost:3000`.

## Using the app

1. **Register** as a patient (or a doctor) — connect MetaMask, sign the
   login message, fill in name/email/role.
2. As the **patient**, upload a record: choose a file, confirm the
   MetaMask transaction (this calls `addRecord` on-chain), and the file
   uploads to the backend once the transaction confirms.
3. Switch MetaMask to the **doctor** account, register as a doctor, and go
   to *Request patient access* — paste the patient's wallet address.
4. Switch back to the **patient** account, open *Access requests*, and
   **Approve** the doctor (signs `grantAccess` on-chain).
5. Switch to the **doctor** account — the patient now appears under
   *Approved patients*; click through to view and download their records.
6. The patient can **Revoke** access at any time from *Access requests*.

## Notes on the two hashes

- **On-chain hash**: `keccak256` of the file bytes, computed in the browser
  and written to the smart contract as the tamper-evident proof.
- **Off-chain hash**: `SHA-256` of the same file, computed by the backend
  on upload and stored in MongoDB for quick integrity checks without a
  wallet connection.

They're independent by design — either one alone is enough to prove a file
hasn't been altered since upload.

## Smart contract functions

| Function | Caller | Purpose |
|---|---|---|
| `addRecord(hash, fileName)` | Patient | Anchor a new record's hash on-chain |
| `requestAccess(patient)` | Doctor | Request permission to view a patient's records |
| `grantAccess(requestId)` | Patient | Approve a pending request |
| `rejectAccess(requestId)` | Patient | Decline a pending request |
| `revokeAccess(doctor)` | Patient | Revoke previously granted access |
| `checkAccess(patient, doctor)` | Anyone (view) | Check current permission status |

Run the test suite (needs internet access to fetch the Solidity compiler
the first time):

```bash
cd blockchain
npx hardhat test
```

## Troubleshooting

- **"Contract address is not configured"** — you skipped pasting the address
  into `frontend/.env`, or forgot to restart `npm start` after editing it.
- **MetaMask stuck on "Waiting for confirmation"** — make sure MetaMask is
  connected to the `Hardhat Local` network, not Ethereum Mainnet.
- **"Wallet not registered"** on login — register first, or switch MetaMask
  to the account you registered with.
- **Uploads fail with a 500** — confirm MongoDB is running and reachable at
  the `MONGO_URI` in `backend/.env`.
