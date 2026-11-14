import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import type {
  Election,
  ElectionPhase,
  EligibilityStatus,
  PageRoute,
  SemaphoreProofPayload,
  VoteReceipt,
  Web3AuthSession,
} from "../types/voting";
import type { LocalSemaphoreIdentity } from "../services/semaphoreService";
import { deriveIdentityFromWalletSignature } from "../services/semaphoreService";
import {
  authenticateWeb3AuthDemo,
  createDeterministicReceipt,
  createInitialPlatformState,
  evaluateEligibility,
  shuffleArray,
} from "../services/votingBackend";

interface VotingContextValue {
  route: PageRoute;
  navigate: (next: PageRoute) => void;
  session: Web3AuthSession | null;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  loginWithWeb3Auth: (
    email: string,
    providerLabel: Web3AuthSession["providerLabel"]
  ) => Promise<Web3AuthSession>;
  logout: () => void;
  elections: Election[];
  activeElectionId: string;
  setActiveElectionId: (id: string) => void;
  activeElection: Election;
  identitiesByElection: Record<string, LocalSemaphoreIdentity>;
  setElectionIdentity: (electionId: string, identity: LocalSemaphoreIdentity) => void;
  getEligibility: (electionId: string) => EligibilityStatus | null;
  registerCommitment: (
    electionId: string,
    commitment: string
  ) => Promise<{ queuedCount: number; flushed: boolean }>;
  flushShuffledBatch: (electionId: string) => number;
  castVote: (params: {
    electionId: string;
    candidateId: number;
    proof: SemaphoreProofPayload;
    viaRelayer: boolean;
  }) => Promise<VoteReceipt>;
  relayerOnline: boolean;
  setRelayerOnline: (online: boolean) => void;
  setElectionPhase: (electionId: string, phase: ElectionPhase) => void;
  createElection: (payload: {
    title: string;
    description: string;
    eligibleCount: number;
    candidates: { name: string; department: string; program: string }[];
  }) => Election;
  receiptsByElection: Record<string, VoteReceipt>;
}

const VotingContext = createContext<VotingContextValue | null>(null);

