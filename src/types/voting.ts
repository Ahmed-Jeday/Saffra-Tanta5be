export type ElectionPhase = "registration" | "voting" | "closed";

export type EligibilityStatus = "eligible" | "already_registered" | "not_on_list";

export type PageRoute = "home" | "elections" | "results" | "about" | "admin";

export interface Candidate {
  id: number;
  name: string;
  program: string;
  department: string;
}

export interface VoteEventLog {
  nullifier: string;
  candidateId: number;
  candidateName: string;
  txHash: string;
  timestamp: string;
  viaRelayer: boolean;
}

export interface Election {
  id: string;
  groupId: string;
  contractAddress: string;
  title: string;
  description: string;
  phase: ElectionPhase;
  startTime: number;
  endTime: number;
  eligibleCount: number;
  candidates: Candidate[];
  members: string[];
  queuedCommitments: string[];
  votes: number[];
  usedNullifiers: string[];
  events: VoteEventLog[];
}

export interface Web3AuthSession {
  email: string;
  fullName: string;
  studentId: string;
  address: string;
  idToken: string;
  providerLabel: "Google University SSO" | "Email Universitaire";
  privateKeyHex: string;
}

export interface SemaphoreProofPayload {
  merkleTreeDepth: number;
  merkleTreeRoot: string;
  nullifier: string;
  message: string;
  scope: string;
  points: string[];
}

export interface VoteReceipt {
  txHash: string;
  nullifier: string;
  candidateId: number;
  merkleTreeRoot: string;
  scope: string;
  viaRelayer: boolean;
  timestamp: string;
}
