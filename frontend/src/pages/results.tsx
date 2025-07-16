"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorOutline, ChevronLeft, ChevronRight, FilterList } from '@mui/icons-material';
import { Trash2, ChevronDown } from 'lucide-react';
import { UnifiedResultsTable, ProofItem } from '@/components/Results/UnifiedResultsTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Slider } from "@/components/ui/slider";
import { api } from '@/lib/api-client';
import { PaginationInfo, ToolInfo } from '@/types';

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
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedInvestigationId, setSelectedInvestigationId] = useState<string | null>(null);
  const [tools, setTools] = useState<ToolInfo[]>([]);

  // State for filters
  const [filters, setFilters] = useState({
    name: '',
    status: 'all',
    tools: [] as string[],
    startDate: '',
    endDate: '',
    indicatorType: 'all',
    confidence: [0, 100],
  });

  const { data: session } = useSession();
  const token = session?.accessToken;

  const fetchGroupedResults = useCallback(async (page: number, currentFilters: typeof filters, append = false) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params: any = { page, limit: 10 };
      if (currentFilters.name) params.name = currentFilters.name;
      if (currentFilters.status && currentFilters.status !== 'all') params.status = currentFilters.status;
      if (currentFilters.tools.length > 0) params.tools = currentFilters.tools.join(',');
      if (currentFilters.indicatorType && currentFilters.indicatorType !== 'all') params.indicatorType = currentFilters.indicatorType;
      if (currentFilters.startDate) params.startDate = currentFilters.startDate;
      if (currentFilters.endDate) params.endDate = currentFilters.endDate;
      if (currentFilters.confidence) {
        params.minConfidence = currentFilters.confidence[0];
        params.maxConfidence = currentFilters.confidence[1];
      }
      
      const response = await api.getGroupedResults(params, token);
      if (response.data) {
        setInvestigations(prev => append ? [...prev, ...response.data.investigations] : response.data.investigations);
        setPagination(response.data.pagination);
        setHasMore(response.data.pagination.hasNext);
      } else {
        setError(response.error || 'Une erreur est survenue lors de la récupération des résultats.');
        setHasMore(false);
      }
    } catch (err) {
      setError('Impossible de charger les résultats.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      api.listTools(token).then(res => {
        if (res.data) setTools(res.data);
      });
    }
  }, [token]);

  useEffect(() => {
    setInvestigations([]);
    setCurrentPage(1);
    setHasMore(true);
    fetchGroupedResults(1, filters, false);
  }, [filters, fetchGroupedResults]);

  useEffect(() => {
    if (currentPage > 1) {
      fetchGroupedResults(currentPage, filters, true);
    }
  }, [currentPage, filters, fetchGroupedResults]);

  const lastInvestigationElementRef = useCallback((node: HTMLElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setCurrentPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const handleFilterChange = (key: keyof typeof filters, value: string | string[] | number[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
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
    if (!selectedInvestigationId || !token) return;
    
    const response = await api.deleteInvestigation(selectedInvestigationId, token);
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
            <Label htmlFor="name">Nom de l'investigation</Label>
            <Input id="name" placeholder="Rechercher par nom..." value={filters.name} onChange={(e) => handleFilterChange('name', e.target.value)} />
          </div>
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
          <div className="space-y-2 col-span-1 sm:col-span-2 md:col-span-2">
            <Label htmlFor="confidence">Score de confiance</Label>
            <div className="flex items-center gap-4">
              <Slider
                id="confidence"
                min={0}
                max={100}
                step={1}
                value={filters.confidence}
                onValueChange={(value) => handleFilterChange('confidence', value)}
                className="w-full"
              />
              <span className="text-sm text-muted-foreground w-28 text-center">
                {filters.confidence[0]}% - {filters.confidence[1]}%
              </span>
            </div>
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
          {investigations.map((inv, index) => {
            if (investigations.length === index + 1) {
              return (
                <div ref={lastInvestigationElementRef} key={inv.id}>
                  <AccordionItem value={inv.id}>
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
                </div>
              )
            } else {
              return (
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
              )
            }
          })}
        </Accordion>
     )}
     {loading && (
        <div className="space-y-4 mt-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
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