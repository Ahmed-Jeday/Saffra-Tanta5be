import React, { useState } from "react";
import {
  CheckCircle2,
  PlusCircle,
  Radio,
  Server,
  ShieldCheck,
  Sliders,
} from "lucide-react";
import { useVoting } from "../context/VotingContext";
import type { ElectionPhase } from "../types/voting";

const TESTING_PLAN_CASES = [
  {
    test: "Inscription après startTime",
    expected: "Revert: Registration closed",
  },
  {
    test: "Non-registrar appelle registerVoter",
    expected: "Revert: Not registrar",
  },
  {
    test: "Vote avant startTime ou après endTime",
    expected: "Revert: Election not open",
  },
  {
    test: "Preuve valide d'un membre inscrit",
    expected: "+1 voix, VoteEmis émis avec le nullifier",
  },
  {
    test: "Même identité tente de voter deux fois",
    expected: "Revert on reused nullifier",
  },
  {
    test: "Preuve d'un non-membre",
    expected: "Revert: invalid proof",
  },
  {
    test: "Candidat modifié après génération de preuve",
    expected: "Revert: Message mismatch",
  },
  {
    test: "Preuve générée pour un autre scope d'élection",
    expected: "Revert: Wrong scope",
  },
];

export function AdminPage() {
  const {
    elections,
    activeElection,
    setActiveElectionId,
    setElectionPhase,
    relayerOnline,
    setRelayerOnline,
    createElection,
    navigate,
  } = useVoting();

  const [title, setTitle] = useState("Référendum Campus Numérique 2026");
  const [description, setDescription] = useState(
    "Consultation étudiante sur le déploiement des bornes solaires et des espaces d'étude ouverts le week-end."
  );
  const [eligibleCount, setEligibleCount] = useState(520);
  const [candidatesInput, setCandidatesInput] = useState(
    "Pour le déploiement prioritaire | Conseil Vie Étudiante | Mise en service dès le semestre de printemps.\nDéploiement progressif par faculté | Commission Finances | Évaluation budgétaire après phase pilote."
  );
  const [createdBanner, setCreatedBanner] = useState("");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const parsedCandidates = candidatesInput
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, department, program] = line.split("|").map((p) => p.trim());
        return {
          name: name || "Liste Candidate",
          department: department || "Université Saffra",
          program: program || "Programme officiel enregistré on-chain.",
        };
      });

    if (parsedCandidates.length < 2) return;

    const created = createElection({
      title,
      description,
      eligibleCount: Number(eligibleCount) || 100,
      candidates: parsedCandidates,
    });

    setCreatedBanner(
      `Élection « ${created.title} » déployée (contrat ${created.contractAddress}, Group ID ${created.groupId}).`
    );
  }

  return (
    <div className="max-w-[1240px] mx-auto px-5 md:px-8 py-10 space-y-8">
      <div>
        <p className="text-xs font-semibold text-[#77736B] mb-1.5">
          Administration & Simulation Hardhat (Chain ID 31337)
        </p>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#171717]">
          Tableau de Bord Administrateur
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* Create Election Form */}
        <form
          onSubmit={handleCreate}
          className="lg:col-span-7 saffra-card p-6 sm:p-8 space-y-5"
        >
          <div className="flex items-center gap-2.5">
            <PlusCircle size={20} className="text-[#E8AD00]" />
            <h2 className="font-heading text-xl font-bold text-[#171717]">
              Déployer une nouvelle élection
            </h2>
          </div>

          <div>
            <label
              htmlFor="admin-title"
              className="block text-sm font-semibold text-[#171717] mb-1.5"
            >
              Titre du scrutin
            </label>
            <input
              id="admin-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#171717]/15 bg-white text-sm focus:outline-2 focus:outline-[#FFC928]"
            />
          </div>

          <div>
            <label
              htmlFor="admin-desc"
              className="block text-sm font-semibold text-[#171717] mb-1.5"
            >
              Description officielle
            </label>
            <textarea
              id="admin-desc"
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#171717]/15 bg-white text-sm focus:outline-2 focus:outline-[#FFC928]"
            />
          </div>

          <div>
            <label
              htmlFor="admin-eligible"
              className="block text-sm font-semibold text-[#171717] mb-1.5"
            >
              Nombre d'étudiants éligibles publiés (audit anti-bourrage)
            </label>
            <input
              id="admin-eligible"
              type="number"
              min={10}
              required
              value={eligibleCount}
              onChange={(e) => setEligibleCount(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-[#171717]/15 bg-white text-sm font-mono-tabular focus:outline-2 focus:outline-[#FFC928]"
            />
          </div>

          <div>
            <label
              htmlFor="admin-candidates"
              className="block text-sm font-semibold text-[#171717] mb-1.5"
            >
              Candidats (1 par ligne : Nom | Faculté | Programme)
            </label>
            <textarea
              id="admin-candidates"
              rows={4}
              required
              value={candidatesInput}
              onChange={(e) => setCandidatesInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#171717]/15 bg-white text-sm focus:outline-2 focus:outline-[#FFC928]"
            />
          </div>

          {createdBanner && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-900 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{createdBanner}</span>
              </span>
              <button
                type="button"
                onClick={() => navigate("elections")}
                className="font-semibold underline shrink-0 cursor-pointer"
              >
                Ouvrir
              </button>
            </div>
          )}

          <button
            type="submit"
            className="saffra-btn-primary px-6 py-3 text-sm inline-flex items-center gap-2 cursor-pointer"
          >
            <ShieldCheck size={17} />
            <span>Déployer le contrat Voting & créer le groupe Semaphore</span>
          </button>
        </form>

        {/* Right Column: Hardhat Phase Controller & Relayer Toggle */}
        <div className="lg:col-span-5 space-y-6">
          <div className="saffra-card p-6 space-y-5">
            <div className="flex items-center gap-2.5">
              <Sliders size={19} className="text-[#E8AD00]" />
              <h2 className="font-heading text-lg font-bold text-[#171717]">
                Contrôle des phases (Démo Hardhat)
              </h2>
            </div>

            <div>
              <label
                htmlFor="phase-select-election"
                className="block text-xs font-semibold text-[#77736B] mb-1.5"
              >
                Scrutin piloté
              </label>
              <select
                id="phase-select-election"
                value={activeElection.id}
                onChange={(e) => setActiveElectionId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#171717]/15 bg-white text-sm font-medium"
              >
                {elections.map((el) => (
                  <option key={el.id} value={el.id}>
                    {el.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-xs font-semibold text-[#77736B] mb-2">
                Phase temporelle du smart contract (block.timestamp)
              </span>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#FFF9ED] border border-[#171717]/10">
                {(
                  [
                    { id: "registration", label: "Inscription" },
                    { id: "voting", label: "Vote ouvert" },
                    { id: "closed", label: "Clôturée" },
                  ] as { id: ElectionPhase; label: string }[]
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setElectionPhase(activeElection.id, item.id)}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      activeElection.phase === item.id
                        ? "bg-[#FFC928] text-[#171717]"
                        : "text-[#77736B] hover:text-[#171717]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#171717]/8 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-[#171717] flex items-center gap-2">
                  <Server size={16} />
                  <span>Relayer Backend</span>
                </div>
                <p className="text-xs text-[#77736B] mt-0.5">
                  Simulez une panne du relayer pour tester le fallback direct wallet.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRelayerOnline(!relayerOnline)}
                className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  relayerOnline
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {relayerOnline ? "Relayer Actif" : "Relayer Coupé"}
              </button>
            </div>
          </div>

          {/* Testing Plan Reference */}
          <div className="saffra-card overflow-hidden">
            <div className="px-6 py-4 border-b border-[#171717]/8 flex items-center gap-2">
              <Radio size={16} className="text-[#E8AD00]" />
              <h3 className="font-heading text-base font-bold text-[#171717]">
                Matrice des tests smart contract
              </h3>
            </div>
            <div className="divide-y divide-[#171717]/6">
              {TESTING_PLAN_CASES.map((row, idx) => (
                <div key={idx} className="px-6 py-3 text-xs flex flex-col gap-0.5">
                  <span className="font-semibold text-[#171717]">{row.test}</span>
                  <span className="font-mono-tabular text-[#77736B]">
                    {row.expected}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
