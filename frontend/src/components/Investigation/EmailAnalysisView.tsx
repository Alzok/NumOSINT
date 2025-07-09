import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Globe,
  User,
  Calendar,
  Database
} from 'lucide-react';

interface EmailAnalysisData {
  email: string;
  breaches: Array<{
    name: string;
    date: string;
    compromised_data: string[];
    verified: boolean;
    severity: 'low' | 'medium' | 'high';
  }>;
  reputation: {
    score: number;
    status: 'clean' | 'suspicious' | 'malicious';
    sources: string[];
  };
  social_profiles: Array<{
    platform: string;
    url: string;
    verified: boolean;
  }>;
  metadata: {
    domain: string;
    mx_records: string[];
    created_at: string;
    last_seen: string;
  };
}

interface EmailAnalysisViewProps {
  data: EmailAnalysisData[];
  loading?: boolean;
}

const EmailAnalysisView: React.FC<EmailAnalysisViewProps> = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2 mt-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Alert>
        <Mail className="h-4 w-4" />
        <AlertDescription>
          Aucune analyse d'email disponible pour cette investigation.
        </AlertDescription>
      </Alert>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getReputationColor = (status: string) => {
    switch (status) {
      case 'clean': return 'text-green-600';
      case 'suspicious': return 'text-yellow-600';
      case 'malicious': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getReputationIcon = (status: string) => {
    switch (status) {
      case 'clean': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'suspicious': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'malicious': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Mail className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-semibold">Analyse des Emails</h2>
        <Badge variant="outline">{data.length} email(s)</Badge>
      </div>

      {data.map((analysis, index) => (
        <Card key={index} className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span className="font-mono text-sm">{analysis.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                {getReputationIcon(analysis.reputation.status)}
                <span className={`text-sm font-medium ${getReputationColor(analysis.reputation.status)}`}>
                  {analysis.reputation.status.toUpperCase()}
                </span>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Score de réputation */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Score de réputation</span>
                <span className="text-sm text-gray-600">{analysis.reputation.score}/100</span>
              </div>
              <Progress value={analysis.reputation.score} className="h-2" />
              <div className="flex flex-wrap gap-1 mt-2">
                {analysis.reputation.sources.map((source, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {source}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Fuites de données */}
            {analysis.breaches && analysis.breaches.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-red-500" />
                  <span className="font-medium">Fuites de données détectées</span>
                  <Badge variant="destructive">{analysis.breaches.length}</Badge>
                </div>
                
                <div className="grid gap-3">
                  {analysis.breaches.map((breach, i) => (
                    <div key={i} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{breach.name}</span>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getSeverityColor(breach.severity)}`} />
                          <span className="text-sm text-gray-600">{breach.severity}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="h-3 w-3" />
                        <span>{breach.date}</span>
                        {breach.verified && (
                          <Badge variant="outline" className="text-xs">
                            Vérifié
                          </Badge>
                        )}
                      </div>

                      {breach.compromised_data && breach.compromised_data.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {breach.compromised_data.map((data, j) => (
                            <Badge key={j} variant="secondary" className="text-xs">
                              {data}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Profils sociaux */}
            {analysis.social_profiles && analysis.social_profiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Profils sociaux associés</span>
                  <Badge variant="outline">{analysis.social_profiles.length}</Badge>
                </div>
                
                <div className="grid gap-2">
                  {analysis.social_profiles.map((profile, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{profile.platform}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a 
                          href={profile.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Voir le profil
                        </a>
                        {profile.verified && (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Métadonnées */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Informations techniques</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Domaine:</span>
                  <span className="ml-2 text-gray-600">{analysis.metadata.domain}</span>
                </div>
                <div>
                  <span className="font-medium">Première détection:</span>
                  <span className="ml-2 text-gray-600">{analysis.metadata.created_at}</span>
                </div>
                <div>
                  <span className="font-medium">Dernière activité:</span>
                  <span className="ml-2 text-gray-600">{analysis.metadata.last_seen}</span>
                </div>
                <div>
                  <span className="font-medium">MX Records:</span>
                  <span className="ml-2 text-gray-600">{analysis.metadata.mx_records.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default EmailAnalysisView; 