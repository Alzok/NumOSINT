import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Globe, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Eye,
  Database,
  Network,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Filter,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface SpiderFootModule {
  name: string;
  category: 'DNS' | 'WHOIS' | 'Social' | 'Threat' | 'Passive' | 'Active' | 'Footprint';
  status: 'Completed' | 'Running' | 'Failed' | 'Skipped';
  findings: number;
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  execution_time: number;
  last_run: string;
}

interface SpiderFootFinding {
  id: string;
  module: string;
  type: string;
  data: string;
  confidence: number;
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  source_url?: string;
  timestamp: string;
  metadata?: {
    country?: string;
    organization?: string;
    asn?: string;
    ports?: number[];
    protocols?: string[];
    services?: string[];
  };
}

interface ComprehensiveReportData {
  target: string;
  scan_id: string;
  start_time: string;
  end_time: string;
  duration: number;
  modules: SpiderFootModule[];
  findings: SpiderFootFinding[];
  statistics: {
    total_modules: number;
    completed_modules: number;
    total_findings: number;
    critical_findings: number;
    high_findings: number;
    medium_findings: number;
    low_findings: number;
    success_rate: number;
  };
  risk_assessment: {
    overall_score: number;
    risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
    key_risks: string[];
    recommendations: string[];
  };
}

interface ComprehensiveReportViewProps {
  data: ComprehensiveReportData[];
  loading?: boolean;
}

