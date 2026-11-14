import { network } from "hardhat";

const { viem } = await network.create({ network: "localhost" });

const poseidon = await viem.deployContract("PoseidonT3");
console.log("PoseidonT3 deployed at:", poseidon.address);

const verifier = await viem.deployContract("SemaphoreVerifier");
console.log("SemaphoreVerifier deployed at:", verifier.address);

const semaphore = await viem.deployContract("Semaphore", [verifier.address], {
  libraries: {
    PoseidonT3: poseidon.address,
  },
});
console.log("Semaphore deployed at:", semaphore.address);
