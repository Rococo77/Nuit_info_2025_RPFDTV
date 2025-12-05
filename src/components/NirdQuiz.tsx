import { useState, useEffect } from "react";
import { triggerBadgeUnlock } from "./AchievementBadges";

const questions = [
  {
    q: "Combien d'ordinateurs de votre établissement fonctionnent sous Windows 10 ou plus ancien ?",
    options: ["Aucun", "Moins de 25%", "25-50%", "Plus de 50%"],
    points: [3, 2, 1, 0]
  },
  {
    q: "Utilisez-vous des logiciels libres (LibreOffice, Firefox, GIMP...) ?",
    options: ["Oui, majoritairement", "Quelques-uns", "Très peu", "Aucun"],
    points: [3, 2, 1, 0]
  },
  {
    q: "Que faites-vous du matériel informatique obsolète ?",
    options: ["Reconditionnement/don", "Stockage", "Recyclage", "Poubelle"],
    points: [3, 2, 1, 0]
  },
  {
    q: "Avez-vous déjà testé Linux sur un vieux PC ?",
    options: ["Oui, avec succès", "En cours de test", "Prévu prochainement", "Jamais"],
    points: [3, 2, 1, 0]
  },
  {
    q: "Sensibilisez-vous les élèves à la sobriété numérique ?",
    options: ["Régulièrement", "Parfois", "Rarement", "Jamais"],
    points: [3, 2, 1, 0]
  }
];

const getResult = (score: number) => {
  const max = questions.length * 3;
  const percent = (score / max) * 100;
  
  if (percent >= 80) return { 
    title: "🏆 Village Gaulois Exemplaire !",
    desc: "Votre établissement résiste déjà aux Big Tech. Partagez votre expérience !",
    color: "text-secondary"
  };
  if (percent >= 50) return { 
    title: "⚔️ Résistant en devenir",
    desc: "Vous avez de bonnes bases. Quelques efforts pour devenir autonome !",
    color: "text-primary"
  };
  if (percent >= 25) return { 
    title: "🌱 Graine de résistance",
    desc: "Le chemin est long mais vous avez commencé. NIRD peut vous aider !",
    color: "text-accent"
  };
  return { 
    title: "🏛️ Sous domination Big Tech",
    desc: "Il est temps d'agir ! Découvrez la démarche NIRD pour vous libérer.",
    color: "text-destructive"
  };
};

const NirdQuiz = () => {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);

  // Hook must be called before any conditional returns
  useEffect(() => {
    if (finished) {
      triggerBadgeUnlock("quiz");
    }
  }, [finished]);

  const handleAnswer = (points: number) => {
    const newScore = score + points;
    setScore(newScore);
    
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
      setFinished(true);
    }
  };

  const reset = () => {
    setCurrent(0);
    setScore(0);
    setFinished(false);
    setStarted(false);
  };

  if (!started) {
    return (
      <div className="text-center">
        <h3 className="text-xl font-bold text-foreground mb-4">
          📋 Votre établissement est-il prêt pour NIRD ?
        </h3>
        <p className="text-muted-foreground mb-6">
          5 questions rapides pour évaluer votre autonomie numérique
        </p>
        <button
          onClick={() => setStarted(true)}
          className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded hover:opacity-90 transition-opacity"
        >
          Commencer le quiz
        </button>
      </div>
    );
  }

  if (finished) {
    const result = getResult(score);
    return (
      <div className="text-center animate-fade-up">
        <p className={`text-3xl font-bold mb-3 ${result.color}`}>
          {result.title}
        </p>
        <p className="text-foreground mb-2">
          Score : {score} / {questions.length * 3}
        </p>
        <p className="text-muted-foreground mb-6">{result.desc}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2 border border-primary text-primary rounded hover:bg-primary/10 transition-colors"
          >
            Recommencer
          </button>
          <a
            href="https://nird.forge.apps.education.fr/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
          >
            Découvrir NIRD
          </a>
        </div>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="animate-fade-up">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-muted-foreground">
          Question {current + 1}/{questions.length}
        </span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < current ? "bg-primary" : i === current ? "bg-accent" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-6">{q.q}</h3>
      
      <div className="grid gap-3">
        {q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(q.points[i])}
            className="w-full text-left p-4 rounded-lg border border-border bg-muted/30 hover:border-primary hover:bg-primary/10 transition-all"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default NirdQuiz;
