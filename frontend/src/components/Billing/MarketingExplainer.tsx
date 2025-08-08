'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ghost, Mail, Fingerprint, ArrowRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const toolIcons = [
  { icon: Mail, name: 'Mosint' },
  { icon: Fingerprint, name: 'Maigret' },
  { icon: Ghost, name: 'Buster' },
];

export const MarketingExplainer = () => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Notre avantage : L'investigation interconnectée</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-center items-center text-center">
        <div className="space-y-8">
          <div>
            <h4 className="font-semibold mb-2 text-muted-foreground">Approche Standard : Outils en Silo</h4>
            <p className="text-xs text-muted-foreground mb-4">Les outils sont lancés les uns après les autres, sans partage d'informations.</p>
            <div className="flex items-center justify-center space-x-2 text-gray-500">
              {toolIcons.map((tool, index) => (
                <React.Fragment key={tool.name}>
                  <div className="flex flex-col items-center">
                    <tool.icon className="h-8 w-8" />
                    <span className="text-xs mt-1">{tool.name}</span>
                  </div>
                  {index < toolIcons.length - 1 && <ArrowRight className="h-5 w-5" />}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="border-t pt-8">
            <h4 className="font-semibold mb-2 text-primary">Notre Révolution : L'Écosystème d'Enrichissement</h4>
            <p className="text-xs text-muted-foreground mb-4">
              NumOSINT transforme chaque investigation en un cycle vertueux. Un email trouvé par <span className="font-bold text-primary">Mosint</span> révèle un pseudo, qui est instantanément analysé par <span className="font-bold text-primary">Maigret</span> pour trouver de nouveaux profils. Chaque profil est ensuite enrichi par <span className="font-bold text-primary">Buster</span>. C'est une réaction en chaîne qui démultiplie les résultats.
            </p>
            <div className="relative w-48 h-48 mx-auto">
              {toolIcons.map((tool, index) => {
                const angle = (index / toolIcons.length) * 2 * Math.PI;
                const x = Math.cos(angle) * 60 + 64;
                const y = Math.sin(angle) * 60 + 64;
                return (
                  <motion.div
                    key={tool.name}
                    className="absolute flex flex-col items-center text-yellow-500"
                    initial={{ x, y, scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.2 }}
                  >
                    <tool.icon className="h-8 w-8" />
                    <span className="text-xs mt-1">{tool.name}</span>
                  </motion.div>
                );
              })}
              <motion.div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-yellow-500"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Zap className="h-10 w-10" />
              </motion.div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};