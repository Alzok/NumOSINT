'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { InvestigationInput, InvestigationTemplate, IndicatorType, FormIndicator } from '@/types';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Person4Icon from '@mui/icons-material/Person4';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import TuneIcon from '@mui/icons-material/Tune';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from "@/components/ui/slider"
import React from 'react';
import { RocketLaunch } from '@mui/icons-material';
import { SaveTemplateModal } from './SaveTemplateModal';
import { api } from '@/lib/api-client';
import { useSession } from 'next-auth/react';
import { Trash2, Ghost, Mail, Fingerprint, Phone, Bug, Database, Waypoints, UserSearch, Coins, Plus, X } from 'lucide-react';

const TrackChangesIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
        <path d="M21 12a9 9 0 1 0 -9.536 8.98" />
    </svg>
);
const EmailIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" />
        <path d="M3 7l9 6l9 -6" />
    </svg>
);
const PhoneIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" />
    </svg>
);
const DnsIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
        <path d="M12 15l0 6" />
        <path d="M12 3l0 6" />
    </svg>
);
const LanguageIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
        <path d="M3.6 9h16.8" />
        <path d="M3.6 15h16.8" />
        <path d="M11.5 3a17 17 0 0 0 0 18" />
        <path d="M12.5 3a17 17 0 0 1 0 18" />
    </svg>
);
const LinkIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 14a3.5 3.5 0 0 0 5 0l4 -4a3.5 3.5 0 0 0 -5 -5l-.5 .5" />
        <path d="M14 10a3.5 3.5 0 0 0 -5 0l-4 4a3.5 3.5 0 0 0 5 5l.5 -.5" />
    </svg>
);
const ExpandLessIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
);
const ExpandMoreIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);
const CircularProgress = (props: { size?: number, color?: string, className?: string }) => (
    <svg className={props.className} style={{ width: props.size, height: props.size }} viewBox="22 22 44 44">
        <circle cx="44" cy="44" r="20.2" fill="none" strokeWidth="3.6" stroke="currentColor" strokeDasharray="80px, 200px" strokeDashoffset="0px"></circle>
    </svg>
);

const HelpIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
    <svg ref={ref} {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
));
HelpIcon.displayName = 'HelpIcon';

const toolIcons: { [key: string]: React.ElementType } = {
  busterService: Ghost,
  mosintService: Mail,
  maigretService: Fingerprint,
  phoneinfogaService: Phone,
  spiderfootService: Bug,
  pdlService: Database,
  wauService: Waypoints,
  waybulkService: Waypoints,
  asnService: UserSearch,
  default: HelpIcon,
};

const SaveIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
    </svg>
);

interface InvestigationFormProps {
  onSubmit: (input: InvestigationInput) => Promise<boolean>;
  isLoading?: boolean;
}

const indicatorSchemas: Record<IndicatorType, z.ZodString> = {
    NAME: z.string().min(1, "Le nom ne peut pas être vide."),
    EMAIL: z.string().email("Format d'email invalide."),
    USERNAME: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères."),
    PHONE: z.string().regex(/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]*$/, "Format de téléphone invalide."),
    IP: z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, "Format d'adresse IP invalide."),
    DOMAIN: z.string().regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/, "Format de domaine invalide."),
    URL: z.string().url("Format d'URL invalide."),
};

type FormError = { id: number; message: string | null };

