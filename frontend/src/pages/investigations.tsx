'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useInvestigationsList } from '@/hooks/useInvestigationsList';
import { useInvestigationActions } from '@/hooks/useInvestigationActions';
import { useCases } from '@/hooks/useCases';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api-client';
import type { Investigation, Case } from '@/types';
import { CreateCaseModal } from '@/components/Investigation/CreateCaseModal';
import { AssignCaseModal } from '@/components/Investigation/AssignCaseModal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// --- Local SVG Icon Components ---
const RefreshIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
);
const FolderIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.23A2 2 0 0 0 8.27 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
);
const AddIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);
const CheckCircleOutlineIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);
const CancelIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
);
const CreditCardIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M2 11h20" /></svg>
);
const ScheduleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
const PersonIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M16 12v1a3 3 0 0 0 6 0v-1a10 10 0 1 0 -3.92 7.94" /></svg>
);
const EmailIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" /><path d="M3 7l9 6l9 -6" /></svg>
);
const PhoneIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" /></svg>
);
const ArticleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"/></svg>
);
const VisibilityIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
);
const CircularProgress = (props: { size?: number, color?: string, className?: string }) => (
    <svg className={props.className} style={{ width: props.size, height: props.size }} viewBox="22 22 44 44">
        <circle cx="44" cy="44" r="20.2" fill="none" strokeWidth="3.6" stroke="currentColor" strokeDasharray="80px, 200px" strokeDashoffset="0px"></circle>
    </svg>
);

const InvestigationCard = ({ investigation, onAssignClick, onStopClick, onDeleteClick }: { investigation: Investigation, onAssignClick: (investigation: Investigation) => void, onStopClick: (investigationId: string) => void, onDeleteClick: (investigationId: string) => void }) => {
    const router = useRouter();

    const getPhaseInfo = (phase: Investigation['currentPhase']) => {
        switch (phase) {
            case 'ENRICHMENT': return { label: 'Phase 1: Enrichissement', color: 'bg-yellow-100 text-yellow-800', icon: <PersonIcon className="h-4 w-4" /> };
            case 'SCANNING': return { label: 'Phase 2: Scan', color: 'bg-blue-100 text-blue-800', icon: <ArticleIcon className="h-4 w-4" /> };
            case 'CONSOLIDATION': return { label: 'Phase 3: Consolidation', color: 'bg-purple-100 text-purple-800', icon: <CheckCircleOutlineIcon className="h-4 w-4" /> };
            default: return { label: 'En attente', color: 'bg-gray-100 text-gray-800', icon: <ScheduleIcon className="h-4 w-4" /> };
        }
    };

    const getStatusIcon = (status: Investigation['status']) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircleOutlineIcon className="h-5 w-5 text-green-500" />;
            case 'FAILED': return <CancelIcon className="h-5 w-5 text-red-500" />;
            case 'CANCELLED': return <CancelIcon className="h-5 w-5 text-yellow-500" />;
            case 'SCANNING': case 'ENRICHING': case 'CONSOLIDATING': return <CircularProgress size={20} color="inherit" className="animate-spin" />;
            default: return <ScheduleIcon className="h-5 w-5 text-gray-500" />;
        }
    };

    const getStatusBadge = (investigation: Investigation) => {
        const { status, currentPhase, error } = investigation;
        const phaseInfo = getPhaseInfo(currentPhase);
        switch (status) {
            case 'COMPLETED': return <Badge variant="default" className="bg-green-100 text-green-800">Terminée</Badge>;
            case 'FAILED':
                if (error) {
                    return (
                        <Tooltip>
                            <TooltipTrigger>
                                <Badge variant="destructive" className="cursor-help">Échouée</Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs break-words">{error}</p>
                            </TooltipContent>
                        </Tooltip>
                    );
                }
                return <Badge variant="destructive">Échouée</Badge>;
            case 'CANCELLED': return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Annulée</Badge>;
            case 'ENRICHING':
            case 'SCANNING':
            case 'CONSOLIDATING':
                return <Badge variant="default" className={phaseInfo.color}>{phaseInfo.label}</Badge>;
            case 'INITIALIZING': return <Badge variant="outline">Initialisation</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };
    const formatDate = (dateString: string) => new Date(dateString).toLocaleString('fr-FR');
    const getPrimaryTarget = (inv: Investigation) => {
        const { inputData } = inv;
        if (!inputData) return { type: 'ID', value: inv.id, icon: <ArticleIcon className="h-4 w-4" /> };
        if (inputData.names?.[0]) return { type: 'Nom', value: inputData.names[0], icon: <PersonIcon className="h-4 w-4" /> };
        if (inputData.emails?.[0]) return { type: 'Email', value: inputData.emails[0], icon: <EmailIcon className="h-4 w-4" /> };
        if (inputData.usernames?.[0]) return { type: 'Username', value: inputData.usernames[0], icon: <PersonIcon className="h-4 w-4" /> };
        if (inputData.phones?.[0]) return { type: 'Téléphone', value: inputData.phones[0], icon: <PhoneIcon className="h-4 w-4" /> };
        return { type: 'ID', value: inv.id, icon: <ArticleIcon className="h-4 w-4" /> };
    };
    const primaryTarget = getPrimaryTarget(investigation);

    return (
        <Card key={investigation.id} className="hover:shadow-lg transition-shadow flex flex-col cursor-pointer">
            <CardHeader>
                <CardTitle className="flex items-start justify-between">
                    <div className="flex flex-col items-start">
                        <div className="flex items-center gap-2">
                            {getStatusIcon(investigation.status)}
                            <span className="truncate font-semibold">{primaryTarget.value}</span>
                        </div>
                        <div className="mt-1">
                            {getStatusBadge(investigation)}
                        </div>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
                <div className="text-sm text-muted-foreground space-y-2">
                    <div className="flex items-center gap-2">
                        {primaryTarget.icon}
                        <span>{primaryTarget.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ScheduleIcon className="h-4 w-4" />
                        <span>{formatDate(investigation.createdAt)}</span>
                    </div>
                    {investigation.inputData?.cost && (
                        <div className="flex items-center gap-2 mt-2">
                            <CreditCardIcon className="h-4 w-4" />
                            <span>Coût: {investigation.inputData.cost} jeton(s)</span>
                        </div>
                    )}
                </div>
                {(investigation.status === 'SCANNING' || investigation.status === 'ENRICHING' || investigation.status === 'CONSOLIDATING') && (
                    <div className="mt-4">
                        <Progress value={investigation.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1 text-right">
                            {investigation.progress}% - {investigation.currentStep}
                        </p>
                    </div>
                )}
            </CardContent>
            <div className="p-6 pt-0 mt-auto">
                <div className="flex items-center justify-between">
                    <Button size="sm" onClick={() => router.push(`/investigation/${investigation.id}`)} variant="outline">
                        <VisibilityIcon className="h-4 w-4 mr-1" />
                        Détails
                    </Button>
                    <div className="flex items-center gap-1">
                        {(investigation.status === 'SCANNING' || investigation.status === 'ENRICHING' || investigation.status === 'CONSOLIDATING' || investigation.status === 'INITIALIZING') && (
                            <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); onStopClick(investigation.id); }}>
                                <CancelIcon className="h-4 w-4 mr-1" />
                                Annuler
                            </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onAssignClick(investigation); }}>Gérer</Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onDeleteClick(investigation.id); }}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
};

