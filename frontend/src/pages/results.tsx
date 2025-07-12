"use client";

import { useEffect, useState, useCallback } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorOutline, ChevronLeft, ChevronRight, FilterList } from '@mui/icons-material';
import { Trash2, ChevronDown } from 'lucide-react';
import { investigationAPI, PaginationInfo, ToolInfo } from '@/lib/investigation-api';
import { UnifiedResultsTable, ProofItem } from '@/components/Results/UnifiedResultsTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';

interface InvestigationWithSummary {
  id: string;
  name: string;
  createdAt: string;
  status: string;
  summary: ProofItem[];
  _count: {
    results: number;
  };
}

export default function AllResultsPage() {
  const [investigations, setInvestigations] = useState<InvestigationWithSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedInvestigationId, setSelectedInvestigationId] = useState<string | null>(null);
  const [tools, setTools] = useState<ToolInfo[]>([]);

  // State for filters
  const [filters, setFilters] = useState({
    status: 'all',
    tools: [] as string[],
    startDate: '',
    endDate: '',
    indicatorType: 'all',
  });

  const fetchGroupedResults = useCallback(async (page: number, currentFilters: typeof filters) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page, limit: 10 };
      if (currentFilters.status && currentFilters.status !== 'all') params.status = currentFilters.status;
      if (currentFilters.tools.length > 0) params.tools = currentFilters.tools.join(',');
      if (currentFilters.indicatorType && currentFilters.indicatorType !== 'all') params.indicatorType = currentFilters.indicatorType;
      if (currentFilters.startDate) params.startDate = currentFilters.startDate;
      if (currentFilters.endDate) params.endDate = currentFilters.endDate;
      
      const response = await investigationAPI.getGroupedResults(params);
      if (response.data) {
        setInvestigations(response.data.investigations);
        setPagination(response.data.pagination);
      } else {
        setError(response.error || 'Une erreur est survenue lors de la récupération des résultats.');
      }
    } catch (err) {
      setError('Impossible de charger les résultats.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    investigationAPI.listTools().then(res => {
      if (res.data) setTools(res.data);
    });
  }, []);

  useEffect(() => {
    fetchGroupedResults(currentPage, filters);
  }, [currentPage, filters, fetchGroupedResults]);

  const handleFilterChange = (key: keyof typeof filters, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleToolToggle = (toolName: string) => {
    const newTools = filters.tools.includes(toolName)
      ? filters.tools.filter(t => t !== toolName)
      : [...filters.tools, toolName];
    handleFilterChange('tools', newTools);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const handleDeleteClick = (investigationId: string) => {
    setSelectedInvestigationId(investigationId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedInvestigationId) return;
    
    const response = await investigationAPI.deleteInvestigation(selectedInvestigationId);
    if (response.data) {
      // Refresh data
      fetchGroupedResults(currentPage, filters);
    } else {
      setError(response.error || "Erreur lors de la suppression de l'investigation.");
    }
    setIsDeleteDialogOpen(false);
    setSelectedInvestigationId(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Résultats par Investigation</CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilterList />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="COMPLETED">Terminé</SelectItem>
                <SelectItem value="FAILED">Échoué</SelectItem>
                <SelectItem value="CANCELLED">Annulé</SelectItem>
                <SelectItem value="SCANNING">En cours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Outils</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>{filters.tools.length > 0 ? `${filters.tools.length} sélectionné(s)` : 'Sélectionner des outils'}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                {Array.isArray(tools) && tools.map(tool => (
                  <DropdownMenuCheckboxItem
                    key={tool.id}
                    checked={filters.tools.includes(tool.name)}
                    onCheckedChange={() => handleToolToggle(tool.name)}
                  >
                    {tool.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="space-y-2">
            <Label htmlFor="indicatorType">Type de résultat</Label>
            <Select value={filters.indicatorType} onValueChange={(value) => handleFilterChange('indicatorType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="PHONE">Téléphone</SelectItem>
                <SelectItem value="IP">IP</SelectItem>
                <SelectItem value="DOMAIN">Domaine</SelectItem>
                <SelectItem value="URL">URL</SelectItem>
                <SelectItem value="USERNAME">Username</SelectItem>
                <SelectItem value="NAME">Nom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">Date de début</Label>
            <Input id="startDate" type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Date de fin</Label>
            <Input id="endDate" type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      )}
      {error && (
        <Alert variant="destructive">
          <ErrorOutline className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {!loading && !error && (
        <Accordion type="single" collapsible className="w-full">
          {investigations.map((inv) => (
            <AccordionItem value={inv.id} key={inv.id}>
              <AccordionTrigger>
                <div className="flex justify-between w-full pr-4 items-center">
                  <div className="flex flex-col items-start">
                    <span className="font-bold text-lg">{inv.name}</span>
                    <Badge>{inv.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">Résultats: {inv._count.results}</Badge>
                    <Badge variant="secondary">{formatDate(inv.createdAt)}</Badge>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteClick(inv.id); }}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="p-4 bg-muted/40 rounded-md">
                  <UnifiedResultsTable items={inv.summary} />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
     )}
     {!loading && !error && pagination && pagination.totalPages > 1 && (
       <div className="flex items-center justify-end space-x-2 py-4">
         <Button
           variant="outline"
           size="sm"
           onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
           disabled={!pagination.hasPrev}
         >
           <ChevronLeft className="h-4 w-4" />
           Précédent
         </Button>
         <span className="text-sm">
           Page {pagination.page} sur {pagination.totalPages}
         </span>
         <Button
           variant="outline"
           size="sm"
           onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
           disabled={!pagination.hasNext}
         >
           Suivant
           <ChevronRight className="h-4 w-4" />
         </Button>
       </div>
     )}

     <ConfirmDialog
       isOpen={isDeleteDialogOpen}
       onClose={() => setIsDeleteDialogOpen(false)}
       onConfirm={handleDeleteConfirm}
       title="Êtes-vous sûr ?"
       description="Cette action est irréversible. L'investigation et tous les résultats associés seront définitivement supprimés."
     />
   </div>
 );
}