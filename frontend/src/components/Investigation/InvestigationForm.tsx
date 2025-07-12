'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { InvestigationInput } from '@/lib/investigation-api';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Person4Icon from '@mui/icons-material/Person4';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import TuneIcon from '@mui/icons-material/Tune';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from "@/components/ui/slider"

// Local SVG Icon Components
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const AddIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const TrackChangesIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
        <path d="M21 12a9 9 0 1 0 -9.536 8.98" />
    </svg>
);
const ErrorOutlineIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
        <path d="M12 8l0 4" />
        <path d="M12 16l.01 0" />
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

const HelpIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

const SaveIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
    </svg>
);

const LoadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
);


interface InvestigationFormProps {
  onSubmit: (input: InvestigationInput) => Promise<boolean>;
  isLoading?: boolean;
}

type InputField = { id: number; value: string };
type IndicatorFields = {
    names: InputField[];
    emails: InputField[];
    usernames: InputField[];
    phones: InputField[];
    ips: InputField[];
    domains: InputField[];
    urls: InputField[];
};
type FormState = IndicatorFields;

// --- Zod Schemas for Validation ---
const indicatorSchemas = {
    names: z.string().min(1, "Le nom ne peut pas être vide."),
    emails: z.string().email("Format d'email invalide."),
    usernames: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères."),
    phones: z.string().regex(/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]*$/, "Format de téléphone invalide."),
    ips: z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, "Format d'adresse IP invalide."),
    domains: z.string().regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/, "Format de domaine invalide."),
    urls: z.string().url("Format d'URL invalide."),
};

type FieldError = { id: number; message: string | null };
type FormErrors = {
    [K in keyof IndicatorFields]: FieldError[];
};

