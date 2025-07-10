'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  PlayArrow,
  Stop,
  Delete,
  Visibility,
  Schedule,
  CheckCircleOutline,
  Cancel,
  Refresh,
  Timeline
} from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import { useInvestigation } from '@/hooks/useInvestigation';
import { useAppStore } from '@/lib/store';
import { Investigation } from '@/lib/investigation-api';

export default function ActiveInvestigations() {
  const { 
    investigations, 
    isLoading,
    loadInvestigations,
    startInvestigation,
    stopInvestigation,
    deleteInvestigation
  } = useInvestigation();
  
  const { addNotification } = useAppStore();

  useEffect(() => {
    loadInvestigations();
  }, [loadInvestigations]);

  const activeInvestigations = (investigations || []).filter(inv => 
    inv.status === 'INITIALIZING' || 
    inv.status === 'SCANNING' || 
    inv.status === 'ENRICHING'
  );

  const handleStartInvestigation = async (id: string) => {
    const success = await startInvestigation(id);
    if (success) {
      addNotification({
        type: 'success',
        title: 'Investigation démarrée',
        message: `L'investigation ${id} a été démarrée avec succès`
      });
    }
  };

  const handleStopInvestigation = async (id: string) => {
    const success = await stopInvestigation(id);
    if (success) {
      addNotification({
        type: 'success',
        title: 'Investigation arrêtée',
        message: `L'investigation ${id} a été arrêtée avec succès`
      });
    }
  };

  const handleDeleteInvestigation = async (id: string) => {
    const success = await deleteInvestigation(id);
    if (success) {
      addNotification({
        type: 'success',
        title: 'Investigation supprimée',
        message: `L'investigation ${id} a été supprimée avec succès`
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleOutline className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <Cancel className="h-4 w-4 text-red-500" />;
      case 'SCANNING':
      case 'ENRICHING':
        return <CircularProgress size={16} className="text-blue-500" />;
      default:
        return <Schedule className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="default" className="bg-green-100 text-green-800">Terminée</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Échouée</Badge>;
      case 'SCANNING':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Scan en cours</Badge>;
      case 'ENRICHING':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Enrichissement</Badge>;
      case 'INITIALIZING':
        return <Badge variant="outline">Initialisation</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  if (activeInvestigations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timeline className="h-5 w-5" />
            Investigations actives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Aucune investigation active
            </p>
            <Button onClick={() => loadInvestigations()} disabled={isLoading}>
              <Refresh className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timeline className="h-5 w-5" />
            Investigations actives ({activeInvestigations.length})
          </div>
          <Button onClick={() => loadInvestigations()} disabled={isLoading} size="sm">
            <Refresh className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeInvestigations.map((investigation) => (
            <div key={investigation.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(investigation.status)}
                  <div>
                    <h4 className="font-semibold">Investigation {investigation.id}</h4>
                    <p className="text-sm text-muted-foreground">
                      Créée le {formatDate(investigation.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(investigation.status)}
                </div>
              </div>

              {investigation.currentStep && (
                <div className="mb-3">
                  <p className="text-sm text-muted-foreground mb-2">
                    Étape actuelle: {investigation.currentStep}
                  </p>
                  <Progress value={investigation.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {investigation.progress}% terminé
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.location.href = `/investigation/${investigation.id}`}
                  >
                    <Visibility className="h-4 w-4 mr-1" />
                    Voir
                  </Button>
                  
                  {investigation.status === 'INITIALIZING' && (
                    <Button
                      size="sm"
                      onClick={() => handleStartInvestigation(investigation.id)}
                      disabled={isLoading}
                    >
                      <PlayArrow className="h-4 w-4 mr-1" />
                      Démarrer
                    </Button>
                  )}
                  
                  {(investigation.status === 'SCANNING' || investigation.status === 'ENRICHING') && (
                    <Button
                      size="sm"
                      onClick={() => handleStopInvestigation(investigation.id)}
                      variant="destructive"
                      disabled={isLoading}
                    >
                      <Stop className="h-4 w-4 mr-1" />
                      Arrêter
                    </Button>
                  )}
                </div>
                
                <Button
                  size="sm"
                  onClick={() => handleDeleteInvestigation(investigation.id)}
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Delete className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}