const CaseCard = ({ caseItem, onDeleteClick }: { caseItem: Case, onDeleteClick: (caseId: string) => void }) => {
    const router = useRouter();

    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push(`/case/${caseItem.id}`)}>
                        <FolderIcon className="h-6 w-6" />
                        <span className="truncate">{caseItem.name}</span>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={(e) => { e.stopPropagation(); onDeleteClick(caseItem.id); }}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-muted-foreground text-sm line-clamp-2">{caseItem.description || 'Aucune description.'}</p>
            </CardContent>
            <div className="p-6 pt-0 mt-auto">
                <Badge>{caseItem.investigations.length} investigation{caseItem.investigations.length > 1 ? 's' : ''}</Badge>
            </div>
        </Card>
    )
}

const CreateCaseCard = ({ onClick }: { onClick: () => void }) => {
    return (
        <Card
            className="cursor-pointer hover:shadow-lg transition-shadow flex flex-col items-center justify-center text-center p-4 border-dashed border-2 hover:border-primary h-full min-h-[220px]"
            onClick={onClick}
        >
            <div className="flex flex-col items-center justify-center h-full p-4">
                <div className="mb-3 p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <AddIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="text-md font-semibold">Créer un dossier</h3>
                <p className="text-xs text-muted-foreground mt-1">
                    Organisez vos investigations
                </p>
            </div>
        </Card>
    )
}

