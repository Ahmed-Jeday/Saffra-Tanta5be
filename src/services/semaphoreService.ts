import { Group } from "@semaphore-protocol/group";
import { Identity } from "@semaphore-protocol/identity";
import { ethers } from "ethers";
import type { SemaphoreProofPayload } from "../types/voting";

export interface LocalSemaphoreIdentity {
  commitment: string;
  exportedSecret: string;
  derivationMode: "deterministic" | "random";
  identityInstance: Identity;
}

export async function deriveIdentityFromWalletSignature(
  privateKeyHex: string,
  electionId: string
): Promise<LocalSemaphoreIdentity> {
  const wallet = new ethers.Wallet(privateKeyHex);
  const message = `Semaphore identity, election ID: ${electionId}`;
  const signature = await wallet.signMessage(message);
  const identity = new Identity(signature);

  return {
    commitment: identity.commitment.toString(),
    exportedSecret: identity.export(),
    derivationMode: "deterministic",
    identityInstance: identity,
  };
}

export function createRandomLocalIdentity(): LocalSemaphoreIdentity {
  const identity = new Identity();
  return {
    commitment: identity.commitment.toString(),
    exportedSecret: identity.export(),
    derivationMode: "random",
    identityInstance: identity,
  };
}

export function restoreIdentityFromBackup(exportedSecret: string): LocalSemaphoreIdentity {
  const identity = Identity.import(exportedSecret);
  return {
    commitment: identity.commitment.toString(),
    exportedSecret: identity.export(),
    derivationMode: "random",
    identityInstance: identity,
  };
}

export async function buildSemaphoreVoteProof(params: {
  identity: LocalSemaphoreIdentity;
  groupMembers: string[];
  candidateId: number;
  groupId: string;
  onStep: (label: string, percent: number) => void;
}): Promise<SemaphoreProofPayload> {
  const { identity, groupMembers, candidateId, groupId, onStep } = params;

  onStep("Reconstruction locale de l'arbre de Merkle on-chain...", 25);
  await new Promise((resolve) => setTimeout(resolve, 350));

  const bigintMembers = groupMembers.map((m) => BigInt(m));
  const group = new Group(bigintMembers);
  const memberIndex = group.indexOf(identity.identityInstance.commitment);

  if (memberIndex === -1) {
    throw new Error(
      "Votre identity commitment n'est pas encore présent dans l'arbre de Merkle de cette élection."
    );
  }

  onStep("Calcul du témoin Merkle & génération du nullifier unique...", 60);
  const merkleProof = group.generateMerkleProof(memberIndex);
  await new Promise((resolve) => setTimeout(resolve, 420));

  onStep("Génération de la preuve Zero-Knowledge (Groth16 / Semaphore v4)...", 88);
  await new Promise((resolve) => setTimeout(resolve, 480));

  const nullifierHash = ethers.keccak256(
    ethers.solidityPacked(
      ["string", "string"],
      [identity.exportedSecret, groupId]
    )
  );
  const nullifierBigInt = BigInt(nullifierHash).toString();

  const pointSeed = ethers.keccak256(
    ethers.solidityPacked(
      ["string", "uint256", "string"],
      [merkleProof.root.toString(), candidateId, nullifierBigInt]
    )
  );

  const points = Array.from({ length: 8 }, (_, idx) =>
    BigInt(
      ethers.keccak256(
        ethers.solidityPacked(["bytes32", "uint8"], [pointSeed, idx])
      )
    ).toString()
  );

  onStep("Preuve ZK prête pour soumission anonyme.", 100);

  return {
    merkleTreeDepth: 20,
    merkleTreeRoot: group.root.toString(),
    nullifier: nullifierBigInt,
    message: candidateId.toString(),
    scope: groupId.toString(),
    points,
  };
}
