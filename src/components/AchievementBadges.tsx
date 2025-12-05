import { useState, useEffect } from "react";

type Badge = {
  id: string;
  icon: string;
  name: string;
  desc: string;
  unlocked: boolean;
};

const STORAGE_KEY = "nird-badges";

const defaultBadges: Badge[] = [
  { id: "explorer", icon: "🗺️", name: "Explorateur", desc: "Visité la page NIRD", unlocked: true },
  { id: "curious", icon: "🔍", name: "Curieux", desc: "Lu les 4 piliers", unlocked: false },
  { id: "quiz", icon: "🎯", name: "Testeur", desc: "Complété le quiz", unlocked: false },
  { id: "gamer", icon: "🎮", name: "Joueur", desc: "Joué au mini-jeu", unlocked: false },
  { id: "resistant", icon: "⚔️", name: "Résistant", desc: "Exploré tout le site", unlocked: false },
  { id: "master", icon: "🏆", name: "Maître NIRD", desc: "Tout débloquer", unlocked: false },
];

const loadBadges = (): Badge[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const savedIds = JSON.parse(saved) as string[];
      return defaultBadges.map(b => ({
        ...b,
        unlocked: savedIds.includes(b.id)
      }));
    }
  } catch (e) {
    console.error("Failed to load badges:", e);
  }
  return defaultBadges;
};

const saveBadges = (badges: Badge[]) => {
  try {
    const unlockedIds = badges.filter(b => b.unlocked).map(b => b.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unlockedIds));
  } catch (e) {
    console.error("Failed to save badges:", e);
  }
};

const AchievementBadges = () => {
  const [badges, setBadges] = useState<Badge[]>(loadBadges);

  const [showUnlock, setShowUnlock] = useState<string | null>(null);

  const unlockBadge = (id: string) => {
    setBadges(prev => {
      // Check if already unlocked - don't show notification again
      const badge = prev.find(b => b.id === id);
      if (badge?.unlocked) return prev;

      const updated = prev.map(b => b.id === id ? { ...b, unlocked: true } : b);
      
      // Show notification only for newly unlocked badge
      setShowUnlock(id);
      setTimeout(() => setShowUnlock(null), 2000);
      
      // Check if all unlocked except master
      const nonMaster = updated.filter(b => b.id !== "master");
      if (nonMaster.every(b => b.unlocked)) {
        setTimeout(() => {
          setShowUnlock("master");
          setTimeout(() => setShowUnlock(null), 2000);
        }, 2200);
        return updated.map(b => b.id === "master" ? { ...b, unlocked: true } : b);
      }
      return updated;
    });
  };

  // Listen for custom events from other components
  useEffect(() => {
    const handleUnlock = (e: CustomEvent<string>) => unlockBadge(e.detail);
    window.addEventListener("nird-unlock", handleUnlock as EventListener);
    return () => window.removeEventListener("nird-unlock", handleUnlock as EventListener);
  }, []);

  // Save badges to localStorage when they change
  useEffect(() => {
    saveBadges(badges);
  }, [badges]);

  // Track visited sections for badges
  const [visitedSections, setVisitedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const sections = ["hero", "comprendre", "quiz", "gamification"];
    
    const handleScroll = () => {
      const newVisited = new Set(visitedSections);
      
      sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.7 && rect.bottom > 0) {
            newVisited.add(sectionId);
          }
        }
      });

      // Unlock "curious" when comprendre is visited
      if (newVisited.has("comprendre")) {
        unlockBadge("curious");
      }

      // Unlock "resistant" when all sections visited
      if (sections.every(s => newVisited.has(s))) {
        unlockBadge("resistant");
      }

      setVisitedSections(newVisited);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check on mount
    return () => window.removeEventListener("scroll", handleScroll);
  }, [visitedSections]);

  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Vos badges</h3>
        <span className="text-sm text-muted-foreground">{unlockedCount}/{badges.length}</span>
      </div>
      
      {showUnlock && (
        <div className="mb-4 p-3 bg-secondary/20 border border-secondary/40 rounded-lg text-center animate-fade-up">
          <span className="text-secondary font-medium">
            🎉 Badge débloqué : {badges.find(b => b.id === showUnlock)?.name}
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={`p-3 rounded-lg text-center transition-all ${
              badge.unlocked 
                ? "bg-primary/10 border border-primary/30" 
                : "bg-muted/30 border border-border opacity-50"
            }`}
            title={badge.desc}
          >
            <span className={`text-2xl ${badge.unlocked ? "" : "grayscale"}`}>
              {badge.icon}
            </span>
            <p className="text-xs text-foreground mt-1 truncate">{badge.name}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
            style={{ width: `${(unlockedCount / badges.length) * 100}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {unlockedCount === badges.length 
            ? "🎉 Félicitations, vous êtes un Maître NIRD !" 
            : `Explorez le site pour débloquer tous les badges`}
        </p>
      </div>
    </div>
  );
};

export default AchievementBadges;

// Helper to trigger badge unlock from other components
export const triggerBadgeUnlock = (badgeId: string) => {
  window.dispatchEvent(new CustomEvent("nird-unlock", { detail: badgeId }));
};
