// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MedicalRecords
/// @notice Stores medical record hashes/ownership on-chain and manages
///         patient-controlled, doctor-requested access permissions.
///         The actual files never touch the chain — only their SHA-256
///         hash, the owning wallet address, and a timestamp are stored.
contract MedicalRecords {
    enum RequestStatus {
        None,
        Pending,
        Approved,
        Rejected,
        Revoked
    }

    struct Record {
        bytes32 fileHash;      // SHA-256 hash of the off-chain file
        address owner;         // patient wallet address
        string fileName;       // original file name (for reference only)
        uint256 timestamp;     // block timestamp of upload
        bool exists;
    }

    struct AccessRequest {
        address doctor;
        address patient;
        RequestStatus status;
        uint256 requestedAt;
        uint256 decidedAt;
    }

    // recordId => Record
    mapping(uint256 => Record) public records;
    uint256 public recordCount;

    // patient => list of recordIds they own
    mapping(address => uint256[]) private patientRecords;

    // requestId => AccessRequest
    mapping(uint256 => AccessRequest) public accessRequests;
    uint256 public requestCount;

    // patient => doctor => latest requestId (0 = none)
    mapping(address => mapping(address => uint256)) public latestRequestId;

    // patient => doctor => permission flag (fast lookup for checkAccess)
    mapping(address => mapping(address => bool)) private permission;

    event RecordAdded(uint256 indexed recordId, address indexed owner, bytes32 fileHash, uint256 timestamp);
    event AccessRequested(uint256 indexed requestId, address indexed doctor, address indexed patient, uint256 timestamp);
    event AccessGranted(uint256 indexed requestId, address indexed doctor, address indexed patient, uint256 timestamp);
    event AccessRejected(uint256 indexed requestId, address indexed doctor, address indexed patient, uint256 timestamp);
    event AccessRevoked(address indexed doctor, address indexed patient, uint256 timestamp);

    modifier onlyRecordOwner(uint256 recordId) {
        require(records[recordId].exists, "Record does not exist");
        require(records[recordId].owner == msg.sender, "Not record owner");
        _;
    }

    /// @notice Patient adds a new medical record hash to the chain.
    function addRecord(bytes32 fileHash, string calldata fileName) external returns (uint256) {
        recordCount += 1;
        uint256 recordId = recordCount;

        records[recordId] = Record({
            fileHash: fileHash,
            owner: msg.sender,
            fileName: fileName,
            timestamp: block.timestamp,
            exists: true
        });

        patientRecords[msg.sender].push(recordId);

        emit RecordAdded(recordId, msg.sender, fileHash, block.timestamp);
        return recordId;
    }

    /// @notice Doctor requests access to a patient's records.
    function requestAccess(address patient) external returns (uint256) {
        require(patient != address(0), "Invalid patient address");
        require(patient != msg.sender, "Cannot request access to yourself");

        requestCount += 1;
        uint256 requestId = requestCount;

        accessRequests[requestId] = AccessRequest({
            doctor: msg.sender,
            patient: patient,
            status: RequestStatus.Pending,
            requestedAt: block.timestamp,
            decidedAt: 0
        });

        latestRequestId[patient][msg.sender] = requestId;

        emit AccessRequested(requestId, msg.sender, patient, block.timestamp);
        return requestId;
    }

    /// @notice Patient approves a pending access request.
    function grantAccess(uint256 requestId) external {
        AccessRequest storage req = accessRequests[requestId];
        require(req.status == RequestStatus.Pending, "Request not pending");
        require(req.patient == msg.sender, "Only the patient can grant access");

        req.status = RequestStatus.Approved;
        req.decidedAt = block.timestamp;
        permission[msg.sender][req.doctor] = true;

        emit AccessGranted(requestId, req.doctor, msg.sender, block.timestamp);
    }

    /// @notice Patient rejects a pending access request.
    function rejectAccess(uint256 requestId) external {
        AccessRequest storage req = accessRequests[requestId];
        require(req.status == RequestStatus.Pending, "Request not pending");
        require(req.patient == msg.sender, "Only the patient can reject access");

        req.status = RequestStatus.Rejected;
        req.decidedAt = block.timestamp;

        emit AccessRejected(requestId, req.doctor, msg.sender, block.timestamp);
    }

    /// @notice Patient revokes previously granted access from a doctor.
    function revokeAccess(address doctor) external {
        require(permission[msg.sender][doctor], "No active permission to revoke");
        permission[msg.sender][doctor] = false;

        uint256 requestId = latestRequestId[msg.sender][doctor];
        if (requestId != 0 && accessRequests[requestId].status == RequestStatus.Approved) {
            accessRequests[requestId].status = RequestStatus.Revoked;
            accessRequests[requestId].decidedAt = block.timestamp;
        }

        emit AccessRevoked(doctor, msg.sender, block.timestamp);
    }

    /// @notice Check whether a doctor currently has access to a patient's records.
    function checkAccess(address patient, address doctor) public view returns (bool) {
        return permission[patient][doctor];
    }

    /// @notice Get all record IDs owned by a patient.
    function getPatientRecords(address patient) external view returns (uint256[] memory) {
        return patientRecords[patient];
    }

    /// @notice Get a single record's details. Reverts if caller is neither
    ///         the owner nor a doctor with granted access.
    function getRecord(uint256 recordId) external view returns (
        bytes32 fileHash,
        address owner,
        string memory fileName,
        uint256 timestamp
    ) {
        Record memory r = records[recordId];
        require(r.exists, "Record does not exist");
        require(
            r.owner == msg.sender || checkAccess(r.owner, msg.sender),
            "No permission to view this record"
        );
        return (r.fileHash, r.owner, r.fileName, r.timestamp);
    }
}
