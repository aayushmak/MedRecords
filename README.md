# Patient-Centered Medical Records Management System

A blockchain-integrated web app for patients to upload, manage, and control
access to their medical records. Files are stored off-chain; the blockchain
stores each file's hash, ownership, and access permissions.

Simple, flat blue-and-white interface — no gradients.

This build runs entirely on a **local Hardhat blockchain** — nothing is
deployed to a public network. Every transaction uses free, fake test ETH,
and the chain resets each time you restart `hardhat node`.

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
- A MongoDB database — either running locally, **or** a free
  [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster
  (recommended if installing MongoDB locally gives you trouble)
- [MetaMask](https://metamask.io) browser extension

## 1. Run a local blockchain and deploy the contract

```bash
cd blockchain
npm install
npx hardhat node          # keep this running — it's your local chain
```

Leave this terminal open for as long as you want to use the app. **Every
time you stop and restart it, the chain resets and you must redeploy the
contract (step below) and get a new contract address.**

In a second terminal:

```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

This prints the deployed contract address and writes
`blockchain/deployed/MedicalRecords.json` (address + ABI). Copy the
address — you'll paste it into `frontend/.env` in step 3.

### Add the local network to MetaMask

MetaMask → network dropdown → **Add a custom network** → fill in:

- Network name: `Hardhat Local`
- Default RPC URL: `http://127.0.0.1:8545` (must include `http://`)
- Chain ID: `31337`
- Currency symbol: `ETH`

MetaMask will show warnings like "network name may not match this chain
ID" — that's expected for a private local network and safe to ignore.
Save, then switch to it.

### Import test accounts — one wallet per role

`hardhat node`'s terminal output lists 20 funded test accounts with
private keys. Import **three separate ones** so you can test all three
roles without mixing them up:

1. MetaMask → account icon → **Add account or hardware wallet** → **Import account**
2. Paste **Account #0**'s private key → rename it "Patient"
3. Repeat with **Account #1** → rename it "Doctor"
4. Repeat with **Account #2** → rename it "Admin"

**Never import a private key from a real wallet holding actual funds —
only use the throwaway accounts Hardhat prints.**

## 2. Start the backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:

```dotenv
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/medrecords
JWT_SECRET=any-long-random-string-here
```

- **`MONGO_URI`** — if you're using Atlas instead of a local install, use
  the connection string from Atlas → **Database → Connect → Drivers**, and
  make sure it includes the database name right after `.net/`, e.g.:
  ```
  MONGO_URI=mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/medrecords?appName=Cluster0
  ```
  If your Atlas password contains special characters (`@ # % /`), either
  URL-encode them or regenerate a plain alphanumeric password — otherwise
  you'll get a `bad auth: authentication failed` error.
- **`PORT`** — on macOS, port `5000` is often already taken by the
  **AirPlay Receiver**, which causes an `EADDRINUSE` error. Either turn
  off AirPlay Receiver (System Settings → General → AirDrop & Handoff),
  or just change this to `PORT=5001` and update
  `frontend/.env`'s `REACT_APP_API_URL` to match.
- **`JWT_SECRET`** — replace the placeholder with any random string.

```bash
npm run dev
```

You should see both `MongoDB connected: ...` and
`Server running on http://localhost:5000` (or `5001`, if you changed it).

## 3. Start the frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env`:

```dotenv
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_CONTRACT_ADDRESS=0xYourDeployedAddressFromStep1
```

Make sure `REACT_APP_API_URL`'s port matches whatever the backend printed
in step 2.

```bash
npm start
```

The app opens at `http://localhost:3000`. **Restart `npm start` any time
you edit `.env`** — React only reads it at startup.

## Using the app — testing all three roles

Because each role is tied to a separate wallet, switching roles means
switching MetaMask's active account **and** logging in again — the app
doesn't auto-detect a MetaMask account switch mid-session.

Each time you switch roles:

1. **Log out** of the app (top right)
2. In MetaMask, switch the active account to the one for the next role
3. Refresh the `localhost:3000` page
4. **Register** (first time) or **log in** — MetaMask will prompt to
   connect and then to sign a message; confirm both

### Full test flow

1. **Patient**: register → go to *Upload record* → pick a file → confirm
   the MetaMask transaction (calls `addRecord` on-chain) → file uploads
   to the backend once the transaction confirms.
2. **Doctor**: log out, switch MetaMask to the Doctor account, register →
   go to *Request patient access* → paste the Patient account's wallet
   address (copy it from MetaMask while that account is active).
3. **Patient**: log out, switch back, log in → go to *Access requests* →
   click **Approve** (signs `grantAccess` on-chain).
4. **Doctor**: log out, switch back, log in → the patient now appears
   under *Approved patients* → click through to view and download their
   records.
5. **Patient**: can **Revoke** access at any time from *Access requests*.
6. **Admin**: log out, switch to the Admin account, register with role =
   Admin → lands on a read-only overview of all users and record/request
   counts.

## MetaMask connection quirks worth knowing

- **MetaMask remembers which account a site is connected to** — switching
  the *active* account in MetaMask does not change which account the site
  already has permission to see. If Connect Wallet keeps handing back the
  wrong account, disconnect the site first: MetaMask → three-dot menu →
  **Connected sites** → find `localhost:3000` → **Disconnect** — then
  switch to the account you want *before* reconnecting.
- **"already pending for origin" error** — MetaMask has a connection
  request queued up from an earlier click. Open the MetaMask extension
  directly, approve or reject whatever popup is waiting, then refresh the
  page and try again.
- **Always check the network shown in any MetaMask popup.** It should say
  **Hardhat Local**, never "Ethereum" / "Ethereum Mainnet." If you ever
  see a transaction popup on a real network, especially one flagged as
  going to a suspicious/malicious address, **reject it** — that means
  MetaMask silently defaulted to mainnet instead of your local test chain,
  which this app should never intentionally do.

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
- **Contract calls fail / revert unexpectedly after restarting your
  computer or terminal** — you likely restarted `hardhat node` at some
  point, which wipes the chain. Redeploy (`npx hardhat run
  scripts/deploy.js --network localhost`), copy the *new* address into
  `frontend/.env`, and restart the frontend.
- **MetaMask stuck on "Waiting for confirmation"** — make sure MetaMask is
  connected to the `Hardhat Local` network, not Ethereum Mainnet, and that
  `npx hardhat node` is still running in its terminal.
- **A MetaMask transaction warns about a malicious/suspicious address, or
  shows "Network: Ethereum" with a real network fee** — reject it. Switch
  MetaMask to Hardhat Local and try again; see "MetaMask connection
  quirks" above.
- **"Wallet not registered"** on login — register first, or switch MetaMask
  to the account you registered with.
- **`EADDRINUSE` when starting the backend** — another process (often
  macOS AirPlay Receiver) is already using that port. See the `PORT` note
  in step 2.
- **`bad auth: authentication failed` from MongoDB** — your Atlas
  username/password in `MONGO_URI` is wrong, or the password contains
  special characters that need URL-encoding. Regenerate a plain
  alphanumeric password in Atlas → Database Access if unsure.
- **Uploads fail with a 500** — confirm MongoDB is running/reachable at
  the `MONGO_URI` in `backend/.env`, and that the backend terminal shows
  `MongoDB connected`.

## Deploying beyond localhost (optional, not required for local testing)

This project can also be deployed to a public testnet like Sepolia so
others can use it without running a local Hardhat node themselves. That
requires: deploying the contract with a funded testnet wallet, updating
`REACT_APP_CONTRACT_ADDRESS` to the new permanent address, hosting the
backend somewhere with persistent file storage (e.g. swapping local disk
uploads for S3 or IPFS), and hosting the frontend on a static host like
Vercel or Netlify. This is a separate, optional step from the local setup
above — ask if you'd like a full walkthrough when you're ready for it.