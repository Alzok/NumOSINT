"use client"

import { useSearchLogs, useSearchProgress } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useEffect, useRef } from 'react';

const SearchLogs = () => {
  const logs = useSearchLogs();
  const progress = useSearchProgress();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Logs de Recherche</CardTitle>
        <CardDescription>Suivez l'avancement de la recherche en temps réel.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow">
        <Progress value={progress} className="w-full mb-4" />
        <div ref={scrollRef} className="flex-grow overflow-y-auto bg-muted/50 p-4 rounded-lg text-sm font-mono">
          {logs.length > 0
            ? logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            : <div className="text-muted-foreground">En attente d'une nouvelle recherche...</div>
          }
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchLogs;