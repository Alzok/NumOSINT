'use client';

import { useState, useEffect } from 'react';
import FocusTrap from 'focus-trap-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Investigation, Case } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface AssignCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (caseId: string | null, investigationId: string) => Promise<boolean>;
  investigation: Investigation | null;
  cases: Case[];
  isLoading: boolean;
}

export function AssignCaseModal({ isOpen, onClose, onAssign, investigation, cases, isLoading }: AssignCaseModalProps) {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  useEffect(() => {
    if (investigation) {
      setSelectedCaseId(investigation.caseId || null);
    }
  }, [investigation]);

  if (!investigation) return null;

  const handleAssign = async () => {
    const success = await onAssign(selectedCaseId, investigation.id);
    if (success) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <FocusTrap
          focusTrapOptions={{
            onDeactivate: onClose,
            clickOutsideDeactivates: true,
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          >
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
            >
              <div
                className="relative w-full max-w-md rounded-lg bg-card p-6 text-card-foreground shadow-lg"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                  <h2 className="text-lg font-semibold leading-none tracking-tight">Assigner à un dossier</h2>
                  <p className="text-sm text-muted-foreground">
                    Sélectionnez un dossier pour l'investigation "{(investigation.inputData?.indicators?.[0]?.value) || investigation.id}".
                  </p>
                </div>
                <div className="py-4">
                  <Select
                    value={selectedCaseId || 'unclassified'}
                    onValueChange={(value) => setSelectedCaseId(value === 'unclassified' ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un dossier..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unclassified">Non classé</SelectItem>
                      {cases.map(caseItem => (
                        <SelectItem key={caseItem.id} value={caseItem.id}>{caseItem.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={onClose}>Annuler</Button>
                  <Button onClick={handleAssign} disabled={isLoading}>
                    {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </FocusTrap>
      )}
    </AnimatePresence>
  );
}