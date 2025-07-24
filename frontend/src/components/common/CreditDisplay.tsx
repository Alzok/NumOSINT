'use client';

import { Coins } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCounter } from './AnimatedCounter';
import { useAppStore } from '@/lib/store';
import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';

interface CreditDisplayProps {
  credits: number | undefined | null;
  isLoading?: boolean;
}

export function CreditDisplay({ credits, isLoading }: CreditDisplayProps) {
  const tokenAnimation = useAppStore((state) => state.tokenAnimation);
  const controls = useAnimation();

  useEffect(() => {
    if (tokenAnimation > 0) {
      controls.start({
        x: [0, -5, 5, -5, 5, 0],
        transition: { duration: 0.4 },
        borderColor: ["#ef4444", "#f87171", "#ef4444"],
      });
    }
  }, [tokenAnimation, controls]);


  if (isLoading) {
    return <Skeleton className="h-8 w-20 rounded-md" />;
  }

  return (
    <motion.div
      animate={controls}
      className="flex items-center gap-3 text-2xl font-bold"
    >
      <AnimatedCounter value={credits ?? 0} />
      <Coins className="h-6 w-6 text-yellow-400" />
      <span className="hidden">Jetons</span>
    </motion.div>
  );
}