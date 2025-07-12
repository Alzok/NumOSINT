'use client';

import React from 'react';
import { InvestigationLog } from '@/lib/investigation-api';
import {
  CheckCircle, Hourglass, PlayCircle, Search, AlertCircle, Database, FileText,
  ArrowRightCircle, SlidersHorizontal, Check, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Helper Functions ---

const getIconForStep = (step: string, level: string) => {
  if (level === 'ERROR') return X;
  if (step.includes('success')) return Check;
  if (step.includes('completed')) return CheckCircle;
  if (step.includes('dispatch')) return ArrowRightCircle;
  if (step.includes('enrich')) return Search;
  if (step.includes('scan')) return FileText;
  if (step.includes('consolidation')) return Database;
  if (step.includes('phase_update')) return SlidersHorizontal;
  if (step.includes('start') || step.includes('init')) return PlayCircle;
  return Hourglass;
};

const getColorForLevel = (level: string) => {
  switch (level) {
    case 'ERROR': return 'text-red-500';
    case 'SUCCESS': return 'text-green-500';
    case 'WARNING': return 'text-yellow-500';
    case 'INFO': return 'text-blue-500';
    case 'DEBUG': return 'text-gray-500';
    default: return 'text-muted-foreground';
  }
};

const formatTimelineDate = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatStepDetails = (log: InvestigationLog): { title: string; description: string } => {
    const { step, message, metadata } = log;
    const toolName = metadata?.tool || '';

    switch (step) {
        case 'investigation_start': return { title: "Début", description: "Lancement de l'enquête." };
        case 'enrichment_dispatch': return { title: "Enrichissement", description: `Recherche de nouveaux indicateurs.` };
        case 'tool_success': return { title: toolName, description: `Analyse terminée.` };
        case 'tool_failure': return { title: toolName, description: `Échec de l'analyse.` };
        case 'phase_update': return { title: "Nouvelle Phase", description: message };
        case 'consolidation': return { title: "Consolidation", description: "Analyse des résultats." };
        case 'investigation_completed': return { title: "Terminée", description: "Rapport disponible." };
        default: return { title: step.replace(/_/g, ' '), description: message };
    }
};

// --- Component Interfaces ---

interface ModernInvestigationTimelineProps {
  logs: InvestigationLog[];
}

interface TimelineStep {
  id: string;
  title: string;
  description: string;
  date: string;
  Icon: React.ElementType;
  color: string;
}

// --- Main Component ---

export default function ModernInvestigationTimeline({ logs }: ModernInvestigationTimelineProps) {
  if (!logs || logs.length === 0) {
    return (
      <div className="flex items-center justify-center text-muted-foreground py-8">
        <Hourglass className="w-5 h-5 mr-2" />
        <span>En attente des premiers logs de l'investigation...</span>
      </div>
    );
  }

  // Filtrer et regrouper les logs pour la timeline
  const keySteps = ['investigation_start', 'enrichment_dispatch', 'consolidation', 'investigation_completed', 'tool_success', 'tool_failure'];
  const relevantLogs = logs.filter(log => keySteps.includes(log.step));

  const uniqueLogsMap = new Map<string, InvestigationLog>();
  relevantLogs.forEach(log => {
    const key = log.metadata?.tool || log.step;
    uniqueLogsMap.set(key, log);
  });

  const finalLogs = Array.from(uniqueLogsMap.values())
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const timelineSteps: TimelineStep[] = finalLogs.map((log) => {
      const { title, description } = formatStepDetails(log);
      return {
        id: log.id,
        title,
        description,
        date: formatTimelineDate(log.timestamp),
        Icon: getIconForStep(log.step.toLowerCase(), log.level),
        color: getColorForLevel(log.level),
      };
    });

  const activeStepIndex = timelineSteps.length - 1;

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="relative flex min-w-max px-10">
        {timelineSteps.map((step, index) => {
          const isCompleted = index < activeStepIndex;
          const itemColor = isCompleted ? 'text-green-600' : step.color;
          const isLast = index === timelineSteps.length - 1;

          return (
            <div key={step.id} className="relative flex-1 min-w-48">
              {/* Ligne de connexion */}
              {!isLast && (
                <div className={cn(
                  "absolute top-16 left-1/2 w-full h-0.5",
                  isCompleted ? "bg-green-600" : "bg-gray-200 dark:bg-gray-700"
                )} />
              )}

              <div className="relative flex flex-col items-center text-center">
                {/* Titre et Date */}
                <div className="h-12">
                  <p className="text-sm font-bold">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.date}</p>
                </div>

                {/* Indicateur (cercle + icône) */}
                <div className={cn(
                  "w-10 h-10 rounded-full border-2 flex items-center justify-center bg-background z-10",
                  isCompleted ? "border-green-600" : "border-gray-300 dark:border-gray-600"
                )}>
                  <step.Icon className={cn("h-5 w-5", itemColor)} />
                </div>

                {/* Description */}
                <p className="text-xs mt-2 h-12 text-muted-foreground overflow-hidden">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}