import { motion, AnimatePresence } from 'framer-motion';
import Badge from '../ui/Badge';

export default function TurnBanner({ isMyTurn, activeNickname }: { isMyTurn: boolean; activeNickname: string }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -40, opacity: 0 }}
      >
        <Badge variant={isMyTurn ? 'success' : 'neutral'} dot className="text-sm px-5 py-2 font-bold shadow-2xl">
          {isMyTurn ? 'YOUR TURN — Click an adjacent tile' : `${activeNickname}'s turn`}
        </Badge>
      </motion.div>
    </AnimatePresence>
  );
}