export default function InvestigationsPage() {
  const router = useRouter();
  const { investigations, isLoading: isLoadingInvestigations, refreshInvestigations: loadInvestigations } = useInvestigationsList();
  const { stopInvestigation, deleteInvestigation } = useInvestigationActions();
  const { cases, isLoading: isLoadingCases, refetchCases, createCase, updateCaseInvestigations } = useCases();
  const { addToastNotification } = useAppStore();
  const [isCreateModalOpen, setCreateIsModalOpen] = useState(false);
  const [isAssignModalOpen, setAssignIsModalOpen] = useState(false);
  const [selectedInvestigation, setSelectedInvestigation] = useState<Investigation | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'investigation' | 'case' | null>(null);

  useEffect(() => {
    loadInvestigations();
    refetchCases();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredInvestigations = useMemo(() => {
    const statusFilter = router.query.status as string;
    if (!statusFilter) return investigations;

    if (statusFilter === 'active') {
      return investigations.filter(inv => ['SCANNING', 'ENRICHING', 'CONSOLIDATING'].includes(inv.status));
    }
    if (statusFilter === 'completed') {
      return investigations.filter(inv => inv.status === 'COMPLETED');
    }
    return investigations;
  }, [router.query.status, investigations]);

  const unclassifiedInvestigations = useMemo(() =>
    filteredInvestigations.filter(inv => !inv.caseId),
    [filteredInvestigations]
  );
  const isLoading = isLoadingInvestigations || isLoadingCases;

  const handleAssignClick = (investigation: Investigation) => {
    setSelectedInvestigation(investigation);
    setAssignIsModalOpen(true);
  };

  const handleStopClick = async (investigationId: string) => {
    await stopInvestigation(investigationId);
  };

  const handleDeleteClick = (id: string, type: 'investigation' | 'case') => {
    setDeletingItemId(id);
    setDeleteType(type);
    setIsDeleteDialogOpen(true);
  };

  const { data: session } = useSession();
  const token = session?.accessToken;

  const handleDeleteConfirm = async () => {
    if (!deletingItemId || !deleteType) return;
    try {
      if (deleteType === 'investigation') {
        await deleteInvestigation(deletingItemId);
      } else {
        await api.deleteCase(deletingItemId, token);
      }
      addToastNotification({ type: 'success', title: 'Suppression réussie', message: `${deleteType === 'investigation' ? 'L\'investigation' : 'Le dossier'} a été supprimé(e).` });
      loadInvestigations();
      refetchCases();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      addToastNotification({ type: 'error', title: 'Erreur de suppression', message: `Impossible de supprimer ${deleteType === 'investigation' ? 'l\'investigation' : 'le dossier'}.` });
    }
    setIsDeleteDialogOpen(false);
    setDeletingItemId(null);
    setDeleteType(null);
  };

  const handleAssignSubmit = async (caseId: string | null, investigationId: string) => {
    if (!caseId) return false;
    try {
      await updateCaseInvestigations({ caseId, investigationIdsToConnect: [investigationId] });
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleCreateCase = async (name: string, description: string, investigationIds: string[]) => {
    try {
      const newCase = await createCase({ name, description });
      if (newCase.data && investigationIds.length > 0) {
        for (const invId of investigationIds) {
          await updateCaseInvestigations({ caseId: newCase.data.id, investigationIdsToConnect: [invId] });
        }
      }
      return true;
    } catch (error) {
      console.error("Failed to create case or assign investigations", error);
      return false;
    }
  };

  if (isLoading) {
    return <div className="container mx-auto py-10"><p>Chargement...</p></div>;
  }

  if (investigations.length === 0) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h2 className="text-2xl font-semibold mb-4">Aucune investigation trouvée</h2>
        <p className="text-muted-foreground mb-6">
          Commencez par lancer votre première investigation depuis la page d'accueil.
        </p>
        <Button asChild>
          <Link href="/">Lancer une première investigation</Link>
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="flex items-center justify-between">
            <div>
            <h1 className="text-3xl font-bold tracking-tight">Investigations & Dossiers</h1>
            <p className="text-muted-foreground">
              Gérez et consultez vos investigations et regroupez-les dans des dossiers.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { loadInvestigations(); refetchCases(); }} disabled={isLoading}>
              <RefreshIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6">
        {isLoading && cases.length === 0 && unclassifiedInvestigations.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <CircularProgress size={32} color="inherit" />
          </div>
        ) : (
          <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-semibold mb-4">Dossiers</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.isArray(cases) && cases.map(caseItem => (
                        <CaseCard key={caseItem.id} caseItem={caseItem} onDeleteClick={(id) => handleDeleteClick(id, 'case')} />
                    ))}
                    <CreateCaseCard onClick={() => setCreateIsModalOpen(true)} />
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-semibold mb-4">Investigations non classées</h2>
                {unclassifiedInvestigations.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {unclassifiedInvestigations.map((investigation) => (
                            <InvestigationCard key={investigation.id} investigation={investigation} onAssignClick={handleAssignClick} onStopClick={handleStopClick} onDeleteClick={(id) => handleDeleteClick(id, 'investigation')} />
                        ))}
                    </div>
                )}

                {cases.length === 0 && unclassifiedInvestigations.length === 0 && (
                     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        <Card
                            className="cursor-pointer hover:shadow-lg transition-shadow flex flex-col items-center justify-center text-center p-4 border-dashed border-2 hover:border-primary h-full min-h-[220px]"
                            onClick={() => router.push('/#investigation-form')}
                        >
                            <div className="flex flex-col items-center justify-center h-full p-4">
                                <div className="mb-3 p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                                    <AddIcon className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <h3 className="text-md font-semibold">Nouvelle Investigation</h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Cliquez pour lancer une analyse
                                </p>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
          </div>
        )}
      </div>
      <CreateCaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateIsModalOpen(false)}
        onCreate={handleCreateCase}
        investigations={unclassifiedInvestigations}
        isLoading={isLoadingCases}
      />
      <AssignCaseModal
        isOpen={isAssignModalOpen}
        onClose={() => setAssignIsModalOpen(false)}
        onAssign={handleAssignSubmit}
        investigation={selectedInvestigation}
        cases={cases}
        isLoading={isLoadingCases}
      />
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={`Supprimer ${deleteType === 'case' ? 'le dossier' : 'l\'investigation'} ?`}
        description="Cette action est irréversible et supprimera toutes les données associées."
      />
    </div>
    </TooltipProvider>
  );
}