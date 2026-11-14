import React from "react";
import {
  BarChart3,
  Home,
  Info,
  LogOut,
  ShieldCheck,
  Vote,
  Wallet,
} from "lucide-react";
import { useVoting } from "../context/VotingContext";
import type { PageRoute } from "../types/voting";
import { SaffraLogo } from "./SaffraLogo";

const NAV_ITEMS: { id: PageRoute; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "elections", label: "Elections", icon: Vote },
  { id: "results", label: "Results", icon: BarChart3 },
  { id: "about", label: "About", icon: Info },
  { id: "admin", label: "Admin", icon: ShieldCheck },
];

export function Navbar() {
  const { route, navigate, session, openAuthModal, logout } = useVoting();

  const shortAddress = session
    ? `${session.address.slice(0, 6)}...${session.address.slice(-4)}`
    : "";

  return (
    <header className="sticky top-0 z-40 bg-[#FFF9ED]/92 backdrop-blur-md border-b border-[#171717]/8">
      <div className="max-w-[1240px] mx-auto px-5 md:px-8 h-20 flex items-center justify-between gap-8">
        {/* Zone 1: Brand */}
        <button
          type="button"
          onClick={() => navigate("home")}
          className="text-left focus-visible:outline-2 focus-visible:outline-[#FFC928] rounded-lg shrink-0 cursor-pointer"
          aria-label="Accueil Saffra"
        >
          <SaffraLogo showTagline />
        </button>

        {/* Zone 2: Navigation */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Navigation principale">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = route === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                className={`relative inline-flex items-center gap-2 py-2.5 text-[0.94rem] whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#FFC928] ${
                  active
                    ? "text-[#171717] font-semibold"
                    : "text-[#77736B] font-medium hover:text-[#171717]"
                }`}
              >
                <Icon size={17} />
                <span>{item.label}</span>
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 right-0 -bottom-0.5 h-[3px] rounded-full bg-[#FFC928]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          {session ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("elections")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#FFE7A3] text-[#171717] text-sm font-semibold whitespace-nowrap shrink-0 hover:bg-[#FFC928] transition-colors cursor-pointer"
                title={session.email}
              >
                <Wallet size={16} />
                <span className="font-mono-tabular">{shortAddress}</span>
              </button>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white border border-[#171717]/12 text-[#171717] hover:bg-[#FFF9ED] transition-colors cursor-pointer"
                title="Se déconnecter"
                aria-label="Se déconnecter"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={openAuthModal}
              className="saffra-btn-primary inline-flex items-center gap-2.5 px-5 py-2.5 text-sm whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Wallet size={17} />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Strip */}
      <nav
        className="md:hidden flex items-center justify-around border-t border-[#171717]/8 bg-[#FFF9ED] px-2 py-1.5 overflow-x-auto"
        aria-label="Navigation mobile"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = route === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? "bg-[#FFC928] text-[#171717] font-semibold"
                  : "text-[#77736B] font-medium"
              }`}
            >
              <Icon size={14} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
