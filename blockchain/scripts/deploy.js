const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const MedicalRecords = await hre.ethers.getContractFactory("MedicalRecords");
  const contract = await MedicalRecords.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("MedicalRecords deployed to:", address);

  // Write address + ABI to a shared location so backend and frontend can pick it up.
  const artifact = await hre.artifacts.readArtifact("MedicalRecords");
  const output = {
    address,
    abi: artifact.abi,
  };

  const outDir = path.join(__dirname, "..", "deployed");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  fs.writeFileSync(
    path.join(outDir, "MedicalRecords.json"),
    JSON.stringify(output, null, 2)
  );

  console.log("Contract address + ABI written to blockchain/deployed/MedicalRecords.json");
  console.log("Copy this file's contents into backend/.env (CONTRACT_ADDRESS)");
  console.log("and into frontend/src/contractConfig.js");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
