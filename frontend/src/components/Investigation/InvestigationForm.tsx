'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InvestigationInput } from '@/lib/investigation-api';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Cancel } from '@mui/icons-material';
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


interface InvestigationFormProps {
  onSubmit: (input: InvestigationInput) => Promise<boolean>;
  isLoading?: boolean;
}

type InputField = { id: number; value: string };
type IndicatorFields = Required<Omit<InvestigationInput, 'maxGeneration'>>;
type FormState = { [K in keyof IndicatorFields]: InputField[] };

// --- Début de l'ajout pour la validation ---
type FieldValidity = { id: number; isValid: boolean | null };
type FormValidityState = { [K in keyof IndicatorFields]: FieldValidity[] };

const validationPatterns: Partial<Record<keyof IndicatorFields, RegExp>> = {
  emails: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // Regex simple pour les téléphones, accepte les chiffres, espaces, tirets, parenthèses et un + optionnel au début
  phones: /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]*$/,
  ips: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  domains: /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/,
  urls: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
};
// --- Fin de l'ajout pour la validation ---


export default function InvestigationForm({ onSubmit, isLoading: isSubmitting = false }: InvestigationFormProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(isSubmitting);
  const [maxGeneration, setMaxGeneration] = useState(3);
  const [minConfidence, setMinConfidence] = useState(0.7);
  const setIsSearchLogExpanded = useAppStore((state) => state.setIsSearchLogExpanded);
  
  const initialField = { id: 1, value: '' };
  const [fields, setFields] = useState<FormState>({
    names: [initialField],
    emails: [initialField],
    usernames: [initialField],
    phones: [initialField],
    ips: [initialField],
    domains: [initialField],
    urls: [initialField],
  });

  // --- Début de l'ajout pour la validation ---
  const initialValidityField = { id: 1, isValid: null };
  const [fieldsValidity, setFieldsValidity] = useState<FormValidityState>({
    names: [initialValidityField],
    emails: [initialValidityField],
    usernames: [initialValidityField],
    phones: [initialValidityField],
    ips: [initialValidityField],
    domains: [initialValidityField],
    urls: [initialValidityField],
  });

  const validateField = (type: keyof IndicatorFields, value: string): boolean | null => {
    if (!value) return null; // Pas de validation si le champ est vide
    const pattern = validationPatterns[type];
    if (!pattern) return true; // Pas de pattern, on considère valide
    return pattern.test(value);
  };
  // --- Fin de l'ajout pour la validation ---

  useEffect(() => {
    setIsLoading(isSubmitting);
    if (isSubmitting) {
      setError(null);
    }
  }, [isSubmitting]);

  const handleFieldChange = (type: keyof IndicatorFields, id: number, value: string) => {
    const isValid = validateField(type, value);
    
    setFields(prev => ({
      ...prev,
      [type]: prev[type].map(field => field.id === id ? { ...field, value } : field)
    }));

    setFieldsValidity(prev => ({
        ...prev,
        [type]: prev[type].map(field => field.id === id ? { ...field, isValid } : field)
    }));
  };

  const addField = (type: keyof IndicatorFields) => {
    const newId = Date.now();
    setFields(prev => ({
      ...prev,
      [type]: [...prev[type], { id: newId, value: '' }]
    }));
    setFieldsValidity(prev => ({
        ...prev,
        [type]: [...prev[type], { id: newId, isValid: null }]
    }));
  };

  const removeField = (type: keyof IndicatorFields, id: number) => {
    setFields(prev => ({
      ...prev,
      [type]: prev[type].filter(field => field.id !== id)
    }));
    setFieldsValidity(prev => ({
        ...prev,
        [type]: prev[type].filter(field => field.id !== id)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted');
    setError(null);
    setIsLoading(true);

    const formattedInput: InvestigationInput = Object.entries(fields).reduce((acc, [key, value]) => {
      const nonEmptyValues = value.map(field => field.value.trim()).filter(Boolean);
      if (nonEmptyValues.length > 0) {
        acc[key as keyof IndicatorFields] = nonEmptyValues;
      }
      return acc;
    }, {} as InvestigationInput);

    if (maxGeneration > 0) {
      formattedInput.maxGeneration = maxGeneration;
    }
    formattedInput.minConfidence = minConfidence;

    const hasIndicators = Object.values(formattedInput).some(v => Array.isArray(v) && v.length > 0);

    if (!hasIndicators) {
      setError('Veuillez fournir au moins un indicateur (nom, email, username, téléphone, etc.)');
      setIsExpanded(true);
      return;
    }

    setIsSearchLogExpanded(true);
    const success = await onSubmit(formattedInput);
    if (success) {
      setIsExpanded(false);
    } else {
      setError('Une erreur est survenue lors du lancement de l\'investigation.');
      setIsExpanded(true);
    }
    setIsLoading(false);
  };

  const renderIndicatorSection = (
    type: keyof IndicatorFields,
    label: string,
    placeholder: string,
    IconComponent: React.ComponentType<{ className?: string }>
  ) => {
    const sectionFields = fields[type];
    const activeFields = sectionFields.filter(f => f.value.trim() !== '');

    return (
      <div className="space-y-3">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <IconComponent className="h-5 w-5 text-muted-foreground" />
          {label}
          {activeFields.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {activeFields.length}
            </Badge>
          )}
        </Label>
        
        {sectionFields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <Input
              type="text"
              placeholder={placeholder}
              value={field.value}
              onChange={(e) => handleFieldChange(type, field.id, e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-gray-50 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
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
        ))}
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
              className="space-y-2 cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <CardTitle className="text-2xl font-bold flex items-center justify-center gap-3">
                <TrackChangesIcon className="h-7 w-7 text-blue-600" />
                Nouvelle Investigation OSINT
                <div className="ml-auto">
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
                    {renderIndicatorSection('names', 'Noms complets', 'ex: Jean Dupont', FingerprintIcon)}
                    {renderIndicatorSection('usernames', 'Noms d\'utilisateur', 'ex: jdupont123', Person4Icon)}
                    {renderIndicatorSection('emails', 'Adresses email', 'ex: jean.dupont@email.com', EmailIcon)}
                    {renderIndicatorSection('phones', 'Numéros de téléphone', 'ex: +33 6 12 34 56 78', PhoneIcon)}
                    {renderIndicatorSection('ips', 'Adresses IP', 'ex: 192.168.1.1', DnsIcon)}
                    {renderIndicatorSection('domains', 'Noms de domaine', 'ex: exemple.com', LanguageIcon)}
                  </div>
                  
                  <div className="w-full">
                    {renderIndicatorSection('urls', 'URLs complètes', 'ex: https://exemple.com/profil', LinkIcon)}
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
                                onValueChange={(value) => setMaxGeneration(value[0])}
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
                                onValueChange={(value) => setMinConfidence(value[0])}
                                disabled={isLoading}
                            />
                        </div>
                      </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <ErrorOutlineIcon className="h-4 w-4" />
                      <AlertTitle>Erreur</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

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