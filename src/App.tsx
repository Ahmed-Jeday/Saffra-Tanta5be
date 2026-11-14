import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";
import { Web3AuthModal } from "./components/Web3AuthModal";
import { VotingProvider, useVoting } from "./context/VotingContext";
import { AboutPage } from "./pages/AboutPage";
import { AdminPage } from "./pages/AdminPage";
import { ElectionsPage } from "./pages/ElectionsPage";
import { HomePage } from "./pages/HomePage";
import { ResultsPage } from "./pages/ResultsPage";

function SaffraShell() {
  const { route } = useVoting();

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9ED] text-[#171717]">
      <Navbar />
      <main className="flex-1">
        {route === "home" && <HomePage />}
        {route === "elections" && <ElectionsPage />}
        {route === "results" && <ResultsPage />}
        {route === "about" && <AboutPage />}
        {route === "admin" && <AdminPage />}
      </main>
      <Footer />
      <Web3AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <VotingProvider>
      <SaffraShell />
    </VotingProvider>
  );
}