export default function InvestigationForm({ onSubmit, isLoading: isSubmitting = false }: InvestigationFormProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(isSubmitting);
  const [activeSection, setActiveSection] = useState<keyof FormState | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({
      names: [], emails: [], usernames: [], phones: [], ips: [], domains: [], urls: []
  });
  const [templates, setTemplates] = useState<string[]>([]);

  const {
    investigationForm,
    setInvestigationFormField,
    addInvestigationFormField,
    removeInvestigationFormField,
    setInvestigationFormOptions,
    resetInvestigationForm,
    setInvestigationForm,
    addToastNotification,
    setIsSearchLogExpanded
  } = useAppStore();

  const { fields, maxGeneration, minConfidence } = {
    fields: {
        names: investigationForm.names,
        emails: investigationForm.emails,
        usernames: investigationForm.usernames,
        phones: investigationForm.phones,
        ips: investigationForm.ips,
        domains: investigationForm.domains,
        urls: investigationForm.urls,
    },
    maxGeneration: investigationForm.maxGeneration,
    minConfidence: investigationForm.minConfidence,
  };

  useEffect(() => {
    setIsLoading(isSubmitting);
  }, [isSubmitting]);

  const validateField = useCallback((type: keyof IndicatorFields, id: number, value: string) => {
      if (!value.trim()) {
          setFormErrors(prev => ({
              ...prev,
              [type]: prev[type].filter(e => e.id !== id)
          }));
          return;
      }

      const schema = indicatorSchemas[type];
      const result = schema.safeParse(value);

      setFormErrors(prev => {
          const otherErrors = prev[type].filter(e => e.id !== id);
          if (!result.success) {
              const message = result.error.format()._errors[0];
              return { ...prev, [type]: [...otherErrors, { id, message }] };
          }
          return { ...prev, [type]: otherErrors };
      });
  }, []);

  const handleFieldChange = (type: keyof FormState, id: number, value: string) => {
    setInvestigationFormField(type, id, value);
    validateField(type, id, value);
  };

  const addField = (type: keyof FormState) => {
    addInvestigationFormField(type);
  };

  const removeField = (type: keyof FormState, id: number) => {
    removeInvestigationFormField(type, id);
    setFormErrors(prev => ({
        ...prev,
        [type]: prev[type].filter(e => e.id !== id)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const indicatorData: Partial<InvestigationInput> = {};
    let hasErrors = false;
    (Object.keys(fields) as Array<keyof typeof fields>).forEach(key => {
        const nonEmptyValues = fields[key]
            .map(field => {
                validateField(key, field.id, field.value);
                return field.value.trim();
            })
            .filter(Boolean);
        
        if (formErrors[key].length > 0) {
            hasErrors = true;
        }

        if (nonEmptyValues.length > 0) {
            indicatorData[key] = nonEmptyValues;
        }
    });

    if (hasErrors) {
        addToastNotification({
            title: "Erreurs de validation",
            message: "Veuillez corriger les erreurs dans le formulaire.",
            type: 'error'
        });
        setIsLoading(false);
        return;
    }

    const hasIndicators = Object.values(indicatorData).some(v => Array.isArray(v) && v.length > 0);

    if (!hasIndicators) {
      addToastNotification({
        title: "Données invalrides",
        message: "Veuillez fournir au moins un indicateur pour lancer une investigation.",
        type: 'warning'
      });
      setIsLoading(false);
      return;
    }

    const formattedInput: InvestigationInput = {
      ...indicatorData,
      maxGeneration,
      minConfidence,
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
      const templateName = prompt("Entrez un nom pour ce modèle :");
      if (templateName) {
          localStorage.setItem(`investigation_template_${templateName}`, JSON.stringify(investigationForm));
          addToastNotification({ title: "Modèle sauvegardé", message: `Le modèle "${templateName}" a été sauvegardé.`, type: 'success' });
          loadTemplates();
      }
  };

  const loadTemplates = useCallback(() => {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('investigation_template_'));
      setTemplates(keys.map(k => k.replace('investigation_template_', '')));
  }, []);

  const loadTemplate = (name: string) => {
      if (!name) return;
      const templateData = localStorage.getItem(`investigation_template_${name}`);
      if (templateData) {
          setInvestigationForm(JSON.parse(templateData));
          addToastNotification({ title: "Modèle chargé", message: `Le modèle "${name}" a été chargé.`, type: 'info' });
      }
  };

  useEffect(() => {
      loadTemplates();
  }, [loadTemplates]);

  const renderIndicatorSection = (
    type: keyof FormState,
    label: string,
    placeholder: string,
    IconComponent: React.ComponentType<{ className?: string }>,
    tooltipText: string
  ) => {
    const sectionFields = fields[type];
    const activeFields = sectionFields.filter(f => f.value.trim() !== '');

    return (
      <div className="space-y-3 group">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Label className="text-sm font-semibold flex items-center gap-2 cursor-help">
                <IconComponent className={`h-5 w-5 transition-colors duration-300 ${activeSection === type ? 'text-[#e5ee10]' : 'text-muted-foreground'} group-hover:text-[#e5ee10]`} />
                {label}
                {activeFields.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {activeFields.length}
                  </Badge>
                )}
              </Label>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltipText}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {sectionFields.map((field, index) => {
          const error = formErrors[type].find(e => e.id === field.id);
          return (
            <div key={field.id}>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder={placeholder}
                  value={field.value}
                  onFocus={() => setActiveSection(type)}
                  onBlur={() => validateField(type, field.id, field.value)}
                  onChange={(e) => handleFieldChange(type, field.id, e.target.value)}
                  disabled={isLoading}
                  className={`flex-1 bg-gray-50 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 ${error ? 'border-red-500' : ''}`}
                />
                <div className="flex items-center gap-1">
                  {sectionFields.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeField(type, field.id)}
                      disabled={isLoading}
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 hover:bg-red-100 hover:text-red-600"
                    >
                      <CloseIcon className="h-4 w-4" />
                    </Button>
                  )}
                  {index === sectionFields.length - 1 && (
                    <Button
                      type="button"
                      onClick={() => addField(type)}
                      disabled={isLoading}
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 hover:bg-green-100 hover:text-green-600"
                    >
                      <AddIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
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
          );
        })}
      </div>
    );
  };

  const totalIndicators = Object.values(fields).flat().filter(f => f.value.trim() !== '').length;

  return (
    <div className="w-full">
      <Card className="shadow-lg border-2 hover:shadow-xl transition-all duration-300 overflow-hidden">
        <div className="relative">
          <div className="relative z-10 bg-transparent">
            <CardHeader
              className="space-y-2"
            >
              <CardTitle className="text-xl font-bold flex items-center justify-between gap-3 w-full">
                <TooltipProvider delayDuration={200}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-3 cursor-help">
                                <TrackChangesIcon className="h-6 w-6" style={{ color: '#e5ee10' }} />
                                <span>Nouvelle Investigation OSINT</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Lancez une nouvelle enquête en fournissant un ou plusieurs indicateurs.<br/>Les outils OSINT collecteront et analyseront les données publiquement disponibles.</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <div onClick={() => setIsExpanded(!isExpanded)} className="cursor-pointer p-2">
                  {isExpanded ? <ExpandLessIcon className="h-6 w-6" /> : <ExpandMoreIcon className="h-6 w-6" />}
                </div>
              </CardTitle>
              <p className="text-sm text-muted-foreground pt-2">
                Tous les champs sont optionnels. Plus vous fournissez d'informations, plus les chances de trouver des résultats pertinents sont élevées.
              </p>
              {!isExpanded && totalIndicators > 0 && (
                 <p className="text-muted-foreground">
                  {totalIndicators} indicateur{totalIndicators > 1 ? 's' : ''} prêt{totalIndicators > 1 ? 's' : ''} à être investigué{totalIndicators > 1 ? 's' : ''}.
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
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {renderIndicatorSection('names', 'Noms complets', 'ex: Jean Dupont', FingerprintIcon, "Noms et prénoms de la personne ciblée.")}
                    {renderIndicatorSection('usernames', 'Noms d\'utilisateur', 'ex: jdupont123', Person4Icon, "Pseudos ou noms d'utilisateur utilisés sur les plateformes en ligne.")}
                    {renderIndicatorSection('emails', 'Adresses email', 'ex: jean.dupont@email.com', EmailIcon, "Adresses e-mail personnelles ou professionnelles.")}
                    {renderIndicatorSection('phones', 'Numéros de téléphone', 'ex: +33 6 12 34 56 78', PhoneIcon, "Numéros de téléphone, y compris l'indicatif du pays.")}
                    {renderIndicatorSection('ips', 'Adresses IP', 'ex: 192.168.1.1', DnsIcon, "Adresses IP (IPv4) associées à la cible.")}
                    {renderIndicatorSection('domains', 'Noms de domaine', 'ex: exemple.com', LanguageIcon, "Domaines web possédés ou gérés par la cible.")}
                  </div>
                  
                  <div className="w-full">
                    {renderIndicatorSection('urls', 'URLs complètes', 'ex: https://exemple.com/profil', LinkIcon, "Liens vers des profils spécifiques ou des pages web pertinentes.")}
                  </div>

                  <div className="border-t pt-6 space-y-6">
                      <Label className="text-base font-semibold flex items-center gap-2">
                          <TuneIcon className="h-5 w-5 text-muted-foreground" />
                          Options Avancées
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="maxGeneration" className="flex items-center gap-1.5">
                                Profondeur Max ({maxGeneration})
                                <TooltipProvider delayDuration={200}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <HelpIcon className="h-4 w-4 text-muted-foreground cursor-help" />
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
                                            <HelpIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Définit la confiance minimale pour qu'un indicateur soit utilisé.<br/>Bas = Recherche large, Haut = Recherche précise.</p>
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
                              <SaveIcon className="h-4 w-4 mr-2" />
                              Sauvegarder comme modèle
                          </Button>
                          <Select onValueChange={loadTemplate} value="">
                              <SelectTrigger className="w-[200px]">
                                  <SelectValue placeholder="Charger un modèle" />
                              </SelectTrigger>
                              <SelectContent>
                                  {templates.map(template => (
                                      <SelectItem key={template} value={template}>
                                          {template}
                                      </SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || totalIndicators === 0}
                    className="w-full h-12 text-lg font-semibold"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <CircularProgress size={20} color="inherit" className="mr-2" />
                        Investigation en cours...
                      </>
                    ) : (
                      <>
                        <SearchIcon className="w-5 h-5 mr-2" />
                        Lancer l'investigation ({totalIndicators} indicateur{totalIndicators > 1 ? 's' : ''})
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}