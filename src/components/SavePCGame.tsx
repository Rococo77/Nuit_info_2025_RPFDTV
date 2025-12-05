import { useState, useEffect } from "react";
import { triggerBadgeUnlock } from "./AchievementBadges";

type Scenario = {
  situation: string;
  choices: { text: string; result: "good" | "bad" | "neutral"; feedback: string; points: number }[];
};

const scenarios: Scenario[] = [
  {
    situation: "🖥️ Votre PC de 2018 sous Windows 10 ne sera plus supporté en 2025. Que faites-vous ?",
    choices: [
      { text: "Acheter un PC neuf", result: "bad", feedback: "💸 Cher et polluant ! Ce PC fonctionne encore très bien.", points: 0 },
      { text: "Installer Linux", result: "good", feedback: "🎉 Excellent ! Votre PC vivra encore 10 ans de plus !", points: 3 },
      { text: "Ignorer le problème", result: "neutral", feedback: "⚠️ Risqué ! Failles de sécurité non corrigées.", points: 1 }
    ]
  },
  {
    situation: "📊 Microsoft Office coûte 150€/an par poste. Alternative ?",
    choices: [
      { text: "Payer les licences", result: "bad", feedback: "💸 Budget conséquent pour des fonctions similaires au libre.", points: 0 },
      { text: "Utiliser LibreOffice", result: "good", feedback: "🎉 Gratuit, open source, et compatible !", points: 3 },
      { text: "Versions piratées", result: "bad", feedback: "⚠️ Illégal et risque de malwares !", points: 0 }
    ]
  },
  {
    situation: "☁️ Vos données élèves sont stockées sur un cloud américain. RGPD ?",
    choices: [
      { text: "Continuer ainsi", result: "bad", feedback: "⚠️ Non conforme RGPD, données hors UE.", points: 0 },
      { text: "Hébergement souverain", result: "good", feedback: "🎉 Nextcloud ou Apps.education.fr = souveraineté !", points: 3 },
      { text: "Supprimer le cloud", result: "neutral", feedback: "🤔 Extrême, mais au moins c'est conforme...", points: 1 }
    ]
  },
  {
    situation: "🔧 20 vieux PC au fond du placard. Que faire ?",
    choices: [
      { text: "Jeter à la déchetterie", result: "bad", feedback: "💔 Gâchis ! Ces PC peuvent encore servir.", points: 0 },
      { text: "Atelier reconditionnement", result: "good", feedback: "🎉 Parfait ! Les élèves apprennent et les PC revivent !", points: 3 },
      { text: "Les laisser au placard", result: "neutral", feedback: "🤷 Ni bon ni mauvais, mais quel gâchis potentiel...", points: 1 }
    ]
  }
];

const SavePCGame = () => {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [pcsSaved, setPcsSaved] = useState(0);

  const handleChoice = (choice: Scenario["choices"][0]) => {
    setFeedback(choice.feedback);
    setScore(score + choice.points);
    if (choice.result === "good") setPcsSaved(pcsSaved + 1);
    
    setTimeout(() => {
      setFeedback(null);
      if (step < scenarios.length - 1) {
        setStep(step + 1);
      } else {
        setStep(-1); // finished
      }
    }, 2000);
  };

  const reset = () => {
    setStep(0);
    setScore(0);
    setFeedback(null);
    setStarted(false);
    setPcsSaved(0);
  };

  useEffect(() => {
    if (step === -1) {
      triggerBadgeUnlock("gamer");
    }
  }, [step]);

  if (!started) {
    return (
      <div className="text-center">
        <div className="text-5xl mb-4">🖥️💾</div>
        <h3 className="text-xl font-bold text-foreground mb-3">
          Sauvez votre établissement !
        </h3>
        <p className="text-muted-foreground text-sm mb-6">
          Mini-jeu de décisions : faites les bons choix pour libérer votre école
        </p>
        <button
          onClick={() => setStarted(true)}
          className="px-6 py-3 bg-accent text-accent-foreground font-medium rounded hover:opacity-90 transition-opacity"
        >
          Jouer
        </button>
      </div>
    );
  }

  if (step === -1) {
    const maxScore = scenarios.length * 3;
    const percent = Math.round((score / maxScore) * 100);
    return (
      <div className="text-center animate-fade-up">
        <div className="text-5xl mb-4">
          {percent >= 75 ? "🏆" : percent >= 50 ? "⭐" : "💪"}
        </div>
        <p className="text-2xl font-bold text-foreground mb-2">
          {score} / {maxScore} points
        </p>
        <p className="text-lg text-secondary mb-2">
          {pcsSaved} PC sauvés de l'obsolescence !
        </p>
        <p className="text-muted-foreground text-sm mb-6">
          {percent >= 75 
            ? "Vous êtes un vrai résistant NIRD !" 
            : percent >= 50 
              ? "Bon début, continuez à apprendre !" 
              : "La route est longue, mais NIRD vous accompagne !"}
        </p>
        <button
          onClick={reset}
          className="px-5 py-2 border border-accent text-accent rounded hover:bg-accent/10 transition-colors"
        >
          Rejouer
        </button>
      </div>
    );
  }

  const current = scenarios[step];

  return (
    <div>
      <div className="flex justify-between items-center mb-4 text-sm">
        <span className="text-muted-foreground">Scénario {step + 1}/{scenarios.length}</span>
        <span className="text-secondary font-medium">{pcsSaved} 🖥️ sauvés</span>
      </div>

      {feedback ? (
        <div className="p-6 text-center animate-fade-up">
          <p className="text-lg">{feedback}</p>
        </div>
      ) : (
        <div className="animate-fade-up">
          <p className="text-foreground font-medium mb-6">{current.situation}</p>
          <div className="grid gap-3">
            {current.choices.map((choice, i) => (
              <button
                key={i}
                onClick={() => handleChoice(choice)}
                className="w-full text-left p-4 rounded-lg border border-border bg-muted/30 hover:border-accent hover:bg-accent/10 transition-all"
              >
                {choice.text}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SavePCGame;
