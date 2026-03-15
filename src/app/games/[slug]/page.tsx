import GameWrapper from '@/components/GameWrapper';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';



// Dynamically import games to avoid large initial bundle sizes
const CandyMatch = dynamic(() => import('@/components/games/CandyMatch'), { loading: () => <LoadingSpinner /> });
const BubblePop = dynamic(() => import('@/components/games/BubblePop'), { loading: () => <LoadingSpinner /> });
const ScooterRun = dynamic(() => import('@/components/games/ScooterRun'), { loading: () => <LoadingSpinner /> });
const DiceRoll = dynamic(() => import('@/components/games/DiceRoll'), { loading: () => <LoadingSpinner /> });
const GhostLeg = dynamic(() => import('@/components/games/GhostLeg'), { loading: () => <LoadingSpinner /> });
const DrawingLots = dynamic(() => import('@/components/games/DrawingLots'), { loading: () => <LoadingSpinner /> });
const Gomoku = dynamic(() => import('@/components/games/Gomoku'), { loading: () => <LoadingSpinner /> });

const GAME_COMPONENTS: Record<string, React.ComponentType> = {
  'candy-match': CandyMatch,
  'bubble-pop': BubblePop,
  'scooter-run': ScooterRun,
  'dice-roll': DiceRoll,
  'ghost-leg': GhostLeg,
  'drawing-lots': DrawingLots,
  'gomoku': Gomoku,
};

function LoadingSpinner() {
  return (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-sky-500 animate-spin" />
    </div>
  );
}

export default async function GamePage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;

  const GameComponent = GAME_COMPONENTS[slug];

  if (!GameComponent) {
    notFound();
  }

  // Format title from slug
  const title = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <GameWrapper title={title}>
       <GameComponent />
    </GameWrapper>
  );
}
