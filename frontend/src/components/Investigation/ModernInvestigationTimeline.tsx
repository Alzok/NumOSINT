'use client';

import React from 'react';
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/ui/timeline";

// Icônes pour les phases
const StartIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
    <line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
);

const EnrichmentIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    <line x1="11" y1="8" x2="11" y2="14"/>
    <line x1="8" y1="11" x2="14" y2="11"/>
  </svg>
);

const ScanIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
  </svg>
);

const ConsolidationIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    <path d="M2 8c0-2.2.7-4.3 2-6"/>
    <path d="M22 8c0-2.2-.7-4.3-2-6"/>
  </svg>
);

const CompletedIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const PHASES = [
  { 
    name: 'INITIALIZING', 
    label: 'Démarrage',
    Icon: StartIcon,
    description: 'Initialisation de l\'investigation'
  },
  { 
    name: 'ENRICHMENT', 
    label: 'Enrichissement',
    Icon: EnrichmentIcon,
    description: 'Collecte des données complémentaires'
  },
  { 
    name: 'SCANNING', 
    label: 'Scan',
    Icon: ScanIcon,
    description: 'Analyse des indicateurs'
  },
  { 
    name: 'CONSOLIDATION', 
    label: 'Consolidation',
    Icon: ConsolidationIcon,
    description: 'Consolidation des résultats'
  },
  { 
    name: 'COMPLETED', 
    label: 'Terminé',
    Icon: CompletedIcon,
    description: 'Investigation terminée'
  },
];

interface ModernInvestigationTimelineProps {
  currentPhase: string;
  status: 'COMPLETED' | 'FAILED' | 'CANCELLED' | string;
  createdAt?: string;
}

export default function ModernInvestigationTimeline({ 
  currentPhase, 
  status, 
  createdAt 
}: ModernInvestigationTimelineProps) {
  const isInitial = status === 'NONE' || !status;
  let currentPhaseIndex = PHASES.findIndex(p => p.name === currentPhase || p.name === status);
  
  if (isInitial) {
    currentPhaseIndex = 0; // Show first phase as current when no investigation
  }

  // Determine active step for the timeline (1-indexed)
  const activeStep = currentPhaseIndex + 1;

  // Generate dates for each phase (mock dates for display)
  const generatePhaseDate = (index: number) => {
    if (!createdAt) return '';
    
    const baseDate = new Date(createdAt);
    const phaseDate = new Date(baseDate);
    phaseDate.setMinutes(phaseDate.getMinutes() + (index * 15)); // 15 minutes per phase
    
    return phaseDate.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full">
      <Timeline defaultValue={activeStep} orientation="horizontal">
        {PHASES.map((phase, index) => {
          const step = index + 1;
          const isActive = step === activeStep;
          const isCompleted = step < activeStep;
          
          return (
            <TimelineItem
              key={phase.name}
              step={step}
              className="group-data-[orientation=horizontal]/timeline:mt-0"
            >
              <TimelineHeader>
                <TimelineSeparator className="group-data-[orientation=horizontal]/timeline:top-8" />
                <TimelineDate className="mb-10">
                  {createdAt ? generatePhaseDate(index) : ''}
                </TimelineDate>
                <TimelineTitle className="flex items-center gap-2">
                  <span className={`${isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {phase.label}
                  </span>
                </TimelineTitle>
                <TimelineIndicator className="group-data-[orientation=horizontal]/timeline:top-8 flex items-center justify-center bg-background">
                  <phase.Icon 
                    className={`${isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'}`}
                  />
                </TimelineIndicator>
              </TimelineHeader>
              <TimelineContent className="text-xs">
                {phase.description}
              </TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>
    </div>
  );
} 