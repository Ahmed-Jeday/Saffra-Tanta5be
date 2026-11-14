import React, { useState } from "react";
import {
  ArrowRight,
  ChevronRight,
  Eye,
  Lock,
  ShieldCheck,
  Users,
  Vote,
} from "lucide-react";
import { useVoting } from "../context/VotingContext";

const HERO_IMAGE_PATH = "/src/assets/images/campus_students_hero_1794683373915.jpg";

export function HomePage() {
  const { navigate, elections } = useVoting();
  const [imgFailed, setImgFailed] = useState(false);

  const primaryElection = elections[0];
  const totalVotesCast = primaryElection
    ? primaryElection.votes.reduce((sum, v) => sum + v, 0)
    : 0;

  return (
    <div>
      {/* Hero Section matching Saffra visual mockup */}
      <section className="relative overflow-hidden bg-[#FFF9ED] pt-8 pb-16 lg:pt-12 lg:pb-20">
        {/* Organic golden wave on right side */}
        <div
          aria-hidden="true"
          className="hidden lg:block absolute -top-24 -right-24 w-[56%] h-[118%] pointer-events-none"
        >
          <svg
            viewBox="0 0 800 760"
            fill="none"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            <path
              d="M210 0C160 110 380 185 265 340C150 495 15 585 0 760H800V0H210Z"
              fill="url(#saffraWave)"
            />
            <defs>
              <linearGradient
                id="saffraWave"
                x1="120"
                y1="40"
                x2="760"
                y2="680"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#FFE7A3" />
                <stop offset="52%" stopColor="#FFC928" />
                <stop offset="100%" stopColor="#F5B80E" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Subtle golden university campus line-art sketch bottom-left */}
        <div
          aria-hidden="true"
          className="hidden md:block absolute bottom-0 left-0 w-[440px] opacity-35 pointer-events-none"
        >
          <svg viewBox="0 0 520 150" fill="none" className="w-full h-auto">
            <path
              d="M10 140H510M45 140V85L105 60L165 85V140M70 140V105H95V140M115 140V105H140V140M195 140V55H275V140M215 55V35L235 20L255 35V55M212 80H225M245 80H258M212 105H225M245 105H258M315 140V30L330 12L345 30V140M370 140V75H450V140M388 95H405M418 95H435"
              stroke="#E6AF10"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="relative z-10 max-w-[1240px] mx-auto px-5 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Column: Brand Statement & Pillars */}
            <div className="lg:col-span-6 min-w-0">
              <div className="inline-block mb-4">
                <span className="font-heading text-[3.1rem] sm:text-[4rem] font-extrabold tracking-tight text-[#171717] leading-none block">
                  Saffra
                </span>
                <svg
                  viewBox="0 0 260 18"
                  fill="none"
                  className="w-full h-3.5 mt-0.5"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 11C72 3 168 3 256 13"
                    stroke="#FFC928"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <h1 className="font-heading text-[1.85rem] sm:text-[2.45rem] font-bold leading-[1.2] text-[#171717] text-balance mb-4">
                Votez en toute confiance,
                <br />
                pour une université{" "}
                <span className="italic font-extrabold text-[#E8AD00]">
                  plus forte
                </span>
              </h1>

              <p className="text-[1.02rem] leading-relaxed text-[#77736B] max-w-[490px] mb-7">
                Une plateforme de vote universitaire moderne, sécurisée et
                transparente, basée sur la blockchain et la preuve
                Zero-Knowledge Semaphore.
              </p>

              {/* 3 Security Pillars */}
              <div className="flex flex-wrap items-start gap-7 sm:gap-9 mb-8">
                <div className="flex flex-col items-center text-center w-[98px]">
                  <div className="w-14 h-14 rounded-full bg-[#FFE7A3] flex items-center justify-center text-[#171717] mb-2.5 shadow-xs">
                    <ShieldCheck size={24} />
                  </div>
                  <span className="text-[0.82rem] font-semibold leading-tight text-[#171717]">
                    Sécurité Blockchain
                  </span>
                </div>

                <div className="flex flex-col items-center text-center w-[98px]">
                  <div className="w-14 h-14 rounded-full bg-[#FFE7A3] flex items-center justify-center text-[#171717] mb-2.5 shadow-xs">
                    <Eye size={24} />
                  </div>
                  <span className="text-[0.82rem] font-semibold leading-tight text-[#171717]">
                    Transparence totale
                  </span>
                </div>

                <div className="flex flex-col items-center text-center w-[98px]">
                  <div className="w-14 h-14 rounded-full bg-[#FFE7A3] flex items-center justify-center text-[#171717] mb-2.5 shadow-xs">
                    <Lock size={24} />
                  </div>
                  <span className="text-[0.82rem] font-semibold leading-tight text-[#171717]">
                    Anonymat garanti
                  </span>
                </div>
              </div>

              {/* Primary CTA */}
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate("elections")}
                  className="saffra-btn-primary inline-flex items-center gap-2.5 px-7 py-3.5 text-[0.98rem] cursor-pointer whitespace-nowrap"
                >
                  <span>Commencer à voter</span>
                  <ChevronRight size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => navigate("results")}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-white border border-[#171717]/14 text-sm font-semibold text-[#171717] hover:bg-[#FFE7A3]/40 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>Résultats en direct</span>
                </button>
              </div>
            </div>

            {/* Right Column: Campus Visual + Floating Ballot Card + Stats Bar */}
            <div className="lg:col-span-6 relative pb-10">
              {/* Decorative concentric yellow arc */}
              <div
                aria-hidden="true"
                className="hidden sm:block absolute -left-4 top-8 bottom-16 w-12 border-l-[3px] border-[#FFC928] rounded-l-[999px] pointer-events-none"
              />

              <div className="relative rounded-[36px] overflow-hidden border-[5px] border-white shadow-[0_20px_48px_rgba(23,23,23,0.14)] aspect-[4/3] bg-[#FFE7A3]">
                {!imgFailed ? (
                  <img
                    src={HERO_IMAGE_PATH}
                    alt="Étudiants marchant sur les marches du campus universitaire"
                    referrerPolicy="no-referrer"
                    onError={() => setImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#FFE7A3] to-[#FFC928] p-8 text-center">
                    <Vote size={48} className="text-[#171717] mb-3" />
                    <p className="font-heading font-bold text-lg text-[#171717]">
                      Campus Universitaire Saffra
                    </p>
                  </div>
                )}
              </div>

              {/* Floating Frosted Card */}
              <div className="hidden sm:block absolute top-[22%] -right-2 md:-right-4 w-[178px] rounded-[20px] bg-white/88 backdrop-blur-md p-4 text-center shadow-[0_14px_34px_rgba(23,23,23,0.14)] border border-white/80">
                <div className="w-12 h-12 mx-auto mb-2.5 rounded-xl bg-[#FFC928] border-2 border-[#171717] flex items-center justify-center">
                  <Vote size={24} className="text-[#171717]" />
                </div>
                <p className="text-[0.82rem] font-bold leading-snug text-[#171717]">
                  Votez facilement et en toute sécurité
                </p>
                <svg
                  viewBox="0 0 120 10"
                  fill="none"
                  className="w-24 h-2 mx-auto mt-1.5"
                  aria-hidden="true"
                >
                  <path
                    d="M3 6C35 2 85 2 117 7"
                    stroke="#FFC928"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Bottom Floating Stats Strip */}
              <div className="relative z-20 -mt-9 mx-auto w-[92%] bg-white rounded-[18px] shadow-[0_14px_34px_rgba(23,23,23,0.12)] border border-[#171717]/6 px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-3">
                <div className="flex items-center gap-3 sm:border-r sm:border-[#171717]/10 sm:pr-3">
                  <Users size={22} className="text-[#171717] shrink-0" />
                  <div>
                    <div className="font-heading font-bold text-[1.02rem] leading-tight text-[#171717] tabular-nums">
                      +500
                    </div>
                    <div className="text-xs text-[#77736B]">Étudiants</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:border-r sm:border-[#171717]/10 sm:pr-3">
                  <Vote size={22} className="text-[#E8AD00] shrink-0" />
                  <div>
                    <div className="font-heading font-bold text-[0.95rem] leading-tight text-[#171717]">
                      Élections
                    </div>
                    <div className="text-xs text-[#77736B]">Transparentes</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <ShieldCheck size={22} className="text-[#171717] shrink-0" />
                  <div>
                    <div className="font-heading font-bold text-[0.95rem] leading-tight text-[#171717]">
                      Blockchain
                    </div>
                    <div className="text-xs text-[#77736B]">Sécurisée</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: 3-Phase Protocol Overview */}
      <section className="max-w-[1240px] mx-auto px-5 md:px-8 py-14">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-9">
          <div>
            <p className="text-xs font-semibold tracking-wide text-[#77736B] mb-1.5">
              Architecture Semaphore v4 & Web3Auth
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#171717] text-balance">
              Un scrutin vérifiable sans jamais révéler votre identité
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate("about")}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#171717] hover:text-[#77736B] transition-colors cursor-pointer shrink-0"
          >
            <span>Comprendre la confidentialité</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="saffra-card p-7">
            <div className="font-heading text-sm font-bold text-[#E8AD00] mb-2">
              01. Authentification Web3Auth
            </div>
            <h3 className="font-heading text-lg font-bold text-[#171717] mb-2">
              Connexion universitaire simple
            </h3>
            <p className="text-sm text-[#77736B] leading-relaxed">
              Connectez-vous via Google ou votre email universitaire sans
              installer d'extension. Le backend vérifie uniquement votre
              éligibilité sur la liste officielle.
            </p>
          </div>

          <div className="saffra-card p-7">
            <div className="font-heading text-sm font-bold text-[#E8AD00] mb-2">
              02. Identité Semaphore locale
            </div>
            <h3 className="font-heading text-lg font-bold text-[#171717] mb-2">
              Secret conservé dans le navigateur
            </h3>
            <p className="text-sm text-[#77736B] leading-relaxed">
              Votre identité anonyme est générée localement par signature
              privée. Seul le commitment public rejoint l'arbre de Merkle par
              lots mélangés.
            </p>
          </div>

          <div className="saffra-card p-7">
            <div className="font-heading text-sm font-bold text-[#E8AD00] mb-2">
              03. Vote anonyme via Relayer
            </div>
            <h3 className="font-heading text-lg font-bold text-[#171717] mb-2">
              Preuve ZK & protection double vote
            </h3>
            <p className="text-sm text-[#77736B] leading-relaxed">
              Votre navigateur prouve son appartenance au groupe sans révéler
              quel membre vous êtes. Le relayer paie le gaz et le nullifier
              empêche tout second vote.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Active Election Spotlight */}
      {primaryElection && (
        <section className="max-w-[1240px] mx-auto px-5 md:px-8 pb-6">
          <div className="saffra-card p-7 sm:p-9 bg-gradient-to-br from-white to-[#FFF6DA]/70 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#77736B] mb-2">
                <span className="font-semibold text-[#171717]">
                  Scrutin en cours
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {primaryElection.eligibleCount} étudiants éligibles
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {totalVotesCast} bulletins enregistrés
                </span>
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-[#171717] mb-2">
                {primaryElection.title}
              </h2>
              <p className="text-sm text-[#77736B] leading-relaxed">
                {primaryElection.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => navigate("elections")}
                className="saffra-btn-primary px-6 py-3 text-sm inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <span>Accéder à l'isoloir</span>
                <ChevronRight size={17} />
              </button>
              <button
                type="button"
                onClick={() => navigate("results")}
                className="px-5 py-3 rounded-full bg-white border border-[#171717]/15 text-sm font-semibold text-[#171717] hover:bg-[#FFF9ED] transition-colors cursor-pointer whitespace-nowrap"
              >
                Suivre le dépouillement
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