function parseRouteFromHash(): PageRoute {
  const hash = window.location.hash.replace(/^#\/?/, "").toLowerCase();
  if (hash === "elections" || hash === "results" || hash === "about" || hash === "admin") {
    return hash;
  }
  return "home";
}

export function VotingProvider({ children }: { children: React.ReactNode }) {
  const [route, setRoute] = useState<PageRoute>(() => parseRouteFromHash());
  const [session, setSession] = useState<Web3AuthSession | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [initialSeed] = useState(() => createInitialPlatformState());
  const [elections, setElections] = useState<Election[]>(initialSeed.elections);
  const [registeredFlags, setRegisteredFlags] = useState<Record<string, boolean>>(
    initialSeed.registeredStudentFlags
  );
  const [activeElectionId, setActiveElectionId] = useState<string>("1");
  const [identitiesByElection, setIdentitiesByElection] = useState<
    Record<string, LocalSemaphoreIdentity>
  >({});
  const [receiptsByElection, setReceiptsByElection] = useState<
    Record<string, VoteReceipt>
  >({});
  const [relayerOnline, setRelayerOnline] = useState(true);

  // Seed default demo student (amina.benali@univ-saffra.edu) in Election #1
  // so deterministic signature recovery works out of the box during voting phase.
  useEffect(() => {
    let mounted = true;
    async function seedAminaOnElectionOne() {
      const aminaSession = authenticateWeb3AuthDemo(
        "amina.benali@univ-saffra.edu",
        "Google University SSO"
      );
      const aminaId = await deriveIdentityFromWalletSignature(
        aminaSession.privateKeyHex,
        "1"
      );
      if (!mounted) return;
      setElections((prev) =>
        prev.map((el) => {
          if (el.id !== "1") return el;
          if (el.members.includes(aminaId.commitment)) return el;
          return {
            ...el,
            members: [...el.members, aminaId.commitment],
          };
        })
      );
      setRegisteredFlags((prev) => ({
        ...prev,
        "1:amina.benali@univ-saffra.edu": true,
      }));
    }
    seedAminaOnElectionOne();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const onHashChange = () => setRoute(parseRouteFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function navigate(next: PageRoute) {
    setRoute(next);
    window.location.hash = next === "home" ? "/" : `/${next}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function loginWithWeb3Auth(
    email: string,
    providerLabel: Web3AuthSession["providerLabel"]
  ): Promise<Web3AuthSession> {
    await new Promise((resolve) => setTimeout(resolve, 450));
    const nextSession = authenticateWeb3AuthDemo(email, providerLabel);
    setSession(nextSession);
    setIsAuthModalOpen(false);
    return nextSession;
  }

  function logout() {
    setSession(null);
    setIdentitiesByElection({});
  }

  function setElectionIdentity(
    electionId: string,
    identity: LocalSemaphoreIdentity
  ) {
    setIdentitiesByElection((prev) => ({
      ...prev,
      [electionId]: identity,
    }));
  }

  function getEligibility(electionId: string): EligibilityStatus | null {
    if (!session) return null;
    return evaluateEligibility(session.email, electionId, registeredFlags);
  }

  async function registerCommitment(
    electionId: string,
    commitment: string
  ): Promise<{ queuedCount: number; flushed: boolean }> {
    if (!session) {
      throw new Error("Authentification Web3Auth requise.");
    }

    const target = elections.find((e) => e.id === electionId);
    if (!target) throw new Error("Élection introuvable.");

    if (target.phase !== "registration") {
      throw new Error("Revert: Registration closed (le scrutin a déjà démarré).");
    }

    const status = evaluateEligibility(session.email, electionId, registeredFlags);
    if (status === "not_on_list") {
      throw new Error("Étudiant non présent sur la liste électorale universitaire.");
    }
    if (status === "already_registered") {
      throw new Error("Le backend refuse la seconde inscription pour cet étudiant.");
    }

    if (target.members.length + target.queuedCommitments.length >= target.eligibleCount) {
      throw new Error(
        "Nombre maximum de commitments atteint par rapport au registre officiel."
      );
    }

    const flagKey = `${electionId}:${session.email.toLowerCase()}`;
    setRegisteredFlags((prev) => ({ ...prev, [flagKey]: true }));

    // Anti-timing correlation mitigation (§7.1): queue and flush in shuffled batch
    const updatedQueue = [...target.queuedCommitments, commitment];
    const shouldAutoFlush = updatedQueue.length >= 1;
    const flushedMembers = shouldAutoFlush
      ? shuffleArray(updatedQueue)
      : [];

    setElections((prev) =>
      prev.map((el) => {
        if (el.id !== electionId) return el;
        return {
          ...el,
          members: shouldAutoFlush
            ? [...el.members, ...flushedMembers]
            : el.members,
          queuedCommitments: shouldAutoFlush ? [] : updatedQueue,
        };
      })
    );

    return {
      queuedCount: shouldAutoFlush ? 0 : updatedQueue.length,
      flushed: shouldAutoFlush,
    };
  }

  function flushShuffledBatch(electionId: string): number {
    let count = 0;
    setElections((prev) =>
      prev.map((el) => {
        if (el.id !== electionId || el.queuedCommitments.length === 0) return el;
        count = el.queuedCommitments.length;
        return {
          ...el,
          members: [...el.members, ...shuffleArray(el.queuedCommitments)],
          queuedCommitments: [],
        };
      })
    );
    return count;
  }

  async function castVote(params: {
    electionId: string;
    candidateId: number;
    proof: SemaphoreProofPayload;
    viaRelayer: boolean;
  }): Promise<VoteReceipt> {
    const { electionId, candidateId, proof, viaRelayer } = params;
    const target = elections.find((e) => e.id === electionId);
    if (!target) throw new Error("Élection introuvable.");

    if (viaRelayer && !relayerOnline) {
      throw new Error(
        "Relayer temporairement indisponible. Utilisez la soumission directe on-chain (Fallback)."
      );
    }

    if (target.phase !== "voting") {
      throw new Error("Revert: Election not open.");
    }

    if (candidateId < 0 || candidateId >= target.candidates.length) {
      throw new Error("Revert: Invalid candidate.");
    }

    if (proof.message !== candidateId.toString()) {
      throw new Error("Revert: Message mismatch.");
    }

    if (proof.scope !== target.groupId) {
      throw new Error("Revert: Wrong scope.");
    }

    if (target.usedNullifiers.includes(proof.nullifier)) {
      throw new Error(
        "Revert on reused nullifier : un vote a déjà été enregistré avec ce nullifier."
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 550));
    const receipt = createDeterministicReceipt(candidateId, proof, viaRelayer);
    const candidateName =
      target.candidates[candidateId]?.name || `Candidat #${candidateId}`;

    setElections((prev) =>
      prev.map((el) => {
        if (el.id !== electionId) return el;
        const nextVotes = [...el.votes];
        nextVotes[candidateId] = (nextVotes[candidateId] || 0) + 1;
        return {
          ...el,
          votes: nextVotes,
          usedNullifiers: [...el.usedNullifiers, proof.nullifier],
          events: [
            {
              nullifier: proof.nullifier,
              candidateId,
              candidateName,
              txHash: receipt.txHash,
              timestamp: receipt.timestamp,
              viaRelayer,
            },
            ...el.events,
          ],
        };
      })
    );

    setReceiptsByElection((prev) => ({
      ...prev,
      [electionId]: receipt,
    }));

    return receipt;
  }

  function setElectionPhase(electionId: string, phase: ElectionPhase) {
    setElections((prev) =>
      prev.map((el) => (el.id === electionId ? { ...el, phase } : el))
    );
  }

  function createElection(payload: {
    title: string;
    description: string;
    eligibleCount: number;
    candidates: { name: string; department: string; program: string }[];
  }): Election {
    const nextId = String(elections.length + 1);
    const nextGroupId = String(100 + elections.length + 1);
    const contractAddress = ethers.getCreateAddress({
      from: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      nonce: elections.length + 10,
    });
    const now = Math.floor(Date.now() / 1000);

    const created: Election = {
      id: nextId,
      groupId: nextGroupId,
      contractAddress,
      title: payload.title,
      description: payload.description,
      phase: "registration",
      startTime: now + 1800,
      endTime: now + 86400,
      eligibleCount: payload.eligibleCount,
      candidates: payload.candidates.map((c, idx) => ({
        id: idx,
        name: c.name,
        department: c.department,
        program: c.program,
      })),
      members: [],
      queuedCommitments: [],
      votes: payload.candidates.map(() => 0),
      usedNullifiers: [],
      events: [],
    };

    setElections((prev) => [...prev, created]);
    setActiveElectionId(nextId);
    return created;
  }

  const activeElection =
    elections.find((e) => e.id === activeElectionId) || elections[0];

  return (
    <VotingContext.Provider
      value={{
        route,
        navigate,
        session,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        loginWithWeb3Auth,
        logout,
        elections,
        activeElectionId,
        setActiveElectionId,
        activeElection,
        identitiesByElection,
        setElectionIdentity,
        getEligibility,
        registerCommitment,
        flushShuffledBatch,
        castVote,
        relayerOnline,
        setRelayerOnline,
        setElectionPhase,
        createElection,
        receiptsByElection,
      }}
    >
      {children}
    </VotingContext.Provider>
  );
}

export function useVoting() {
  const ctx = useContext(VotingContext);
  if (!ctx) {
    throw new Error("useVoting must be used within VotingProvider");
  }
  return ctx;
}
