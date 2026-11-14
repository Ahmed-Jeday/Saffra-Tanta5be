// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ISemaphore} from "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";

contract Voting {
    ISemaphore public semaphore;
    uint256 public groupId;

    address public admin;
    address public registrar;

    uint256 public startTime;
    uint256 public endTime;

    string public title;
    string[] public candidates;

    mapping(uint256 => uint256) public votes;

    event VoterRegistered(uint256 identityCommitment);
    event VoteEmis(uint256 indexed nullifier, uint256 candidateId);

    error BadPeriod();
    error NotRegistrar();
    error RegistrationClosed();
    error ElectionNotOpen();
    error InvalidCandidate();
    error MessageMismatch();
    error WrongScope();

    modifier onlyRegistrar() {
        if (msg.sender != registrar) revert NotRegistrar();
        _;
    }

    constructor(
        address _semaphore,
        string memory _title,
        string[] memory _candidates,
        uint256 _startTime,
        uint256 _endTime,
        address _registrar
    ) {
        if (_endTime <= _startTime) revert BadPeriod();

        semaphore = ISemaphore(_semaphore);
        groupId = semaphore.createGroup();

        title = _title;
        candidates = _candidates;
        startTime = _startTime;
        endTime = _endTime;
        registrar = _registrar;
        admin = msg.sender;
    }

    function registerVoter(uint256 commitment) external onlyRegistrar {
        if (block.timestamp >= startTime) revert RegistrationClosed();
        semaphore.addMember(groupId, commitment);
        emit VoterRegistered(commitment);
    }

    function vote(uint256 candidateId, ISemaphore.SemaphoreProof calldata proof) external {
        if (block.timestamp < startTime || block.timestamp > endTime) revert ElectionNotOpen();
        if (candidateId >= candidates.length) revert InvalidCandidate();
        if (proof.message != candidateId) revert MessageMismatch();
        if (proof.scope != groupId) revert WrongScope();

        semaphore.validateProof(groupId, proof);

        votes[candidateId] += 1;
        emit VoteEmis(proof.nullifier, candidateId);
    }

    function getCandidates() external view returns (string[] memory) {
        return candidates;
    }

    function getVotes(uint256 candidateId) external view returns (uint256) {
        if (candidateId >= candidates.length) revert InvalidCandidate();
        return votes[candidateId];
    }

    function candidatesCount() external view returns (uint256) {
        return candidates.length;
    }
}