const ComprehensiveReportView: React.FC<ComprehensiveReportViewProps> = ({ data, loading = false }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

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
        <Activity className="h-4 w-4" />
        <AlertDescription>
          Aucun rapport complet disponible pour cette investigation.
        </AlertDescription>
      </Alert>
    );
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'text-red-700 bg-red-100';
      case 'High': return 'text-red-600 bg-red-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'DNS': return 'bg-blue-100 text-blue-800';
      case 'WHOIS': return 'bg-purple-100 text-purple-800';
      case 'Social': return 'bg-pink-100 text-pink-800';
      case 'Threat': return 'bg-red-100 text-red-800';
      case 'Passive': return 'bg-green-100 text-green-800';
      case 'Active': return 'bg-orange-100 text-orange-800';
      case 'Footprint': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Running': return <Activity className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'Failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'Skipped': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const filterFindings = (findings: SpiderFootFinding[]) => {
    return findings.filter(finding => {
      const categoryMatch = selectedCategory === 'all' || 
        data[0].modules.find(m => m.name === finding.module)?.category === selectedCategory;
      const riskMatch = selectedRisk === 'all' || finding.risk_level === selectedRisk;
      return categoryMatch && riskMatch;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Activity className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-semibold">Rapport d'Investigation Complet</h2>
        <Badge variant="outline">{data.length} scan(s)</Badge>
      </div>

      {data.map((report, index) => (
        <Card key={index} className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span className="font-mono text-sm">{report.target}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getRiskColor(report.risk_assessment.risk_level)}>
                  {report.risk_assessment.risk_level}
                </Badge>
                <span className="text-sm text-gray-600">
                  {formatDuration(report.duration)}
                </span>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Statistiques générales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{report.statistics.total_modules}</div>
                <div className="text-sm text-gray-600">Modules exécutés</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{report.statistics.total_findings}</div>
                <div className="text-sm text-gray-600">Découvertes</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{report.statistics.critical_findings}</div>
                <div className="text-sm text-gray-600">Critiques</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{Math.round(report.statistics.success_rate * 100)}%</div>
                <div className="text-sm text-gray-600">Taux de succès</div>
              </div>
            </div>

            {/* Évaluation des risques */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-red-500" />
                <span className="font-medium">Évaluation des risques</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Score de risque global</span>
                  <span className="text-sm text-gray-600">{report.risk_assessment.overall_score}/100</span>
                </div>
                <Progress value={report.risk_assessment.overall_score} className="h-2" />
              </div>

              {report.risk_assessment.key_risks.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Risques clés identifiés:</span>
                  <div className="flex flex-wrap gap-1">
                    {report.risk_assessment.key_risks.map((risk, i) => (
                      <Badge key={i} variant="destructive" className="text-xs">
                        {risk}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Onglets pour les différentes vues */}
            <Tabs defaultValue="modules" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="modules">Modules</TabsTrigger>
                <TabsTrigger value="findings">Découvertes</TabsTrigger>
                <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
              </TabsList>

              <TabsContent value="modules" className="space-y-4">
                <div className="space-y-3">
                  {report.modules.map((module, i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(module.status)}
                          <span className="font-medium">{module.name}</span>
                          <Badge className={getCategoryColor(module.category)}>
                            {module.category}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{module.findings} découvertes</Badge>
                          <Badge className={getRiskColor(module.risk_level)}>
                            {module.risk_level}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedModule(expandedModule === module.name ? null : module.name)}
                          >
                            {expandedModule === module.name ? <ChevronUp /> : <ChevronDown />}
                          </Button>
                        </div>
                      </div>

                      {expandedModule === module.name && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Temps d'exécution:</span>
                              <span className="ml-2 text-gray-600">{formatDuration(module.execution_time)}</span>
                            </div>
                            <div>
                              <span className="font-medium">Dernière exécution:</span>
                              <span className="ml-2 text-gray-600">{module.last_run}</span>
                            </div>
                          </div>
                          
                          {/* Afficher les découvertes de ce module */}
                          <div className="space-y-1">
                            <span className="text-sm font-medium">Découvertes:</span>
                            {report.findings
                              .filter(f => f.module === module.name)
                              .slice(0, 3)
                              .map((finding, j) => (
                                <div key={j} className="text-sm bg-gray-50 p-2 rounded">
                                  <div className="flex justify-between items-start">
                                    <span className="font-mono">{finding.data}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {finding.confidence}%
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="findings" className="space-y-4">
                {/* Filtres */}
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4" />
                    <span className="text-sm font-medium">Filtres:</span>
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-1 border rounded text-sm"
                  >
                    <option value="all">Toutes les catégories</option>
                    <option value="DNS">DNS</option>
                    <option value="WHOIS">WHOIS</option>
                    <option value="Social">Social</option>
                    <option value="Threat">Threat</option>
                    <option value="Passive">Passive</option>
                    <option value="Active">Active</option>
                    <option value="Footprint">Footprint</option>
                  </select>
                  <select
                    value={selectedRisk}
                    onChange={(e) => setSelectedRisk(e.target.value)}
                    className="px-3 py-1 border rounded text-sm"
                  >
                    <option value="all">Tous les risques</option>
                    <option value="Critical">Critique</option>
                    <option value="High">Élevé</option>
                    <option value="Medium">Moyen</option>
                    <option value="Low">Faible</option>
                  </select>
                </div>

                {/* Liste des découvertes */}
                <div className="space-y-2">
                  {filterFindings(report.findings).map((finding, i) => (
                    <div key={i} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge className={getCategoryColor(
                            report.modules.find(m => m.name === finding.module)?.category || 'other'
                          )}>
                            {finding.module}
                          </Badge>
                          <span className="text-sm font-medium">{finding.type}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {finding.confidence}%
                          </Badge>
                          <Badge className={getRiskColor(finding.risk_level)}>
                            {finding.risk_level}
                          </Badge>
                        </div>
                      </div>

                      <div className="font-mono text-sm bg-gray-50 p-2 rounded mb-2">
                        {finding.data}
                      </div>

                      <div className="flex justify-between items-center text-xs text-gray-600">
                        <span>{finding.timestamp}</span>
                        {finding.source_url && (
                          <a 
                            href={finding.source_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Source</span>
                          </a>
                        )}
                      </div>

                      {finding.metadata && (
                        <div className="mt-2 text-xs text-gray-600">
                          {finding.metadata.country && (
                            <span className="mr-4">Pays: {finding.metadata.country}</span>
                          )}
                          {finding.metadata.organization && (
                            <span className="mr-4">Org: {finding.metadata.organization}</span>
                          )}
                          {finding.metadata.asn && (
                            <span className="mr-4">ASN: {finding.metadata.asn}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Recommandations de sécurité</span>
                  </div>
                  
                  <div className="space-y-2">
                    {report.risk_assessment.recommendations.map((recommendation, i) => (
                      <div key={i} className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-blue-800">{recommendation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ComprehensiveReportView; 