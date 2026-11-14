import { Group } from "@semaphore-protocol/group";
import { Identity } from "@semaphore-protocol/identity";
import { generateProof, verifyProof } from "@semaphore-protocol/proof";

const [seed, message, scope] = process.argv.slice(2);

if (seed === undefined || message === undefined || scope === undefined) {
  throw new Error("Expected identity seed, message, and scope arguments.");
}

const identity = new Identity(seed);
const group = new Group([identity.commitment]);
const proof = await generateProof(identity, group, message, scope);
const isValid = await verifyProof(proof);

process.stdout.write(
  `${JSON.stringify({ proof, isValid }, (_, value) =>
    typeof value === "bigint" ? value.toString() : value,
  )}\n`,
);
