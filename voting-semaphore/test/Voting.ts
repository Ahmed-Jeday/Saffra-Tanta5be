import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

import { Identity } from "@semaphore-protocol/identity";
import { network } from "hardhat";

type GeneratedProof = {
  merkleTreeDepth: number;
  merkleTreeRoot: string;
  nullifier: string;
  message: string;
  scope: string;
  points: string[];
};

type ProofProcessResult = {
  proof: GeneratedProof;
  isValid: boolean;
};

function proofPoints(points: string[]) {
  if (points.length !== 8) {
    throw new Error(`Expected 8 packed proof points, received ${points.length}.`);
  }

  return [
    BigInt(points[0]),
    BigInt(points[1]),
    BigInt(points[2]),
    BigInt(points[3]),
    BigInt(points[4]),
    BigInt(points[5]),
    BigInt(points[6]),
    BigInt(points[7]),
  ] as const;
}

function generateProofInChild(
  seed: string,
  message: bigint,
  scope: bigint,
): Promise<ProofProcessResult> {
  const scriptPath = fileURLToPath(
    new URL("../scripts/generate-semaphore-proof.ts", import.meta.url),
  );
  const child = spawn(
    process.execPath,
    [
      "--import",
      "tsx/esm",
      scriptPath,
      seed,
      message.toString(),
      scope.toString(),
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );

  return new Promise((resolve, reject) => {
    let output = "";
    let errorOutput = "";
    let settled = false;
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      finish(() =>
        reject(
          new Error(
            `Semaphore proof generation timed out. ${errorOutput.trim()}`,
          ),
        ),
      );
    }, 120_000);

    function finish(callback: () => void) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      callback();
    }

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      output += chunk;
      const newline = output.indexOf("\n");
      if (newline === -1) return;

      try {
        const result = JSON.parse(output.slice(0, newline)) as ProofProcessResult;
        finish(() => resolve(result));
        child.kill("SIGTERM");
      } catch (error) {
        finish(() => reject(error));
        child.kill("SIGTERM");
      }
    });
    child.stderr.on("data", (chunk: string) => {
      errorOutput += chunk;
    });
    child.once("error", (error) => finish(() => reject(error)));
    child.once("close", (code, signal) => {
      finish(() =>
        reject(
          new Error(
            errorOutput.trim() ||
              `Semaphore proof process exited with code ${code} and signal ${signal}.`,
          ),
        ),
      );
    });
  });
}

describe("Voting with Semaphore v4", () => {
  it("runs the anonymous voting lifecycle and enforces its guardrails", async (t) => {
    const connection = await network.create();
    t.after(() => connection.close());
    const { viem } = connection;
    const publicClient = await viem.getPublicClient();
    const testClient = await viem.getTestClient();
    const [, registrar, other] = await viem.getWalletClients();

    const identitySeed = "saffra-voting-test-identity";
    const identity = new Identity(identitySeed);

    const poseidon = await viem.deployContract("PoseidonT3");
    const verifier = await viem.deployContract("SemaphoreVerifier");
    const semaphore = await viem.deployContract("Semaphore", [verifier.address], {
      libraries: {
        PoseidonT3: poseidon.address,
      },
    });

    const latestBlock = await publicClient.getBlock();
    const startTime = latestBlock.timestamp + 3600n;
    const endTime = startTime + 3600n;
    const voting = await viem.deployContract("Voting", [
      semaphore.address,
      "Élection des délégués",
      ["Alice", "Bob"],
      startTime,
      endTime,
      registrar.account.address,
    ]);

    const groupId = await voting.read.groupId();
    assert.equal(groupId, 0n);
    assert.deepEqual(await voting.read.getCandidates(), ["Alice", "Bob"]);
    assert.equal(await voting.read.candidatesCount(), 2n);

    await viem.assertions.revertWithCustomError(
      voting.write.registerVoter([identity.commitment], {
        account: other.account,
      }),
      voting,
      "NotRegistrar",
    );
    await voting.write.registerVoter([identity.commitment], {
      account: registrar.account,
    });

    const { proof, isValid } = await generateProofInChild(
      identitySeed,
      0n,
      groupId,
    );
    assert.equal(isValid, true);
    assert.equal(
      await semaphore.read.getMerkleTreeRoot([groupId]),
      BigInt(proof.merkleTreeRoot),
    );

    const contractProof = {
      merkleTreeDepth: BigInt(proof.merkleTreeDepth),
      merkleTreeRoot: BigInt(proof.merkleTreeRoot),
      nullifier: BigInt(proof.nullifier),
      message: BigInt(proof.message),
      scope: BigInt(proof.scope),
      points: proofPoints(proof.points),
    };
    assert.equal(
      await semaphore.read.verifyProof([groupId, contractProof]),
      true,
    );

    await viem.assertions.revertWithCustomError(
      voting.write.vote([0n, contractProof]),
      voting,
      "ElectionNotOpen",
    );

    await testClient.setNextBlockTimestamp({ timestamp: startTime });
    await viem.assertions.revertWithCustomError(
      voting.write.registerVoter([identity.commitment], {
        account: registrar.account,
      }),
      voting,
      "RegistrationClosed",
    );

    const { proof: wrongScopeProof } = await generateProofInChild(
      identitySeed,
      0n,
      999999n,
    );
    const wrongScopeContractProof = {
      merkleTreeDepth: BigInt(wrongScopeProof.merkleTreeDepth),
      merkleTreeRoot: BigInt(wrongScopeProof.merkleTreeRoot),
      nullifier: BigInt(wrongScopeProof.nullifier),
      message: BigInt(wrongScopeProof.message),
      scope: BigInt(wrongScopeProof.scope),
      points: proofPoints(wrongScopeProof.points),
    };
    await testClient.setNextBlockTimestamp({ timestamp: startTime + 1n });
    await viem.assertions.revertWithCustomError(
      voting.write.vote([1n, contractProof]),
      voting,
      "MessageMismatch",
    );
    await viem.assertions.revertWithCustomError(
      voting.write.vote([0n, wrongScopeContractProof]),
      voting,
      "WrongScope",
    );
    await viem.assertions.revertWithCustomError(
      voting.write.vote([2n, contractProof]),
      voting,
      "InvalidCandidate",
    );

    const voteHash = await voting.write.vote([0n, contractProof]);
    const voteReceipt = await publicClient.waitForTransactionReceipt({
      hash: voteHash,
    });
    const voteEvents = await publicClient.getContractEvents({
      address: voting.address,
      abi: voting.abi,
      eventName: "VoteEmis",
      fromBlock: voteReceipt.blockNumber,
      toBlock: voteReceipt.blockNumber,
      strict: true,
    });
    assert.equal(voteEvents.length, 1);
    assert.equal(voteEvents[0].args.nullifier, contractProof.nullifier);
    assert.equal(voteEvents[0].args.candidateId, 0n);
    assert.equal(await voting.read.getVotes([0n]), 1n);

    await viem.assertions.revertWithCustomError(
      voting.write.vote([0n, contractProof]),
      semaphore,
      "Semaphore__YouAreUsingTheSameNullifierTwice",
    );

    await testClient.setNextBlockTimestamp({ timestamp: endTime + 1n });
    await viem.assertions.revertWithCustomError(
      voting.write.vote([0n, contractProof]),
      voting,
      "ElectionNotOpen",
    );

  });
});
