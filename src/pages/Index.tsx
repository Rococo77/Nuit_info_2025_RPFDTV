import { useState, useEffect, useCallback } from "react";
import NirdQuiz from "@/components/NirdQuiz";
import SavePCGame from "@/components/SavePCGame";
import AchievementBadges from "@/components/AchievementBadges";
import { SnakeGame } from "@/components/SnakeGame";
import SocratuxChat from "@/components/SocratuxChat";

const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

const Index = () => {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [showSnake, setShowSnake] = useState(false);
  const [konamiIndex, setKonamiIndex] = useState(0);
  const [typedKeys, setTypedKeys] = useState('');

  // Secret activation: Konami code OR typing "NIRD"
  const handleSecretActivation = useCallback((e: KeyboardEvent) => {
    // Konami code detection
    if (e.key === KONAMI_CODE[konamiIndex]) {
      const newIndex = konamiIndex + 1;
      if (newIndex === KONAMI_CODE.length) {
        setShowSnake(true);
        setKonamiIndex(0);
      } else {
        setKonamiIndex(newIndex);
      }
    } else if (e.key === KONAMI_CODE[0]) {
      setKonamiIndex(1);
    } else {
      setKonamiIndex(0);
    }

    // "NIRD" typing detection
    const newTyped = (typedKeys + e.key.toUpperCase()).slice(-4);
    setTypedKeys(newTyped);
    if (newTyped === 'NIRD') {
      setShowSnake(true);
      setTypedKeys('');
    }
  }, [konamiIndex, typedKeys]);

  useEffect(() => {
    window.addEventListener('keydown', handleSecretActivation);
    return () => window.removeEventListener('keydown', handleSecretActivation);
  }, [handleSecretActivation]);

  const steps = [
    {
      title: "Sensibiliser",
      icon: "💡",
      desc: "Former élèves et enseignants à la sobriété numérique et aux enjeux du libre."
    },
    {
      title: "Réemployer",
      icon: "♻️",
      desc: "Reconditionner le matériel existant plutôt que jeter. Un PC sous Linux vit 10 ans de plus !"
    },
    {
      title: "Libérer",
      icon: "🐧",
      desc: "Migrer vers Linux et les logiciels libres pour gagner en autonomie."
    },
    {
      title: "Mutualiser",
      icon: "🤝",
      desc: "Partager les ressources via la Forge des communs numériques éducatifs."
    }
  ];

  const pillars = [
    { letter: "N", word: "Numérique", color: "text-primary" },
    { letter: "I", word: "Inclusif", color: "text-secondary" },
    { letter: "R", word: "Responsable", color: "text-accent" },
    { letter: "D", word: "Durable", color: "text-[hsl(var(--nird-forest))]" }
  ];

  return (
    <main className="min-h-screen bg-background">
      {/* Easter Egg Snake Game */}
      {showSnake && <SnakeGame onClose={() => setShowSnake(false)} />}
      {/* Hero */}
      <header className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
        {/* Decorative shield */}
        <div className="absolute top-10 right-10 text-6xl opacity-20 animate-float hidden md:block">
          🛡️
        </div>
        
        <div className="text-center z-10 max-w-3xl animate-fade-up">
          <p className="text-primary text-sm tracking-[0.25em] uppercase mb-4">
            Nuit de l&apos;Info 2025
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-4">
            <span className="text-primary">N</span>umérique{" "}
            <span className="text-secondary">I</span>nclusif{" "}
            <span className="text-accent">R</span>esponsable{" "}
            <span className="text-[hsl(var(--nird-forest))]">D</span>urable
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl mb-8 max-w-xl mx-auto">
            Notre village résiste à l&apos;empire des Big Tech. 
            Rejoignez la résistance numérique ! 🏰
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a 
              href="#comprendre" 
              className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded hover:opacity-90 transition-opacity"
            >
              Comprendre NIRD
            </a>
            <a 
              href="/stl"
              className="px-6 py-3 border border-primary text-primary rounded hover:bg-primary/10 transition-colors"
            >
              🔧 Visualiseur STL
            </a>
            <a 
              href="/cve"
              className="px-6 py-3 border border-accent text-accent rounded hover:bg-accent/10 transition-colors"
            >
              🛡️ CVE Analyzer
            </a>
            <a 
              href="https://nird.forge.apps.education.fr/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border border-muted-foreground/50 text-muted-foreground rounded hover:bg-muted/20 transition-colors"
            >
              Site officiel ↗
            </a>
          </div>
        </div>
      </header>

      {/* Le Problème */}
      <section className="py-20 px-4 bg-card">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
            ⚔️ Le Défi
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <article className="p-6 bg-destructive/10 border border-destructive/30 rounded-lg">
              <h3 className="text-destructive font-semibold mb-3">L&apos;Empire Big Tech</h3>
              <ul className="text-muted-foreground text-sm space-y-2">
                <li>• Fin de Windows 10 = millions de PC à jeter</li>
                <li>• Licences coûteuses et abonnements forcés</li>
                <li>• Données stockées hors UE</li>
                <li>• Obsolescence programmée</li>
              </ul>
            </article>
            <article className="p-6 bg-secondary/10 border border-secondary/30 rounded-lg">
              <h3 className="text-secondary font-semibold mb-3">La Solution NIRD</h3>
              <ul className="text-muted-foreground text-sm space-y-2">
                <li>• Linux prolonge la vie des PC de 10 ans</li>
                <li>• Logiciels libres = 0€ de licences</li>
                <li>• Souveraineté des données</li>
                <li>• Autonomie technologique</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* Comprendre NIRD */}
      <section id="comprendre" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-12 text-center">
            Les 4 Piliers
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {pillars.map((p) => (
              <div key={p.letter} className="text-center p-4 pillar-card">
                <span className={`text-5xl font-black ${p.color}`}>{p.letter}</span>
                <p className="text-foreground mt-2 font-medium">{p.word}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Étapes interactives */}
      <section className="py-20 px-4 bg-card">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
            🗺️ Le Parcours
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            Cliquez pour découvrir chaque étape
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {steps.map((step, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(activeStep === i ? null : i)}
                className={`text-left p-5 rounded-lg border transition-all duration-300 ${
                  activeStep === i 
                    ? "bg-primary/15 border-primary" 
                    : "bg-muted/30 border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{step.icon}</span>
                  <h3 className="text-foreground font-semibold">{step.title}</h3>
                </div>
                {activeStep === i && (
                  <p className="text-muted-foreground text-sm animate-fade-up">
                    {step.desc}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Acteurs */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
            🏘️ Le Village
          </h2>
          <p className="text-muted-foreground mb-8">
            NIRD réunit tous les acteurs du système éducatif
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {["Élèves", "Enseignants", "Directions", "Techniciens", "Associations", "Collectivités"].map((actor) => (
              <span 
                key={actor}
                className="px-4 py-2 bg-muted rounded-full text-sm text-foreground"
              >
                {actor}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Gamification Section */}
      <section id="jeux" className="py-20 px-4 bg-card">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 text-center">
            🎮 Zone Interactive
          </h2>
          <p className="text-muted-foreground text-center mb-10">
            Apprenez en jouant et débloquez des badges !
          </p>
          
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Quiz */}
            <div className="lg:col-span-1 p-6 border border-border rounded-lg bg-background">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <span>🎯</span> Quiz NIRD
              </h3>
              <NirdQuiz />
            </div>
            
            {/* Mini-jeu */}
            <div className="lg:col-span-1 p-6 border border-border rounded-lg bg-background">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <span>🕹️</span> Mini-Jeu
              </h3>
              <SavePCGame />
            </div>
            
            {/* Badges */}
            <div className="lg:col-span-1 p-6 border border-border rounded-lg bg-background">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <span>🏅</span> Progression
              </h3>
              <AchievementBadges />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            Rejoignez la Résistance ! 💪
          </h2>
          <p className="text-muted-foreground mb-8">
            Découvrez comment votre établissement peut adopter la démarche NIRD
          </p>
          <a 
            href="https://nird.forge.apps.education.fr/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity animate-pulse-glow"
          >
            Visiter nird.forge.apps.education.fr
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto text-center text-muted-foreground text-sm">
          <p>Nuit de l&apos;Info 2025 — RPFDTV — Licence libre</p>
          <p className="mt-2 text-xs">
            Projet NIRD • Forge des communs numériques éducatifs
          </p>
        </div>
      </footer>

      {/* Chatbot Socratux */}
      <SocratuxChat />
    </main>
  );
};

export default Index;
