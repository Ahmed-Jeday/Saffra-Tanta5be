# Semaphore v4 anonymous voting

This Hardhat 3 project deploys the Semaphore v4 Poseidon hash library, verifier,
and main contract, then tests anonymous voting with a client-generated ZK proof.
Use Node.js 22.13 or later.

## Install and test

From this directory:

```sh
npm install
npm run build
npm test
```

The test suite creates an identity, adds its commitment to a group, generates
and verifies a Semaphore proof in JavaScript, and submits a valid vote to the
local Hardhat EVM. It also checks registrar permissions, election timing,
candidate/message/scope matching, and nullifier-based double-vote prevention.
The first proof-generation test may download the matching Semaphore circuit
artifacts.

## Deploy to a persistent local node

Run these commands in separate terminals:

```sh
npm run node
```

```sh
npm run deploy:local
```

The deployment script deploys `PoseidonT3`, then `SemaphoreVerifier`, then
`Semaphore` linked against the Poseidon library. It prints each deployed
address. The `localhost` network uses Hardhat's public development account;
never use that key outside a local test chain.

## Voting contract

`contracts/Voting.sol` creates its Semaphore group in the constructor.
Only the configured registrar can add identity commitments, and registration
closes at `startTime`. Votes must fall within the election period and bind the
proof message to a candidate ID and its scope to the election group ID.
Semaphore records each nullifier during proof validation, preventing a second
vote without exposing a voter address.
