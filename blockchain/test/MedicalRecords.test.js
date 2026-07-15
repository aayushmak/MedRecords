const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MedicalRecords", function () {
  let contract, patient, doctor, other;

  beforeEach(async function () {
    [patient, doctor, other] = await ethers.getSigners();
    const MedicalRecords = await ethers.getContractFactory("MedicalRecords");
    contract = await MedicalRecords.deploy();
    await contract.waitForDeployment();
  });

  it("lets a patient add a record", async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("report-1"));
    await expect(contract.connect(patient).addRecord(hash, "report.pdf"))
      .to.emit(contract, "RecordAdded");

    const ids = await contract.getPatientRecords(patient.address);
    expect(ids.length).to.equal(1);
  });

  it("runs the full request -> grant -> view -> revoke flow", async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("report-1"));
    await contract.connect(patient).addRecord(hash, "report.pdf");

    await expect(contract.connect(doctor).requestAccess(patient.address))
      .to.emit(contract, "AccessRequested");

    expect(await contract.checkAccess(patient.address, doctor.address)).to.equal(false);

    await expect(contract.connect(patient).grantAccess(1))
      .to.emit(contract, "AccessGranted");

    expect(await contract.checkAccess(patient.address, doctor.address)).to.equal(true);

    const record = await contract.connect(doctor).getRecord(1);
    expect(record.fileHash).to.equal(hash);

    await expect(contract.connect(patient).revokeAccess(doctor.address))
      .to.emit(contract, "AccessRevoked");

    expect(await contract.checkAccess(patient.address, doctor.address)).to.equal(false);
  });

  it("blocks a doctor without access from reading a record", async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("report-1"));
    await contract.connect(patient).addRecord(hash, "report.pdf");

    await expect(contract.connect(doctor).getRecord(1)).to.be.revertedWith(
      "No permission to view this record"
    );
  });

  it("blocks a non-patient from granting access", async function () {
    await contract.connect(doctor).requestAccess(patient.address);
    await expect(contract.connect(other).grantAccess(1)).to.be.revertedWith(
      "Only the patient can grant access"
    );
  });
});
