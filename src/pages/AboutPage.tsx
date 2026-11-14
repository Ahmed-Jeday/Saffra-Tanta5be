import React from "react";
import { EyeOff, Lock, ShieldCheck } from "lucide-react";

const COMPARISON_ROWS = [
  {
    web3auth: "Connexion Google ou email universitaire",
    semaphore: "Identité anonyme (secret conservé chez l'étudiant)",
  },
  {
    web3auth: "Prouve que l'étudiant contrôle son compte",
    semaphore: "Prouve l'appartenance au groupe des électeurs éligibles",
  },
  {
    web3auth: "Fournit un wallet Ethereum et un signataire",
    semaphore: "Fournit un identity commitment public et une preuve ZK",
  },
  {
    web3auth: "Adresse wallet publique liée à la connexion",
    semaphore: "Nullifier dérivé du secret et du scope (aucun lien wallet)",
  },
  {
    web3auth: "Signe des messages (dérivation d'identité)",
    semaphore: "Génère la preuve qui autorise exactement un vote",
  },
];

const PRIVACY_TABLE = [
  {
    data: "ID étudiant, nom, email",
    location: "Base de données universitaire",
    isPublic: "Non",
  },
  {
    data: "Indicateur « inscrit » par étudiant",
    location: "Base de données backend",
    isPublic: "Non",
  },
  {
    data: "Identity commitment",
    location: "Blockchain (membres du groupe)",
    isPublic: "Oui, non relié à un étudiant",
  },
  {
    data: "Secret d'identité Semaphore",
    location: "Navigateur étudiant uniquement",
    isPublic: "Non",
  },
  {
    data: "Nullifier",
    location: "Blockchain (événement & stockage)",
    isPublic: "Oui, non relié à un commitment",
  },
  {
    data: "Candidat choisi",
    location: "Blockchain (VoteEmis & compteurs)",
    isPublic: "Oui, relié uniquement au nullifier",
  },
  {
    data: "Adresse wallet de l'étudiant",
    location: "Non utilisée pour voter (Relayer)",
    isPublic: "Absente des votes on-chain",
  },
];

export function AboutPage() {
  return (
    <div className="max-w-[1240px] mx-auto px-5 md:px-8 py-10 space-y-10">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold text-[#77736B] mb-2">
          Architecture de Confidentialité · Technical Plan v2
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#171717] text-balance mb-3">
          Comment Saffra garantit un vote anonyme et vérifiable
        </h1>
        <p className="text-base text-[#77736B] leading-relaxed">
          Contrairement à un vote pseudonymisé où une adresse wallet peut être
          reliée à un nom, Saffra sépare strictement l'authentification
          universitaire (<strong>Web3Auth</strong>) de l'autorisation anonyme
          de vote (<strong>Semaphore v4</strong>).
        </p>
      </div>

      {/* 3 Key Guarantees */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="saffra-card p-7">
          <div className="w-11 h-11 rounded-full bg-[#FFE7A3] flex items-center justify-center text-[#171717] mb-4">
            <Lock size={20} />
          </div>
          <h2 className="font-heading text-lg font-bold text-[#171717] mb-2">
            Le backend reste aveugle
          </h2>
          <p className="text-sm text-[#77736B] leading-relaxed">
            L'identité Semaphore est générée dans votre navigateur. Le serveur
            enregistre uniquement le fait que vous êtes inscrit, et pousse les
            commitments par lots mélangés afin d'éviter toute corrélation temporelle.
          </p>
        </div>

        <div className="saffra-card p-7">
          <div className="w-11 h-11 rounded-full bg-[#FFE7A3] flex items-center justify-center text-[#171717] mb-4">
            <EyeOff size={20} />
          </div>
          <h2 className="font-heading text-lg font-bold text-[#171717] mb-2">
            Relayer sans trace wallet
          </h2>
          <p className="text-sm text-[#77736B] leading-relaxed">
            Le relayer soumet la transaction et paie les frais de gaz. La preuve
            lie cryptographiquement le choix du candidat : le relayer ne peut pas
            altérer votre vote. En cas de censure, un fallback direct reste possible.
          </p>
        </div>

        <div className="saffra-card p-7">
          <div className="w-11 h-11 rounded-full bg-[#FFE7A3] flex items-center justify-center text-[#171717] mb-4">
            <ShieldCheck size={20} />
          </div>
          <h2 className="font-heading text-lg font-bold text-[#171717] mb-2">
            Un vote par étudiant (Nullifier)
          </h2>
          <p className="text-sm text-[#77736B] leading-relaxed">
            Le nullifier est dérivé du secret et du Group ID du scrutin. Il est
            identique si un même étudiant tente de voter deux fois, bloquant le
            double vote sans jamais révéler son identité.
          </p>
        </div>
      </div>

      {/* Web3Auth vs Semaphore Table */}
      <section className="saffra-card overflow-hidden">
        <div className="px-6 py-5 border-b border-[#171717]/8">
          <h2 className="font-heading text-xl font-bold text-[#171717]">
            Web3Auth vs Semaphore v4 : deux rôles complémentaires
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#FFF9ED] text-xs font-semibold text-[#77736B] border-b border-[#171717]/8">
                <th className="py-3.5 px-6">Web3Auth (Authentification)</th>
                <th className="py-3.5 px-6">Semaphore v4 (Anonymat & Preuve)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171717]/6">
              {COMPARISON_ROWS.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#FFF9ED]/45">
                  <td className="py-3.5 px-6 text-[#171717]">{row.web3auth}</td>
                  <td className="py-3.5 px-6 text-[#171717] font-medium">
                    {row.semaphore}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Privacy Analysis Table */}
      <section className="saffra-card overflow-hidden">
        <div className="px-6 py-5 border-b border-[#171717]/8">
          <h2 className="font-heading text-xl font-bold text-[#171717]">
            Analyse de confidentialité des données
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#FFF9ED] text-xs font-semibold text-[#77736B] border-b border-[#171717]/8">
                <th className="py-3.5 px-6">Donnée</th>
                <th className="py-3.5 px-6">Lieu de stockage</th>
                <th className="py-3.5 px-6">Visibilité publique</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171717]/6">
              {PRIVACY_TABLE.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#FFF9ED]/45">
                  <td className="py-3.5 px-6 font-medium text-[#171717]">
                    {row.data}
                  </td>
                  <td className="py-3.5 px-6 text-[#77736B]">{row.location}</td>
                  <td className="py-3.5 px-6 text-[#171717]">{row.isPublic}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
