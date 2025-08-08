'use client';

import { useSession } from 'next-auth/react';
import { CreditDisplay } from './CreditDisplay';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import Silk from '@/components/ui/Backgrounds/Silk/Silk';

export function FloatingTokenDisplay() {
  const { data: session, status } = useSession();

  console.log('[Debug] Session object in FloatingTokenDisplay:', session);

  if (status === 'loading') {
    return (
      <div>
        <Card>
          <CardContent className="p-2">
            <CreditDisplay credits={null} isLoading={true} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return null;
  }

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 120 }}
    >
      <Link href="/store" passHref>
        <Card className="cursor-pointer transition-transform hover:scale-105 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden rounded-md">
            <Silk
              speed={4}
              scale={0.8}
              color="#6B6B6B"
              noiseIntensity={10}
              rotation={0}
            />
          </div>
          <CardContent className="p-2 relative z-10">
            <CreditDisplay credits={session.user?.credits} isLoading={false} />
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}