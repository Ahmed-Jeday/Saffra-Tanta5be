import { Identity } from "@semaphore-protocol/identity";
import { ethers } from "ethers";
import type {
  Election,
  EligibilityStatus,
  SemaphoreProofPayload,
  VoteReceipt,
  Web3AuthSession,
} from "../types/voting";

export interface UniversityStudentRecord {
  email: string;
  fullName: string;
  studentId: string;
  eligible: boolean;
}

export const DEMO_UNIVERSITY_STUDENTS: UniversityStudentRecord[] = [
  {
    email: "amina.benali@univ-saffra.edu",
    fullName: "Amina Benali",
    studentId: "ETU-2026-0418",
    eligible: true,
  },
  {
    email: "lucas.moreau@univ-saffra.edu",
    fullName: "Lucas Moreau",
    studentId: "ETU-2026-0892",
    eligible: true,
  },
  {
    email: "sarah.mansour@univ-saffra.edu",
    fullName: "Sarah Mansour",
    studentId: "ETU-2026-1145",
    eligible: true,
  },
  {
    email: "visiteur@externe.org",
    fullName: "Visiteur Externe",
    studentId: "NON-INSCRIT",
    eligible: false,
  },
];

function createSeededCommitments(count: number, prefix: string): string[] {
  return Array.from({ length: count }, (_, index) => {
    const id = new Identity(`${prefix}-student-${index + 1}`);
    return id.commitment.toString();
  });
}

function createInitialElections(): Election[] {
  const now = Math.floor(Date.now() / 1000);
  const seededMembers = createSeededCommitments(14, "delegates-2026");

  return [
    {
      id: "1",
      groupId: "101",
      contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      title: "Élection des Délégués Étudiants 2026",
      description:
        "Scrutin officiel pour élire les représentants des étudiants au conseil de l'université. Chaque étudiant éligible dispose d'une voix anonyme vérifiée par preuve Zero-Knowledge.",
      phase: "voting",
      startTime: now - 7200,
      endTime: now + 86400,
      eligibleCount: 520,
      candidates: [
        {
          id: 0,
          name: "Liste Horizon Campus",
          department: "Sciences & Ingénierie",
          program:
            "Extension des horaires de bibliothèque jusqu'à 23h, création de salles de coworking et transparence budgétaire des associations.",
        },
        {
          id: 1,
          name: "Collectif Avenir Solidaire",
          department: "Droit & Sciences Humaines",
          program:
            "Bourses de mobilité d'urgence, repas étudiants durables et mentorat inter-promotions pour les L1.",
        },
        {
          id: 2,
          name: "Alliance Tech & Culture",
          department: "Informatique & Arts",
          program:
            "Financement de hackathons inter-facultés, studios associatifs équipés et accès libre aux plateformes de recherche.",
        },
      ],
      members: seededMembers,
      queuedCommitments: [],
      votes: [148, 121, 89],
      usedNullifiers: [],
      events: [
        {
          nullifier: "194827561039481726501928374650192837",
          candidateId: 0,
          candidateName: "Liste Horizon Campus",
          txHash: "0x8a3f91b4c2d0e7a159f23d4e8b71209c4f1d2e3a4b5c6d7e8f9a0b1c2d3e4f5a",
          timestamp: "10:42:18",
          viaRelayer: true,
        },
        {
          nullifier: "726150983412098475102938475610293847",
          candidateId: 1,
          candidateName: "Collectif Avenir Solidaire",
          txHash: "0x4c1e82d9a5b3f7012c94e6a3d8f1b204c5e6f7a8b9c0d1e2f3a4b5c6d7e8f9b0",
          timestamp: "10:49:05",
          viaRelayer: true,
        },
        {
          nullifier: "391048572910384756102938475610293847",
          candidateId: 2,
          candidateName: "Alliance Tech & Culture",
          txHash: "0x9d2b74a1f6e8c3059b12a7c4e8d3f601a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
          timestamp: "10:56:41",
          viaRelayer: true,
        },
      ],
    },
    {
      id: "2",
      groupId: "102",
      contractAddress: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
      title: "Bureau des Arts & Associations (BDA)",
      description:
        "Phase d'inscription ouverte : générez votre identité Semaphore locale et enregistrez votre commitment avant l'ouverture de l'urne.",
      phase: "registration",
      startTime: now + 3600,
      endTime: now + 172800,
      eligibleCount: 520,
      candidates: [
        {
          id: 0,
          name: "Collectif Scène Ouverte",
          department: "Arts & Lettres",
          program:
            "Festival annuel sur le grand parvis, ateliers théâtre et subventions pour les clubs musicaux.",
        },
        {
          id: 1,
          name: "Atelier Ciné & Création",
          department: "Médias & Design",
          program:
            "Projections hebdomadaires en amphithéâtre et prêt de matériel photo/vidéo pour tous les étudiants.",
        },
      ],
      members: createSeededCommitments(6, "bda-2026"),
      queuedCommitments: [],
      votes: [0, 0],
      usedNullifiers: [],
      events: [],
    },
  ];
}

export function createInitialPlatformState(): {
  elections: Election[];
  registeredStudentFlags: Record<string, boolean>;
} {
  return {
    elections: createInitialElections(),
    registeredStudentFlags: {},
  };
}

export function authenticateWeb3AuthDemo(
  email: string,
  providerLabel: Web3AuthSession["providerLabel"]
): Web3AuthSession {
  const normalized = email.trim().toLowerCase();
  const known = DEMO_UNIVERSITY_STUDENTS.find((s) => s.email === normalized);
  const derivedPrivateKey = ethers.keccak256(
    ethers.toUtf8Bytes(`saffra-web3auth-hardened:${normalized}`)
  );
  const wallet = new ethers.Wallet(derivedPrivateKey);

  const fallbackName = normalized
    .split("@")[0]
    .split(".")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ""))
    .join(" ");

  return {
    email: normalized,
    fullName: known?.fullName || fallbackName || "Étudiant Université",
    studentId: known?.studentId || "ETU-2026-EXT",
    address: wallet.address,
    idToken: `w3a_${ethers.keccak256(ethers.toUtf8Bytes(normalized)).slice(2, 26)}`,
    providerLabel,
    privateKeyHex: derivedPrivateKey,
  };
}

export function evaluateEligibility(
  email: string,
  electionId: string,
  registeredFlags: Record<string, boolean>
): EligibilityStatus {
  const normalized = email.trim().toLowerCase();
  const record = DEMO_UNIVERSITY_STUDENTS.find((s) => s.email === normalized);

  const isUnivDomain =
    normalized.endsWith("@univ-saffra.edu") ||
    normalized.endsWith(".edu") ||
    Boolean(record?.eligible);

  if (record && !record.eligible) {
    return "not_on_list";
  }

  if (!isUnivDomain) {
    return "not_on_list";
  }

  const flagKey = `${electionId}:${normalized}`;
  if (registeredFlags[flagKey]) {
    return "already_registered";
  }

  return "eligible";
}

export function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createDeterministicReceipt(
  candidateId: number,
  proof: SemaphoreProofPayload,
  viaRelayer: boolean
): VoteReceipt {
  const txHash = ethers.keccak256(
    ethers.solidityPacked(
      ["string", "uint256", "string", "uint256"],
      [proof.nullifier, candidateId, proof.merkleTreeRoot, Date.now()]
    )
  );

  return {
    txHash,
    nullifier: proof.nullifier,
    candidateId,
    merkleTreeRoot: proof.merkleTreeRoot,
    scope: proof.scope,
    viaRelayer,
    timestamp: new Date().toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  };
}
