import React, { useState } from "react";
import { Loader2, Mail, ShieldCheck, X } from "lucide-react";
import { useVoting } from "../context/VotingContext";
import { DEMO_UNIVERSITY_STUDENTS } from "../services/votingBackend";
import type { Web3AuthSession } from "../types/voting";
import { SaffraLogo } from "./SaffraLogo";

export function Web3AuthModal() {
  const { isAuthModalOpen, closeAuthModal, loginWithWeb3Auth } = useVoting();
  const [email, setEmail] = useState("amina.benali@univ-saffra.edu");
  const [provider, setProvider] = useState<Web3AuthSession["providerLabel"]>(
    "Google University SSO"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isAuthModalOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Veuillez saisir une adresse email universitaire valide.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await loginWithWeb3Auth(email, provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#171717]/45 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="web3auth-modal-title"
    >
      <div className="saffra-card w-full max-w-md p-7 relative">
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center text-[#77736B] hover:bg-[#FFF9ED] hover:text-[#171717] transition-colors cursor-pointer"
          aria-label="Fermer"
        >
          <X size={18} />
        </button>

        <div className="mb-5">
          <SaffraLogo size={34} />
        </div>

        <h2
          id="web3auth-modal-title"
          className="font-heading text-xl font-bold text-[#171717] mb-1.5"
        >
          Connexion Étudiante Web3Auth
        </h2>
        <p className="text-sm text-[#77736B] leading-relaxed mb-5">
          Authentifiez-vous avec votre compte universitaire. Web3Auth génère
          votre wallet sans extension ; votre vote restera dissocié de cette
          adresse grâce à Semaphore.
        </p>

        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#FFF9ED] border border-[#171717]/8 mb-5">
          {(["Google University SSO", "Email Universitaire"] as const).map(
            (mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setProvider(mode)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  provider === mode
                    ? "bg-white text-[#171717] shadow-xs"
                    : "text-[#77736B] hover:text-[#171717]"
                }`}
              >
                {mode === "Google University SSO" ? "Google SSO" : "Email OTP"}
              </button>
            )
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="w3a-email"
              className="block text-sm font-semibold text-[#171717] mb-1.5"
            >
              Adresse email universitaire
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77736B]"
              />
              <input
                id="w3a-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom.nom@univ-saffra.edu"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#171717]/15 bg-white text-sm focus:outline-2 focus:outline-[#FFC928]"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#77736B] mb-2">
              Comptes de démonstration disponibles :
            </p>
            <div className="flex flex-wrap gap-1.5">
              {DEMO_UNIVERSITY_STUDENTS.map((student) => (
                <button
                  key={student.email}
                  type="button"
                  onClick={() => setEmail(student.email)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                    email === student.email
                      ? "bg-[#FFE7A3] border-[#FFC928] text-[#171717] font-semibold"
                      : "bg-[#FFF9ED] border-[#171717]/10 text-[#77736B] hover:text-[#171717]"
                  }`}
                >
                  {student.fullName}
                  {!student.eligible ? " (externe)" : ""}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs font-medium text-red-700 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="saffra-btn-primary w-full py-3 px-5 text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                <span>Création du signer Web3Auth...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={17} />
                <span>Continuer avec {provider}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