export default function InvestigationForm({ onSubmit, isLoading: isSubmitting = false }: InvestigationFormProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(isSubmitting);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [cost, setCost] = useState<{ cost: number; details: any; hasEnoughCredits: boolean } | null>(null);
  const [isCostLoading, setIsCostLoading] = useState(false);
  const { data: session } = useSession();

  const [formErrors, setFormErrors] = useState<FormError[]>([]);
  const [templates, setTemplates] = useState<InvestigationTemplate[]>([]);

  const {
    investigationForm,
    updateIndicator,
    addIndicator,
    removeIndicator,
    setInvestigationFormOptions,
    resetInvestigationForm,
    setInvestigationForm,
    addToastNotification,
    setIsSearchLogExpanded
  } = useAppStore();

  const { indicators, maxGeneration, minConfidence } = investigationForm;

  useEffect(() => {
    setIsLoading(isSubmitting);
  }, [isSubmitting]);

  const { triggerTokenAnimation } = useAppStore();

  const validateAllFields = () => {
    const errors: FormError[] = [];
    (indicators || []).forEach(indicator => {
      if (indicator.value.trim()) {
        const schema = indicatorSchemas[indicator.type];
        const result = schema.safeParse(indicator.value);
        if (!result.success) {
          errors.push({ id: indicator.id, message: result.error.format()._errors[0] });
        }
      }
    });
    setFormErrors(errors);
    return errors.length === 0;
  };
  
  const handleLancerClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!validateAllFields()) {
        e.preventDefault();
        addToastNotification({
            title: "Erreurs de validation",
            message: "Veuillez corriger les erreurs dans le formulaire.",
            type: 'error'
        });
        return;
    }
    if (session?.user?.role !== 'ADMIN' && !cost?.hasEnoughCredits) {
      console.log('[Debug] Insufficient credits. Preventing submission.');
      e.preventDefault();
      triggerTokenAnimation();
      addToastNotification({
        title: "Jetons insuffisants",
        message: "Vous n'avez pas assez de jetons pour lancer cette investigation.",
        type: 'error'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAllFields()) {
        return;
    }
    setIsLoading(true);

    const validIndicators = (indicators || [])
      .map(({ id, ...rest }) => rest) // Remove id
      .filter(ind => ind.value.trim() !== '');

    if (validIndicators.length === 0) {
      addToastNotification({
        title: "Données invalides",
        message: "Veuillez fournir au moins un indicateur pour lancer une investigation.",
        type: 'warning'
      });
      setIsLoading(false);
      return;
    }

    const formattedInput: InvestigationInput = {
      indicators: validIndicators,
      options: {
        maxGeneration,
        minConfidence,
      }
    };

    setIsSearchLogExpanded(true);
    const success = await onSubmit(formattedInput);
    if (success) {
      setIsExpanded(false);
      resetInvestigationForm();
      addToastNotification({
        title: "Investigation lancée",
        message: "L'investigation a démarré avec succès.",
        type: 'success'
      });
    } else {
      addToastNotification({
        title: "Erreur",
        message: "Une erreur est survenue lors du lancement de l'investigation.",
        type: 'error'
      });
      setIsExpanded(true);
    }
    setIsLoading(false);
  };

  const saveTemplate = () => {
    setIsSaveModalOpen(true);
  };

  const handleSaveTemplate = async (templateName: string) => {
    if (!session?.accessToken) return;
    const { error } = await api.createTemplate({ name: templateName, inputData: investigationForm }, session.accessToken);
    if (error) {
      addToastNotification({ title: "Erreur", message: "Impossible de sauvegarder le modèle.", type: 'error' });
    } else {
      addToastNotification({ title: "Modèle sauvegardé", message: `Le modèle "${templateName}" a été sauvegardé.`, type: 'success' });
      loadTemplates();
    }
  };

  const loadTemplates = useCallback(async () => {
    if (!session?.accessToken) return;
    const { data } = await api.getTemplates(session.accessToken);
    if (data) {
      setTemplates(data);
    }
  }, [session, setTemplates]);

  const loadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
        let formState = template.inputData;
        // Compatibility check for old template format
        if (!formState.indicators && (formState.names || formState.emails)) {
            const newIndicators: FormIndicator[] = [];
            let idCounter = Date.now();
            
            const indicatorTypes: string[] = ['names', 'emails', 'usernames', 'phones', 'ips', 'domains', 'urls'];
            
            indicatorTypes.forEach(type => {
                if (formState[type] && Array.isArray(formState[type])) {
                    formState[type].forEach((field: { value: string }) => {
                        if (field.value) {
                            newIndicators.push({
                                id: idCounter++,
                                type: (type as string).slice(0, -1).toUpperCase() as IndicatorType,
                                value: field.value
                            });
                        }
                    });
                }
            });

            if (newIndicators.length === 0) {
                newIndicators.push({ id: idCounter, type: 'NAME', value: '' });
            }

            formState = {
                ...formState,
                indicators: newIndicators,
            };
            
            // Clean up old keys
            indicatorTypes.forEach(type => delete formState[type]);
        }

        setInvestigationForm(formState);
        addToastNotification({ title: "Modèle chargé", message: `Le modèle "${template.name}" a été chargé.`, type: 'info' });
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!session?.accessToken) return;
    const { error } = await api.deleteTemplate(templateId, session.accessToken);
    if (error) {
      addToastNotification({ title: "Erreur", message: "Impossible de supprimer le modèle.", type: 'error' });
    } else {
      addToastNotification({ title: "Modèle supprimé", message: "Le modèle a été supprimé.", type: 'success' });
      loadTemplates();
    }
  };

  useEffect(() => {
      loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    const currentIndicators = (indicators || [])
      .map(({ id, ...rest }) => rest)
      .filter(ind => ind.value.trim() !== '');

    const options = { maxGeneration, minConfidence };

    const handler = setTimeout(() => {
      if (currentIndicators.length > 0 && session?.accessToken && session?.user?.id) {
        setIsCostLoading(true);
        api.getInvestigationCost(currentIndicators, options, session.user.id, session.accessToken)
          .then(response => {
            if (response.data) {
              setCost(response.data);
            } else if (response.error) {
              addToastNotification({
                title: "Erreur de calcul du coût",
                message: response.error,
                type: 'error'
              });
              setCost(null);
            }
          })
          .finally(() => setIsCostLoading(false));
      } else {
        setCost(null);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [indicators, maxGeneration, minConfidence, session, addToastNotification]);

  const totalIndicators = (indicators || []).filter(f => f.value.trim() !== '').length;
  const isValid = totalIndicators > 0;

  const indicatorOptions: { value: IndicatorType, label: string, icon: React.ElementType }[] = [
      { value: 'NAME', label: 'Nom complet', icon: FingerprintIcon },
      { value: 'USERNAME', label: "Nom d'utilisateur", icon: Person4Icon },
      { value: 'EMAIL', label: 'Adresse email', icon: EmailIcon },
      { value: 'PHONE', label: 'Téléphone', icon: PhoneIcon },
      { value: 'IP', label: 'Adresse IP', icon: DnsIcon },
      { value: 'DOMAIN', label: 'Domaine', icon: LanguageIcon },
      { value: 'URL', label: 'URL', icon: LinkIcon },
  ];

  return (
    <div className="w-full">
      <SaveTemplateModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveTemplate}
      />
      <Card className="shadow-lg border-2 hover:shadow-xl transition-all duration-300 overflow-hidden">
        <div className="relative">
          <div className="relative z-10 bg-transparent">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl font-bold flex items-center justify-between gap-3 w-full">
                <div className="flex items-center gap-3">
                    <TrackChangesIcon aria-hidden="true" className="h-6 w-6" style={{ color: '#e5ee10' }} />
                    <span>Nouvelle Investigation OSINT</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                  aria-label={isExpanded ? "Réduire le formulaire" : "Étendre le formulaire"}
                >
                  {isExpanded ? <ExpandLessIcon aria-hidden="true" className="h-6 w-6" /> : <ExpandMoreIcon aria-hidden="true" className="h-6 w-6" />}
                </Button>
              </CardTitle>
              <p className="text-sm text-muted-foreground pt-2">
                Fournissez un ou plusieurs indicateurs pour démarrer.
              </p>
              {!isExpanded && totalIndicators > 0 && (
                 <p className="text-muted-foreground">
                  {totalIndicators} indicateur{totalIndicators > 1 ? 's' : ''} prêt{totalIndicators > 1 ? 's' : ''}.
                </p>
              )}
            </CardHeader>
          </div>
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Indicateurs</Label>
                    {(indicators || []).map((indicator) => {
                      const error = formErrors.find(e => e.id === indicator.id);
                      return (
                        <div key={indicator.id} className="flex items-start gap-2">
                          <div className="grid grid-cols-3 gap-2 flex-grow">
                            <Select
                              value={indicator.type}
                              onValueChange={(value: IndicatorType) => updateIndicator(indicator.id, { type: value })}
                            >
                              <SelectTrigger className="col-span-1">
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                {indicatorOptions.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    <div className="flex items-center gap-2">
                                      <opt.icon className="h-4 w-4" />
                                      {opt.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div className="col-span-2">
                              <Input
                                type="text"
                                placeholder="Valeur de l'indicateur"
                                value={indicator.value}
                                onChange={(e) => updateIndicator(indicator.id, { value: e.target.value })}
                                disabled={isLoading}
                                className={`w-full ${error ? 'border-red-500' : ''}`}
                              />
                               <AnimatePresence>
                                {error && (
                                  <motion.p
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-xs text-red-500 mt-1 ml-1"
                                  >
                                    {error.message}
                                  </motion.p>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                          <Button
                            type="button"
                            onClick={() => removeIndicator(indicator.id)}
                            disabled={isLoading || indicators.length <= 1}
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 hover:bg-red-100 hover:text-red-600"
                            aria-label="Supprimer l'indicateur"
                          >
                            <X className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      );
                    })}
                    <Button type="button" variant="outline" onClick={addIndicator}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un indicateur
                    </Button>
                  </div>

                  <div className="border-t pt-6 space-y-6">
                      <Label className="text-base font-semibold flex items-center gap-2">
                          <TuneIcon aria-hidden="true" className="h-5 w-5 text-muted-foreground" />
                          Options Avancées
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="maxGeneration" className="flex items-center gap-1.5">
                                Profondeur Max ({maxGeneration})
                                <TooltipProvider delayDuration={200}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <HelpIcon aria-hidden="true" className="h-4 w-4 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Définit le nombre maximum d'itérations pour l'enrichissement.<br/>Une valeur plus élevée peut donner plus de résultats mais prend plus de temps.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </Label>
                            <Slider
                                id="maxGeneration"
                                min={1}
                                max={20}
                                step={1}
                                value={[maxGeneration]}
                                onValueChange={(value) => setInvestigationFormOptions({ maxGeneration: value[0] })}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="minConfidence" className="flex items-center gap-1.5">
                                Seuil de Fiabilité ({Math.round(minConfidence * 100)}%)
                                <TooltipProvider delayDuration={200}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <HelpIcon aria-hidden="true" className="h-4 w-4 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Le seuil de confiance minimum pour qu'un indicateur soit utilisé.<br/>Abaisser ce seuil peut augmenter le bruit.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </Label>
                            <Slider
                                id="minConfidence"
                                min={0}
                                max={1}
                                step={0.05}
                                value={[minConfidence]}
                                onValueChange={(value) => setInvestigationFormOptions({ minConfidence: value[0] })}
                                disabled={isLoading}
                            />
                        </div>
                      </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex gap-2">
                          <Button type="button" variant="outline" onClick={saveTemplate}>
                              <SaveIcon aria-hidden="true" className="h-4 w-4 mr-2" />
                              Sauvegarder comme modèle
                          </Button>
                          <Select onValueChange={loadTemplate} value="">
                              <SelectTrigger className="w-[200px]">
                                  <SelectValue placeholder="Charger un modèle" />
                              </SelectTrigger>
                              <SelectContent>
                                  {templates.map(template => (
                                      <SelectItem key={template.id} value={template.id}>
                                        <div className="flex justify-between w-full items-center">
                                          <span>{template.name}</span>
                                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); deleteTemplate(template.id); }}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                          </Button>
                                        </div>
                                      </SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      </div>
                  </div>

                  <CardFooter className="flex flex-col gap-4 bg-slate-900/50 p-4 border-t">
                    <div className="flex justify-between items-center w-full">
                        <div className="flex-grow">
                            <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-white">Détails de l'estimation</h4>
                            </div>
                            <div className="flex flex-wrap justify-start items-start gap-x-4 text-xs text-muted-foreground">
                                {cost && !isCostLoading && (
                                    <>
                                        <div className="text-center">
                                            <span className="font-bold text-sm text-white">{cost.details.indicatorCount}</span>
                                            <p>Indicateurs</p>
                                        </div>
                                        <div className="text-center pl-4 border-l border-gray-700">
                                            <span className="font-bold text-sm text-white">{cost.details.tools.length}</span>
                                            <p>Outils</p>
                                        </div>
                                        <div className="text-center pl-4 border-l border-gray-700">
                                            <span className="font-bold text-sm text-white">x{cost.details.maxGeneration}</span>
                                            <p>Profondeur</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                      <div className="flex items-center gap-4">
                        {isCostLoading && <p className="text-sm text-muted-foreground animate-pulse">Calcul du coût...</p>}
                        {cost && !isCostLoading && (
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground font-semibold">COÛT</p>
                                    <div className="flex items-center justify-center text-2xl font-bold">
                                        <p className={`${session?.user?.role === 'ADMIN' || cost.hasEnoughCredits ? 'text-green-400' : 'text-red-500'}`}>{cost.cost}</p>
                                        <Coins className={`h-5 w-5 ml-1 ${session?.user?.role === 'ADMIN' || cost.hasEnoughCredits ? 'text-green-400' : 'text-red-500'}`} />
                                    </div>
                                </div>
                                <div className="text-center border-l border-gray-700 pl-6">
                                    <p className="text-xs text-muted-foreground font-semibold">DISPONIBLE</p>
                                    <div className="flex items-center justify-center text-2xl font-bold text-white">
                                        <p>{session?.user?.credits ?? '∞'}</p>
                                        <Coins className="h-5 w-5 ml-1 text-white" />
                                    </div>
                                </div>
                            </div>
                        )}
                        <Button type="submit" onClick={handleLancerClick} disabled={isSubmitting || !isValid} className="gap-2 px-6 py-6 text-base">
                          {isSubmitting ? <CircularProgress size={24} /> : <RocketLaunch className="h-6 w-6" />}
                          <span>{isSubmitting ? 'Lancement...' : "Lancer"}</span>
                        </Button>
                      </div>
                    </div>
                    <AnimatePresence>
                      {cost && !isCostLoading && cost.details.tools.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="w-full pt-3 border-t border-gray-800"
                        >
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Outils qui seront utilisés :</p>
                          <motion.div className="flex flex-wrap gap-3" transition={{ staggerChildren: 0.05 }}>
                            {cost.details.tools.map((tool: any) => {
                              const Icon = toolIcons[tool.name] || toolIcons.default;
                              return (
                                <motion.div
                                  key={tool.name}
                                  initial={{ opacity: 0, scale: 0.5 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="flex items-center gap-2 p-2 rounded-md bg-background/30 text-xs"
                                >
                                  <Icon className="h-4 w-4 text-[#e5ee10]" />
                                  <span>{tool.name.replace('Service', '')}</span>
                                </motion.div>
                              );
                            })}
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardFooter>
                </form>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}