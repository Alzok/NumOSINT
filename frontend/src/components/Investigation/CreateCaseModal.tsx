'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Investigation } from '@/lib/investigation-api';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string, investigationIds: string[]) => Promise<boolean>;
  investigations: Investigation[];
  isLoading: boolean;
}

export function CreateCaseModal({ isOpen, onClose, onCreate, investigations, isLoading }: CreateCaseModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedInv, setSelectedInv] = useState<Record<string, boolean>>({});

  const handleCreate = async () => {
    const selectedIds = Object.keys(selectedInv).filter(id => selectedInv[id]);
    const success = await onCreate(name, description, selectedIds);
    if (success) {
      onClose();
      setName('');
      setDescription('');
      setSelectedInv({});
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={onClose}
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
                  <h2 className="text-lg font-semibold leading-none tracking-tight">Créer un nouveau dossier</h2>
                  <p className="text-sm text-muted-foreground">
                    Nommez votre dossier et sélectionnez les investigations à y inclure.
                  </p>
                </div>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Nom
                    </Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
                  </div>
                  <div>
                    <Label>Investigations à inclure</Label>
                    <ScrollArea className="h-40 mt-2 rounded-md border p-4">
                      {investigations.map(inv => (
                        <div key={inv.id} className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id={inv.id}
                            checked={selectedInv[inv.id] || false}
                            onCheckedChange={(checked) => {
                              setSelectedInv(prev => ({ ...prev, [inv.id]: !!checked }));
                            }}
                          />
                          <label htmlFor={inv.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {inv.inputData?.names?.[0] || inv.inputData?.emails?.[0] || inv.id}
                          </label>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={onClose}>Annuler</Button>
                  <Button onClick={handleCreate} disabled={isLoading || !name}>
                    {isLoading ? 'Création...' : 'Créer le dossier'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}