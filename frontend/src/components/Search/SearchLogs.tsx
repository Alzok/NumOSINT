"use client"

import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

const ExpandLessIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 15-6-6-6 6"/>
  </svg>
);

const ExpandMoreIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

const SearchLogs = () => {
  const logs = useAppStore((state) => state.searchLogs);
  const progress = useAppStore((state) => state.searchProgress);
  const isExpanded = useAppStore((state) => state.isSearchLogExpanded);
  const setIsExpanded = useAppStore((state) => state.setIsSearchLogExpanded);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isExpanded]);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="mb-1">Logs de Recherche</CardTitle>
            <CardDescription>Suivez l'avancement de la recherche en temps réel.</CardDescription>
          </div>
          <Button variant="ghost" size="icon">
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Button>
        </div>
      </CardHeader>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="overflow-hidden">
              <CardContent className="flex flex-col flex-grow pt-0">
                <Progress value={progress} className="w-full mb-4" />
                <div ref={scrollRef} className="flex-grow overflow-y-auto bg-muted/50 p-4 rounded-lg text-sm font-mono h-64">
                  {logs.length > 0
                    ? logs.map((log, index) => (
                        <div key={index}>{log}</div>
                      ))
                    : <div className="text-muted-foreground">En attente d'une nouvelle recherche...</div>
                  }
                </div>
              </CardContent>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default SearchLogs;