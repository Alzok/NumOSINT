'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, Plus, X, Target, AlertCircle, User, AtSign, Mail, Phone, Monitor, Globe, Link as LinkIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { InvestigationInput } from '@/lib/investigation-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Dither from '@/components/ui/Dither';
import '@/components/ui/Dither.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface InvestigationFormProps {
  onSubmit: (input: InvestigationInput) => Promise<boolean>;
  isLoading?: boolean;
}

type InputField = { id: number; value: string };
type FormState = Record<keyof Omit<InvestigationInput, 'names'>, InputField[]> & { names: InputField[] };

export default function InvestigationForm({ onSubmit, isLoading = false }: InvestigationFormProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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

  useEffect(() => {
    if (isLoading) {
      setError(null);
    }
  }, [isLoading]);

  const handleFieldChange = (type: keyof FormState, id: number, value: string) => {
    setFields(prev => ({
      ...prev,
      [type]: prev[type].map(field => field.id === id ? { ...field, value } : field)
    }));
  };

  const addField = (type: keyof FormState) => {
    setFields(prev => ({
      ...prev,
      [type]: [...prev[type], { id: Date.now(), value: '' }]
    }));
  };

  const removeField = (type: keyof FormState, id: number) => {
    setFields(prev => ({
      ...prev,
      [type]: prev[type].filter(field => field.id !== id)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formattedInput: InvestigationInput = Object.entries(fields).reduce((acc, [key, value]) => {
      const nonEmptyValues = value.map(field => field.value.trim()).filter(Boolean);
      if (nonEmptyValues.length > 0) {
        acc[key as keyof InvestigationInput] = nonEmptyValues;
      }
      return acc;
    }, {} as InvestigationInput);

    const hasIndicators = Object.values(formattedInput).some(v => Array.isArray(v) && v.length > 0);

    if (!hasIndicators) {
      setError('Veuillez fournir au moins un indicateur (nom, email, username, téléphone, etc.)');
      setIsExpanded(true);
      return;
    }

    const success = await onSubmit(formattedInput);
    if (success) {
      setIsExpanded(false);
    } else {
      setError('Une erreur est survenue lors du lancement de l\'investigation.');
      setIsExpanded(true);
    }
  };

  const renderIndicatorSection = (
    type: keyof FormState,
    label: string,
    placeholder: string,
    IconComponent: React.ElementType
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
              className="flex-1"
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
                  <X className="h-4 w-4" />
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
                  <Plus className="h-4 w-4" />
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
          <div className="absolute inset-0 z-0">
            <Dither
              waveColor={[0.5, 0.5, 0.5]}
              colorNum={3}
              waveAmplitude={0.44}
              waveFrequency={2}
              disableAnimation={true}
              waveSpeed={0.02}
              enableMouseInteraction={true}
              mouseRadius={0.5}
            />
          </div>
          <div className="relative z-10 bg-transparent">
            <CardHeader
              className="text-center space-y-2 cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <CardTitle className="text-2xl font-bold flex items-center justify-center gap-3">
                <Target className="h-7 w-7 text-blue-600" />
                Nouvelle Investigation OSINT
                <div className="ml-auto">
                  {isExpanded ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
                </div>
              </CardTitle>
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
                    {renderIndicatorSection('names', 'Noms complets', 'ex: Jean Dupont', User)}
                    {renderIndicatorSection('usernames', 'Noms d\'utilisateur', 'ex: jdupont123', AtSign)}
                    {renderIndicatorSection('emails', 'Adresses email', 'ex: jean.dupont@email.com', Mail)}
                    {renderIndicatorSection('phones', 'Numéros de téléphone', 'ex: +33 6 12 34 56 78', Phone)}
                    {renderIndicatorSection('ips', 'Adresses IP', 'ex: 192.168.1.1', Monitor)}
                    {renderIndicatorSection('domains', 'Noms de domaine', 'ex: exemple.com', Globe)}
                  </div>
                  
                  <div className="w-full">
                    {renderIndicatorSection('urls', 'URLs complètes', 'ex: https://exemple.com/profil', LinkIcon)}
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
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
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Investigation en cours...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5 mr-2" />
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