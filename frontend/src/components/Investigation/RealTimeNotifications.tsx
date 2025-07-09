import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Clock,
  Zap,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { InvestigationLog } from '@/lib/investigation-api';

interface RealTimeNotificationsProps {
  logs: InvestigationLog[];
  investigationId: string;
}

const RealTimeNotifications: React.FC<RealTimeNotificationsProps> = ({
  logs,
  investigationId,
}) => {
  const [visibleLogs, setVisibleLogs] = useState<InvestigationLog[]>(logs);

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'SUCCESS': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'ERROR': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'WARNING': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'INFO': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'SUCCESS': return 'border-l-green-500 bg-green-50';
      case 'ERROR': return 'border-l-red-500 bg-red-50';
      case 'WARNING': return 'border-l-yellow-500 bg-yellow-50';
      case 'INFO': return 'border-l-blue-500 bg-blue-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const clearLogs = () => {
    setVisibleLogs([]);
  };
  
  React.useEffect(() => {
    setVisibleLogs(logs);
  }, [logs]);

  return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Logs en temps réel</span>
              <Badge variant="outline">{visibleLogs.length}</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearLogs}
              className="flex items-center space-x-1"
            >
              <X className="h-4 w-4" />
              <span>Effacer</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {visibleLogs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={`border-l-4 p-3 rounded-r-lg ${getLogColor(log.level)}`}
                >
                  <div className="flex items-start space-x-2">
                    {getLogIcon(log.level)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{log.step}</span>
                        <span className="text-xs text-gray-500">{formatTime(log.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{log.message}</p>
                      
                      {log.metadata && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {log.metadata.tool && (
                            <Badge variant="outline" className="text-xs">
                              {log.metadata.tool}
                            </Badge>
                          )}
                          {log.metadata.count && (
                            <Badge variant="outline" className="text-xs">
                              {log.metadata.count} résultats
                            </Badge>
                          )}
                          {log.metadata.duration && (
                            <Badge variant="outline" className="text-xs">
                              {log.metadata.duration}s
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {visibleLogs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2" />
                <p>En attente des logs d'investigation...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
  );
};

export default RealTimeNotifications;