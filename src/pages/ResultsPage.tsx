import React from "react";
import {
  BarChart3,
  CheckCircle2,
  Eye,
  Radio,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useVoting } from "../context/VotingContext";

export function ResultsPage() {
  const { elections, activeElection, setActiveElectionId, navigate } = useVoting();

  const totalVotes = activeElection.votes.reduce((sum, count) => sum + count, 0);
  const memberCount = activeElection.members.length;
  const turnoutPct =
    activeElection.eligibleCount > 0
      ? ((totalVotes / activeElection.eligibleCount) * 100).toFixed(1)
      : "0.0";
  const auditHealthy = memberCount <= activeElection.eligibleCount;
  const maxVotes = Math.max(...activeElection.votes, 1);

  return (
    <div className="max-w-[1240px] mx-auto px-5 md:px-8 py-10 space-y-7">
      {/* Header & Election Selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#77736B] mb-1.5">
            <Eye size={15} className="text-[#171717]" />
            <span>Accès public sans connexion · Lecture directe des événements VoteEmis</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#171717]">
            Résultats & Audit en Direct
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-white border border-[#171717]/10">
          {elections.map((el) => (
            <button
              key={el.id}
              type="button"
              onClick={() => setActiveElectionId(el.id)}
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

      {/* KPI Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="saffra-card p-6">
          <div className="text-xs font-medium text-[#77736B] mb-1">
            Bulletins exprimés
          </div>
          <div className="font-heading text-3xl font-extrabold text-[#171717] tabular-nums">
            {totalVotes}
          </div>
          <div className="text-xs text-[#77736B] mt-1">
            Vérifiés par preuve Groth16
          </div>
        </div>

        <div className="saffra-card p-6">
          <div className="text-xs font-medium text-[#77736B] mb-1">
            Participation globale
          </div>
          <div className="font-heading text-3xl font-extrabold text-[#171717] tabular-nums">
            {turnoutPct}%
          </div>
          <div className="text-xs text-[#77736B] mt-1 tabular-nums">
            Sur {activeElection.eligibleCount} éligibles publiés
          </div>
        </div>

        <div className="saffra-card p-6">
          <div className="text-xs font-medium text-[#77736B] mb-1 flex items-center gap-1.5">
            <Users size={14} />
            <span>Taille du groupe Semaphore</span>
          </div>
          <div className="font-heading text-3xl font-extrabold text-[#171717] tabular-nums">
            {memberCount}
            <span className="text-base font-semibold text-[#77736B]">
              {" "}
              / {activeElection.eligibleCount}
            </span>
          </div>
          <div className="text-xs text-[#77736B] mt-1">
            Commitments inscrits dans l'arbre
          </div>
        </div>

        <div className="saffra-card p-6">
          <div className="text-xs font-medium text-[#77736B] mb-1">
            Audit anti-bourrage d'urnes
          </div>
          <div className="flex items-center gap-2 mt-1">
            <CheckCircle2
              size={22}
              className={auditHealthy ? "text-emerald-700" : "text-red-600"}
            />
            <span className="font-heading text-lg font-bold text-[#171717]">
              {auditHealthy ? "Conforme" : "Anomalie"}
            </span>
          </div>
          <div className="text-xs text-[#77736B] mt-1.5">
            Membres &le; Éligibles officiels
          </div>
        </div>
      </div>

      {/* Live Vote Bars */}
      <section className="saffra-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-heading text-xl font-bold text-[#171717] flex items-center gap-2.5">
              <BarChart3 size={21} />
              <span>{activeElection.title}</span>
            </h2>
            <p className="text-xs text-[#77736B] mt-1">
              Les barres se mettent à jour instantanément à chaque événement VoteEmis sans rechargement.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("elections")}
            className="saffra-btn-primary px-5 py-2.5 text-xs cursor-pointer whitespace-nowrap"
          >
            Voter sur ce scrutin
          </button>
        </div>

        <div className="space-y-6">
          {activeElection.candidates.map((candidate, index) => {
            const count = activeElection.votes[index] || 0;
            const share =
              totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) : "0.0";
            const isLeading = totalVotes > 0 && count === maxVotes;

            return (
              <div key={candidate.id} className="space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <span className="font-heading font-bold text-base text-[#171717]">
                      {candidate.name}
                    </span>
                    <span className="text-xs text-[#77736B] ml-2.5">
                      {candidate.department}
                      {isLeading ? " · En tête" : ""}
                    </span>
                  </div>
                  <div className="font-mono-tabular text-sm font-semibold text-[#171717]">
                    {count} voix ({share}%)
                  </div>
                </div>

                <div className="w-full h-3.5 rounded-full bg-[#FFF9ED] border border-[#171717]/8 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isLeading
                        ? "bg-gradient-to-r from-[#FFC928] to-[#E8AD00]"
                        : "bg-[#FFE7A3]"
                    }`}
                    style={{ width: `${share}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Audit Notice */}
      <div className="saffra-card p-5 bg-[#FFF9ED] flex items-start gap-3.5">
        <ShieldCheck size={22} className="text-[#171717] shrink-0 mt-0.5" />
        <p className="text-sm text-[#77736B] leading-relaxed">
          <strong className="text-[#171717]">Vérifiabilité publique :</strong>{" "}
          n'importe quel étudiant ou observateur peut vérifier que le nombre de{" "}
          <em>identity commitments</em> inscrits on-chain (
          <span className="font-mono-tabular font-semibold text-[#171717]">
            {memberCount}
          </span>
          ) n'excède jamais la liste d'étudiants éligibles publiée (
          <span className="font-mono-tabular font-semibold text-[#171717]">
            {activeElection.eligibleCount}
          </span>
          ), et qu'aucune adresse de votant n'apparaît dans les événements ci-dessous.
        </p>
      </div>

      {/* Live VoteEmis Event Stream */}
      <section className="saffra-card overflow-hidden">
        <div className="px-6 py-5 border-b border-[#171717]/8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Radio size={17} className="text-[#E8AD00]" />
            <h3 className="font-heading text-base font-bold text-[#171717]">
              Journal des événements on-chain (VoteEmis)
            </h3>
          </div>
          <span className="text-xs font-mono-tabular text-[#77736B]">
            {activeElection.events.length} événement(s) récent(s)
          </span>
        </div>

        {activeElection.events.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#77736B]">
            Aucun bulletin n'a encore été émis sur ce scrutin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#FFF9ED] text-xs font-semibold text-[#77736B] border-b border-[#171717]/8">
                  <th className="py-3 px-6">Heure</th>
                  <th className="py-3 px-4">Nullifier (anonyme)</th>
                  <th className="py-3 px-4">Candidat choisi</th>
                  <th className="py-3 px-4">Transmission</th>
                  <th className="py-3 px-6">Transaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171717]/6">
                {activeElection.events.map((ev, idx) => (
                  <tr key={`${ev.nullifier}-${idx}`} className="hover:bg-[#FFF9ED]/50">
                    <td className="py-3 px-6 font-mono-tabular text-xs text-[#77736B]">
                      {ev.timestamp}
                    </td>
                    <td className="py-3 px-4 font-mono-tabular text-xs text-[#171717]">
                      {ev.nullifier.slice(0, 18)}...
                    </td>
                    <td className="py-3 px-4 font-medium text-[#171717]">
                      {ev.candidateName}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#77736B]">
                      {ev.viaRelayer ? "Relayer (0 gaz)" : "Fallback Direct"}
                    </td>
                    <td className="py-3 px-6 font-mono-tabular text-xs text-[#77736B]">
                      {ev.txHash.slice(0, 14)}...{ev.txHash.slice(-6)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
