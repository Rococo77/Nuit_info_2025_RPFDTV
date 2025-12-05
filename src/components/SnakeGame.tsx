import { useState, useEffect, useCallback, useRef } from 'react';

interface Position {
  x: number;
  y: number;
}

interface Food {
  position: Position;
  type: 'windows' | 'google' | 'apple' | 'meta' | 'amazon';
}

const GRID_SIZE = 20;
const CELL_SIZE = 18;
const INITIAL_SPEED = 220;

const BIG_TECH_FOODS: { type: Food['type']; emoji: string; parody: string }[] = [
  { type: 'windows', emoji: '🪟', parody: 'Doors' },
  { type: 'google', emoji: '🔍', parody: 'Goofle' },
  { type: 'apple', emoji: '🍎', parody: 'Pear' },
  { type: 'meta', emoji: '👁️', parody: 'Zeta' },
  { type: 'amazon', emoji: '📦', parody: 'Nile' },
];

export const SnakeGame = ({ onClose }: { onClose: () => void }) => {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Food | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('nird-snake-highscore');
    return saved ? parseInt(saved) : 0;
  });
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const directionRef = useRef<Position>({ x: 1, y: 0 });

  const generateFood = useCallback((): Food => {
    const tech = BIG_TECH_FOODS[Math.floor(Math.random() * BIG_TECH_FOODS.length)];
    return {
      position: {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      },
      type: tech.type,
    };
  }, []);

  const resetGame = useCallback(() => {
    setSnake([{ x: 10, y: 10 }]);
    directionRef.current = { x: 1, y: 0 };
    setFood(generateFood());
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
  }, [generateFood]);

  useEffect(() => {
    setFood(generateFood());
  }, [generateFood]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      const d = directionRef.current;
      
      if ((e.key === 'ArrowUp' || e.key === 'z' || e.key === 'Z') && d.y !== 1) {
        directionRef.current = { x: 0, y: -1 };
      } else if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && d.y !== -1) {
        directionRef.current = { x: 0, y: 1 };
      } else if ((e.key === 'ArrowLeft' || e.key === 'q' || e.key === 'Q') && d.x !== 1) {
        directionRef.current = { x: -1, y: 0 };
      } else if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && d.x !== -1) {
        directionRef.current = { x: 1, y: 0 };
      } else if (e.key === ' ') {
        setIsPaused(p => !p);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, onClose]);

  useEffect(() => {
    if (gameOver || isPaused || !food) return;

    gameLoopRef.current = setInterval(() => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const newHead = {
          x: head.x + directionRef.current.x,
          y: head.y + directionRef.current.y,
        };

        // Collision murs
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
          setGameOver(true);
          if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('nird-snake-highscore', score.toString());
          }
          return prevSnake;
        }

        // Collision soi-même
        if (prevSnake.some(s => s.x === newHead.x && s.y === newHead.y)) {
          setGameOver(true);
          if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('nird-snake-highscore', score.toString());
          }
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        if (food && newHead.x === food.position.x && newHead.y === food.position.y) {
          setScore(s => s + 10);
          setFood(generateFood());
          return newSnake;
        }

        newSnake.pop();
        return newSnake;
      });
    }, INITIAL_SPEED);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameOver, isPaused, food, score, highScore, generateFood]);

  const currentFoodData = food ? BIG_TECH_FOODS.find(t => t.type === food.type) : null;
  const boardSize = GRID_SIZE * CELL_SIZE;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card p-4 rounded border border-primary">
        {/* Header minimal */}
        <div className="flex justify-between items-center mb-3 text-sm">
          <span className="text-primary font-bold">🐧 NIRD Snake</span>
          <span className="text-muted-foreground">Score: {score} | Record: {highScore}</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        {/* Board - rendu via CSS background au lieu de divs */}
        <div
          className="relative bg-black border border-border"
          style={{ width: boardSize, height: boardSize }}
        >
          {/* Snake - une seule div par segment */}
          {snake.map((seg, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: seg.x * CELL_SIZE,
                top: seg.y * CELL_SIZE,
                width: CELL_SIZE - 1,
                height: CELL_SIZE - 1,
                backgroundColor: i === 0 ? 'hsl(var(--primary))' : 'hsl(142, 60%, 40%)',
              }}
            />
          ))}

          {/* Food */}
          {food && currentFoodData && (
            <div
              className="absolute flex items-center justify-center text-sm"
              style={{
                left: food.position.x * CELL_SIZE,
                top: food.position.y * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
              }}
            >
              {currentFoodData.emoji}
            </div>
          )}

          {/* Overlays */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center">
              <p className="text-destructive font-bold mb-2">GAME OVER</p>
              <button 
                onClick={resetGame}
                className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded"
              >
                Rejouer
              </button>
            </div>
          )}
          {isPaused && !gameOver && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <span className="text-primary font-bold">PAUSE</span>
            </div>
          )}
        </div>

        {/* Légende compacte */}
        <div className="mt-3 flex justify-center gap-2 text-xs text-muted-foreground">
          {BIG_TECH_FOODS.map(t => (
            <span key={t.type}>{t.emoji} {t.parody}</span>
          ))}
        </div>
        
        {/* Contrôles */}
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Flèches/ZQSD • Espace=pause • Échap=quitter
        </p>
      </div>
    </div>
  );
};
