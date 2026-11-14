import React from "react";
import { ShieldCheck } from "lucide-react";
import { useVoting } from "../context/VotingContext";

export function Footer() {
  const { navigate } = useVoting();

  return (
    <footer className="border-t border-[#171717]/8 bg-white mt-16">
      <div className="max-w-[1240px] mx-auto px-5 md:px-8 py-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-[#77736B]">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={18} className="text-[#171717] shrink-0" />
          <span>
            <strong className="text-[#171717] font-semibold">Saffra</strong> — Vote. Transparently. Plateforme universitaire de vote anonyme.
          </span>
        </div>

        <div className="flex items-center gap-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => navigate("elections")}
            className="hover:text-[#171717] transition-colors cursor-pointer"
          >
            Voter
          </button>
          <button
            type="button"
            onClick={() => navigate("results")}
            className="hover:text-[#171717] transition-colors cursor-pointer"
          >
            Résultats en direct
          </button>
          <button
            type="button"
            onClick={() => navigate("about")}
            className="hover:text-[#171717] transition-colors cursor-pointer"
          >
            Confidentialité ZK
          </button>
        </div>
      </div>
    </footer>
  );
}
