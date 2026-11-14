import React, { useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  KeyRound,
  Loader2,
  Lock,
  Radio,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Upload,
  UserCheck,
  Vote,
  Wallet,
} from "lucide-react";
import { useVoting } from "../context/VotingContext";
import {
  buildSemaphoreVoteProof,
  createRandomLocalIdentity,
  deriveIdentityFromWalletSignature,
  restoreIdentityFromBackup,
} from "../services/semaphoreService";
import type { ElectionPhase, SemaphoreProofPayload } from "../types/voting";

const PHASE_LABELS: Record<ElectionPhase, string> = {
  registration: "Phase d'inscription ouverte",
  voting: "Scrutin ouvert — Votes en cours",
  closed: "Élection clôturée",
};

export function ElectionsPage() {
  const {
    elections,
    activeElectionId,
    setActiveElectionId,
    activeElection,
    session,
    openAuthModal,
    identitiesByElection,
    setElectionIdentity,
    getEligibility,
    registerCommitment,
    castVote,
    relayerOnline,
    receiptsByElection,
    navigate,
  } = useVoting();

  const [identityMode, setIdentityMode] = useState<"deterministic" | "random">(
    "deterministic"
  );
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [useDirectFallback, setUseDirectFallback] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [proofStep, setProofStep] = useState<{ label: string; percent: number } | null>(
    null
  );
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState("");
  const [lastProof, setLastProof] = useState<SemaphoreProofPayload | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const eligibility = getEligibility(activeElection.id);
  const localIdentity = identitiesByElection[activeElection.id] || null;
  const receipt = receiptsByElection[activeElection.id] || null;
  const isMemberInTree = localIdentity
    ? activeElection.members.includes(localIdentity.commitment)
    : false;

  async function handleGenerateIdentity() {
    if (!session) return;
    setFeedbackError("");
    setFeedbackSuccess("");
    setIsBusy(true);
    try {
      const id =
        identityMode === "deterministic"
          ? await deriveIdentityFromWalletSignature(
              session.privateKeyHex,
              activeElection.id
            )
          : createRandomLocalIdentity();
      setElectionIdentity(activeElection.id, id);
      setFeedbackSuccess(
        identityMode === "deterministic"
          ? "Identité Semaphore v4 dérivée depuis votre signature privée Web3Auth."
          : "Identité aléatoire générée localement. Pensez à télécharger votre sauvegarde JSON."
      );
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : "Erreur génération identité");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRegisterCommitment() {
    if (!localIdentity) return;
    setFeedbackError("");
    setFeedbackSuccess("");
    setIsBusy(true);
    try {
      const res = await registerCommitment(
        activeElection.id,
        localIdentity.commitment
      );
      setFeedbackSuccess(
        res.flushed
          ? "Commitment validé et ajouté à l'arbre de Merkle on-chain (lot mélangé sans lien avec votre compte)."
          : `Commitment mis en file d'attente pour le prochain lot mélangé (${res.queuedCount} en attente).`
      );
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : "Erreur d'inscription");
    } finally {
      setIsBusy(false);
    }
  }

  function handleDownloadBackup() {
    if (!localIdentity) return;
    const payload = JSON.stringify(
      {
        platform: "Saffra",
        electionId: activeElection.id,
        commitment: localIdentity.commitment,
        exportedSecret: localIdentity.exportedSecret,
        createdAt: new Date().toISOString(),
      },
      null,
      2
    );
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `saffra-identite-scrutin-${activeElection.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleImportBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed.exportedSecret) {
          throw new Error("Fichier de sauvegarde invalide.");
        }
        const restored = restoreIdentityFromBackup(parsed.exportedSecret);
        setElectionIdentity(activeElection.id, restored);
        setFeedbackError("");
        setFeedbackSuccess("Identité Semaphore restaurée depuis la sauvegarde locale.");
      } catch (err) {
        setFeedbackError(
          err instanceof Error ? err.message : "Impossible de lire le fichier JSON."
        );
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleCastVote(candidateOverride?: number) {
    const candId = candidateOverride !== undefined ? candidateOverride : selectedCandidate;
    if (candId === null || !localIdentity) return;

    setFeedbackError("");
    setFeedbackSuccess("");
    setIsBusy(true);

    try {
      const proof = await buildSemaphoreVoteProof({
        identity: localIdentity,
        groupMembers: activeElection.members,
        candidateId: candId,
        groupId: activeElection.groupId,
        onStep: (label, percent) => setProofStep({ label, percent }),
      });

      setLastProof(proof);
      setProofStep({
        label: useDirectFallback
          ? "Soumission directe on-chain depuis votre wallet financé..."
          : "Soumission anonyme via le Relayer Saffra...",
        percent: 96,
      });

      await castVote({
        electionId: activeElection.id,
        candidateId: candId,
        proof,
        viaRelayer: !useDirectFallback,
      });

      setFeedbackSuccess("Votre vote anonyme a été comptabilisé sur la blockchain.");
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : "Erreur lors du vote");
    } finally {
      setIsBusy(false);
      setProofStep(null);
    }
  }

  return (
    <div className="max-w-[1240px] mx-auto px-5 md:px-8 py-10 space-y-7">
      {/* Election Selector Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#171717]">
            Espace Élections & Vote Anonyme
          </h1>
          <p className="text-sm text-[#77736B] mt-1">
            Authentification Web3Auth, création d'identité locale Semaphore et vote sans trace wallet.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-white border border-[#171717]/10">
          {elections.map((el) => (
            <button
              key={el.id}
              type="button"
              onClick={() => {
                setActiveElectionId(el.id);
                setSelectedCandidate(null);
                setFeedbackError("");
                setFeedbackSuccess("");
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                el.id === activeElection.id
                  ? "bg-[#FFC928] text-[#171717]"
                  : "text-[#77736B] hover:text-[#171717]"
              }`}
            >
              {el.title.length > 30 ? `${el.title.slice(0, 30)}...` : el.title}
            </button>
          ))}
        </div>
      </div>

      {/* Active Election Summary Banner */}
      <div className="saffra-card p-6 sm:p-8 bg-gradient-to-br from-white to-[#FFF6DA]/70">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#77736B]">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#171717]">
                <Radio size={14} className="text-[#E8AD00]" />
                {PHASE_LABELS[activeElection.phase]}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">
                Group ID (scope): {activeElection.groupId}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">
                Contrat: {activeElection.contractAddress.slice(0, 10)}...
                {activeElection.contractAddress.slice(-6)}
              </span>
            </div>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-[#171717]">
              {activeElection.title}
            </h2>
            <p className="text-sm text-[#77736B] leading-relaxed">
              {activeElection.description}
            </p>
          </div>

          <div className="flex sm:flex-row lg:flex-col gap-5 lg:text-right shrink-0 border-t lg:border-t-0 lg:border-l border-[#171717]/10 pt-4 lg:pt-0 lg:pl-6">
            <div>
              <div className="text-xs text-[#77736B]">Membres Semaphore inscrits</div>
              <div className="font-heading text-xl font-bold text-[#171717] tabular-nums">
                {activeElection.members.length} / {activeElection.eligibleCount}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#77736B]">Bulletins validés</div>
              <div className="font-heading text-xl font-bold text-[#171717] tabular-nums">
                {activeElection.votes.reduce((a, b) => a + b, 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Feedback Messages */}
      {feedbackError && (
        <div
          role="alert"
          className="rounded-[18px] bg-red-50 border border-red-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-red-800"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={19} className="shrink-0 mt-0.5 text-red-600" />
            <span>{feedbackError}</span>
          </div>
          {!relayerOnline && lastProof && !useDirectFallback && (
            <button
              type="button"
              onClick={() => {
                setUseDirectFallback(true);
                setFeedbackError("");
              }}
              className="px-4 py-2 rounded-full bg-[#171717] text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
            >
              Activer le Fallback Direct
            </button>
          )}
        </div>
      )}

      {feedbackSuccess && (
        <div
          role="status"
          className="rounded-[18px] bg-emerald-50 border border-emerald-200 px-5 py-4 flex items-center gap-3 text-sm text-emerald-900"
        >
          <CheckCircle2 size={19} className="shrink-0 text-emerald-700" />
          <span>{feedbackSuccess}</span>
        </div>
      )}

      {/* PHASE 1: Web3Auth & Eligibility */}
      <section className="saffra-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-xs font-bold text-[#E8AD00] tracking-wide">
              Phase 01 · Authentification & Éligibilité
            </span>
            <h3 className="font-heading text-lg font-bold text-[#171717] mt-0.5">
              Connexion universitaire via Web3Auth
            </h3>
          </div>

          {session && (
            <button
              type="button"
              onClick={openAuthModal}
              className="text-xs font-semibold text-[#77736B] hover:text-[#171717] underline cursor-pointer"
            >
              Changer de compte étudiant
            </button>
          )}
        </div>

        {!session ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#FFF9ED] border border-[#171717]/8">
            <p className="text-sm text-[#77736B] max-w-xl">
              Connectez-vous avec votre compte Google universitaire ou votre
              adresse email. Web3Auth génère automatiquement votre wallet sans
              rien installer.
            </p>
            <button
              type="button"
              onClick={openAuthModal}
              className="saffra-btn-primary px-6 py-3 text-sm inline-flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Wallet size={17} />
              <span>Se connecter avec Web3Auth</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl bg-[#FFF9ED] border border-[#171717]/8">
            <div>
              <div className="text-xs text-[#77736B]">Étudiant connecté</div>
              <div className="font-semibold text-sm text-[#171717] mt-0.5">
                {session.fullName}
              </div>
              <div className="text-xs text-[#77736B]">{session.email}</div>
            </div>

            <div>
              <div className="text-xs text-[#77736B]">Signer Web3Auth (public)</div>
              <div className="font-mono-tabular text-xs text-[#171717] mt-1 break-all">
                {session.address}
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="text-xs text-[#77736B] mb-1">Statut liste électorale</div>
              {eligibility === "eligible" && (
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800">
                  <UserCheck size={17} />
                  <span>Éligible (non encore inscrit)</span>
                </div>
              )}
              {eligibility === "already_registered" && (
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#171717]">
                  <CheckCircle2 size={17} className="text-emerald-700" />
                  <span>Éligible · Commitment déjà enregistré</span>
                </div>
              )}
              {eligibility === "not_on_list" && (
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-red-700">
                  <ShieldAlert size={17} />
                  <span>Non inscrit sur la liste officielle</span>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* PHASE 2: Client-side Semaphore Identity & Registration */}
      {session && eligibility !== "not_on_list" && (
        <section className="saffra-card p-6 sm:p-8">
          <div className="mb-5">
            <span className="text-xs font-bold text-[#E8AD00] tracking-wide">
              Phase 02 · Identité Anonyme (Navigateur Uniquement)
            </span>
            <h3 className="font-heading text-lg font-bold text-[#171717] mt-0.5">
              Création et récupération de votre identité Semaphore v4
            </h3>
            <p className="text-sm text-[#77736B] mt-1 max-w-3xl leading-relaxed">
              Votre secret est créé localement dans ce navigateur et ne quitte
              jamais votre appareil. Seul l'<em>identity commitment</em> public
              est transmis au backend pour intégration dans l'arbre de Merkle en
              lots mélangés.
            </p>
          </div>

          {!localIdentity ? (
            <div className="space-y-4">
              <div className="inline-flex p-1 rounded-xl bg-[#FFF9ED] border border-[#171717]/10 gap-1">
                <button
                  type="button"
                  onClick={() => setIdentityMode("deterministic")}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    identityMode === "deterministic"
                      ? "bg-white text-[#171717] shadow-xs"
                      : "text-[#77736B] hover:text-[#171717]"
                  }`}
                >
                  Dérivation par signature wallet (Recommandée)
                </button>
                <button
                  type="button"
                  onClick={() => setIdentityMode("random")}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    identityMode === "random"
                      ? "bg-white text-[#171717] shadow-xs"
                      : "text-[#77736B] hover:text-[#171717]"
                  }`}
                >
                  Identité aléatoire + Export JSON
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={handleGenerateIdentity}
                  className="saffra-btn-primary px-6 py-3 text-sm inline-flex items-center gap-2 cursor-pointer"
                >
                  {isBusy ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <KeyRound size={17} />
                  )}
                  <span>
                    {eligibility === "already_registered"
                      ? "Récupérer mon identité Semaphore"
                      : "Générer mon identité Semaphore"}
                  </span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-3 rounded-full bg-white border border-[#171717]/15 text-xs font-semibold text-[#171717] hover:bg-[#FFF9ED] inline-flex items-center gap-2 cursor-pointer"
                >
                  <Upload size={15} />
                  <span>Importer une sauvegarde JSON</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#FFF9ED] border border-[#171717]/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#77736B] mb-1">
                    Identity Commitment public ({localIdentity.derivationMode})
                  </div>
                  <code className="font-mono-tabular text-xs text-[#171717] break-all block">
                    {localIdentity.commitment}
                  </code>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className="px-4 py-2 rounded-full bg-white border border-[#171717]/15 text-xs font-semibold text-[#171717] hover:bg-[#FFE7A3]/40 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Sauvegarde JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateIdentity}
                    className="px-4 py-2 rounded-full bg-white border border-[#171717]/15 text-xs font-semibold text-[#77736B] hover:text-[#171717] inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw size={14} />
                    <span>Recalculer</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                {isMemberInTree ? (
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800">
                    <CheckCircle2 size={18} />
                    <span>
                      Présent dans l'arbre de Merkle on-chain (prêt pour la preuve ZK)
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={handleRegisterCommitment}
                      className="saffra-btn-primary px-6 py-3 text-sm inline-flex items-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck size={17} />
                      <span>Inscrire ce commitment dans le groupe Semaphore</span>
                    </button>
                    {activeElection.phase !== "registration" && (
                      <span className="text-xs text-[#77736B]">
                        Note : ce scrutin est en phase de vote ; utilisez l'onglet
                        Admin pour basculer la phase si vous testez une nouvelle
                        inscription.
                      </span>
                    )}
                  </div>
                )}

                {eligibility === "already_registered" && (
                  <button
                    type="button"
                    onClick={handleRegisterCommitment}
                    className="text-xs font-semibold text-[#77736B] hover:text-[#171717] underline cursor-pointer"
                  >
                    Tester le blocage de double inscription
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* PHASE 3: Candidate Selection, ZK Proof & Anonymous Submission */}
      {session && localIdentity && (
        <section className="saffra-card p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold text-[#E8AD00] tracking-wide">
                Phase 03 · Isoloir & Preuve Zero-Knowledge
              </span>
              <h3 className="font-heading text-lg font-bold text-[#171717] mt-0.5">
                {receipt
                  ? "Bulletin enregistré on-chain"
                  : "Sélectionnez votre candidat"}
              </h3>
            </div>

            {!receipt && (
              <div className="inline-flex p-1 rounded-xl bg-[#FFF9ED] border border-[#171717]/10 gap-1">
                <button
                  type="button"
                  onClick={() => setUseDirectFallback(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    !useDirectFallback
                      ? "bg-white text-[#171717] shadow-xs"
                      : "text-[#77736B]"
                  }`}
                >
                  Via Relayer (Recommandé)
                </button>
                <button
                  type="button"
                  onClick={() => setUseDirectFallback(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    useDirectFallback
                      ? "bg-white text-[#171717] shadow-xs"
                      : "text-[#77736B]"
                  }`}
                >
                  Fallback Direct Wallet
                </button>
              </div>
            )}
          </div>

          {!receipt ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                {activeElection.candidates.map((candidate) => {
                  const selected = selectedCandidate === candidate.id;
                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => setSelectedCandidate(candidate.id)}
                      className={`text-left p-6 rounded-[18px] border transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                        selected
                          ? "border-[#FFC928] ring-2 ring-[#FFC928] bg-[#FFFDF5] shadow-[0_10px_26px_rgba(255,201,40,0.22)]"
                          : "border-[#171717]/12 bg-white hover:border-[#171717]/30"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 text-xs text-[#77736B] mb-2">
                          <span>{candidate.department}</span>
                          <span className="font-mono-tabular">
                            #{candidate.id + 1}
                          </span>
                        </div>
                        <h4 className="font-heading text-lg font-bold text-[#171717] mb-2">
                          {candidate.name}
                        </h4>
                        <p className="text-sm text-[#77736B] leading-relaxed">
                          {candidate.program}
                        </p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-[#171717]/8 flex items-center justify-between text-xs font-semibold">
                        <span
                          className={
                            selected ? "text-[#171717]" : "text-[#77736B]"
                          }
                        >
                          {selected ? "Choix sélectionné" : "Choisir cette liste"}
                        </span>
                        <span
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            selected
                              ? "bg-[#FFC928] border-[#171717]"
                              : "border-[#171717]/25"
                          }`}
                        >
                          {selected && (
                            <CheckCircle2 size={13} className="text-[#171717]" />
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {proofStep && (
                <div className="mb-6 p-4 rounded-2xl bg-[#FFF9ED] border border-[#FFC928]/60">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#171717] mb-2">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={15} className="animate-spin" />
                      {proofStep.label}
                    </span>
                    <span className="tabular-nums">{proofStep.percent}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-white overflow-hidden border border-[#171717]/8">
                    <div
                      className="h-full bg-[#FFC928] transition-all duration-300"
                      style={{ width: `${proofStep.percent}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-[#77736B]">
                  <Lock size={15} className="text-[#171717]" />
                  <span>
                    {useDirectFallback
                      ? "Mode Fallback : votre preuve ZK reste anonyme et est soumise directement au contrat."
                      : "Mode Relayer : le relayer paie le gaz et ne peut pas modifier le candidat lié à votre preuve."}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={selectedCandidate === null || isBusy}
                  onClick={() => handleCastVote()}
                  className="saffra-btn-primary px-7 py-3.5 text-sm inline-flex items-center gap-2 cursor-pointer"
                >
                  <Vote size={18} />
                  <span>Générer la preuve ZK et voter</span>
                </button>
              </div>
            </>
          ) : (
            <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={28} className="text-emerald-700 shrink-0" />
                  <div>
                    <h4 className="font-heading text-lg font-bold text-[#171717]">
                      Bulletin validé et comptabilisé
                    </h4>
                    <p className="text-sm text-[#77736B]">
                      Transmis à {receipt.timestamp}{" "}
                      {receipt.viaRelayer
                        ? "via le Relayer (aucun lien avec votre wallet)"
                        : "via Fallback direct"}
                      .
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("results")}
                  className="saffra-btn-primary px-5 py-2.5 text-xs inline-flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <BarChart3 size={15} />
                  <span>Voir le dépouillement en direct</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-white p-4 rounded-xl border border-emerald-200/70">
                <div>
                  <span className="text-[#77736B] block mb-0.5">
                    Transaction Hash
                  </span>
                  <code className="font-mono-tabular text-[#171717] break-all">
                    {receipt.txHash}
                  </code>
                </div>
                <div>
                  <span className="text-[#77736B] block mb-0.5">
                    Nullifier unique (anti-double vote)
                  </span>
                  <code className="font-mono-tabular text-[#171717] break-all">
                    {receipt.nullifier}
                  </code>
                </div>
                <div>
                  <span className="text-[#77736B] block mb-0.5">
                    Merkle Tree Root vérifié
                  </span>
                  <code className="font-mono-tabular text-[#171717] break-all">
                    {receipt.merkleTreeRoot}
                  </code>
                </div>
                <div>
                  <span className="text-[#77736B] block mb-0.5">
                    Scope de l'élection (Group ID)
                  </span>
                  <code className="font-mono-tabular text-[#171717]">
                    {receipt.scope}
                  </code>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <span className="text-xs text-[#77736B]">
                  Audit de sécurité : vérifiez que le contrat rejette toute
                  tentative de second vote avec ce même nullifier.
                </span>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleCastVote(receipt.candidateId)}
                  className="px-4 py-2 rounded-full bg-white border border-[#171717]/15 text-xs font-semibold text-[#171717] hover:bg-[#FFF9ED] cursor-pointer"
                >
                  Tester le rejet d'un double vote
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
