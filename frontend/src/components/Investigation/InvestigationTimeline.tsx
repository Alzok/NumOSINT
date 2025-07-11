'use client';

import React from 'react';
import { motion } from 'framer-motion';

// --- Icônes améliorées ---
const StartIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
);

const EnrichmentIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
);

const ScanIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
);

const ConsolidationIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M2 8c0-2.2.7-4.3 2-6"/><path d="M22 8c0-2.2-.7-4.3-2-6"/></svg>
);

const CompletedIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);

const PHASES = [
  { name: 'INITIALIZING', label: 'Démarrage', Icon: StartIcon },
  { name: 'ENRICHMENT', label: 'Enrichissement', Icon: EnrichmentIcon },
  { name: 'SCANNING', label: 'Scan', Icon: ScanIcon },
  { name: 'CONSOLIDATION', label: 'Consolidation', Icon: ConsolidationIcon },
  { name: 'COMPLETED', label: 'Terminé', Icon: CompletedIcon },
];

interface InvestigationTimelineProps {
  currentPhase: string;
  status: 'COMPLETED' | 'FAILED' | 'CANCELLED' | string;
}

export default function InvestigationTimeline({ currentPhase, status }: InvestigationTimelineProps) {
  const isInitial = status === 'NONE' || !status;
  let currentPhaseIndex = PHASES.findIndex(p => p.name === currentPhase || p.name === status);
  if (isInitial) {
    currentPhaseIndex = -1; // Ensure no phase is active in initial state
  }
  const isFinished = status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED';

  return (
    <div className="w-full px-4 py-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex items-center">
        {PHASES.map((phase, index) => {
          const isCompleted = isFinished ? index <= currentPhaseIndex : (currentPhaseIndex > -1 && index < currentPhaseIndex);
          const isActive = index === currentPhaseIndex && !isFinished && !isInitial;

          const circleColor = isCompleted || isActive ? 'bg-blue-600 border-blue-700 text-white shadow-lg' : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400';
          const textColor = isCompleted || isActive ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400';
          const lineColor = isCompleted ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600';

          return (
            <React.Fragment key={phase.name}>
              <div className="flex flex-col items-center text-center">
                <motion.div
                  animate={{ scale: isActive ? 1.15 : 1, y: isActive ? -5 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${circleColor}`}
                >
                  <phase.Icon className="w-6 h-6" />
                </motion.div>
                <p className={`mt-2 text-xs sm:text-sm font-medium transition-colors duration-300 ${textColor}`}>
                  {phase.label}
                </p>
              </div>

              {index < PHASES.length - 1 && (
                <div className={`flex-1 h-1.5 mx-2 rounded-full ${lineColor}`}>
                  <motion.div
                    className="h-full bg-blue-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: isCompleted ? '100%' : (isActive ? '50%' : '0%') }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}