import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Phone as PhoneIcon,
  LocationOn,
  Language,
  Security,
  Warning,
  CheckCircleOutline,
  Cancel,
  Schedule,
  Wifi,
  Business,
  Group
} from '@mui/icons-material';

interface PhoneAnalysisData {
  phone_number: string;
  country_info: {
    name: string;
    code: string;
    flag: string;
    timezone: string;
    currency: string;
  };
  carrier_info: {
    name: string;
    type: 'Mobile' | 'Landline' | 'VoIP' | 'Unknown';
    mcc: string;
    mnc: string;
    network_type: string;
  };
  location_info: {
    city?: string;
    region?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    accuracy: 'High' | 'Medium' | 'Low';
  };
  validation: {
    is_valid: boolean;
    is_possible: boolean;
    format_international: string;
    format_national: string;
    format_e164: string;
  };
  risk_assessment: {
    risk_level: 'Low' | 'Medium' | 'High';
    score: number;
    factors: string[];
    reputation: 'Clean' | 'Suspicious' | 'Blacklisted';
  };
  social_media: Array<{
    platform: string;
    found: boolean;
    profile_url?: string;
    username?: string;
    confidence: number;
  }>;
  metadata: {
    line_type: string;
    time_zone: string;
    last_scan: string;
    source: string;
  };
}

interface PhoneAnalysisViewProps {
  data: PhoneAnalysisData[];
  loading?: boolean;
}

const PhoneAnalysisView: React.FC<PhoneAnalysisViewProps> = ({ data, loading = false }) => {
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
        <PhoneIcon className="h-4 w-4" />
        <AlertDescription>
          Aucune analyse de numéro de téléphone disponible pour cette investigation.
        </AlertDescription>
      </Alert>
    );
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'High': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'Low': return <CheckCircleOutline className="h-4 w-4 text-green-600" />;
      case 'Medium': return <Warning className="h-4 w-4 text-yellow-600" />;
      case 'High': return <Cancel className="h-4 w-4 text-red-600" />;
      default: return <Security className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCarrierTypeColor = (type: string) => {
    switch (type) {
      case 'Mobile': return 'bg-blue-100 text-blue-800';
      case 'Landline': return 'bg-green-100 text-green-800';
      case 'VoIP': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAccuracyColor = (accuracy: string) => {
    switch (accuracy) {
      case 'High': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <PhoneIcon className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-semibold">Analyse des Numéros de Téléphone</h2>
        <Badge variant="outline">{data.length} numéro(s)</Badge>
      </div>

      {data.map((analysis, index) => (
        <Card key={index} className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <PhoneIcon className="h-5 w-5" />
                <span className="font-mono text-sm">{analysis.validation.format_international}</span>
                <span className="text-lg">{analysis.country_info.flag}</span>
              </div>
              <div className="flex items-center space-x-2">
                {getRiskIcon(analysis.risk_assessment.risk_level)}
                <span className={`text-sm font-medium ${getRiskColor(analysis.risk_assessment.risk_level)}`}>
                  {analysis.risk_assessment.risk_level} Risk
                </span>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Informations de base */}
            <Card>
              <CardHeader>
                <CardTitle>Informations de base</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl">{analysis.country_info.flag}</p>
                  <p className="text-sm font-medium">{analysis.country_info.name}</p>
                  <p className="text-xs text-gray-500">Pays</p>
                </div>
                <div>
                  <p className="font-semibold">{analysis.carrier_info.name}</p>
                  <p className="text-xs text-gray-500">Opérateur</p>
                </div>
                <div>
                  <Badge className={getCarrierTypeColor(analysis.carrier_info.type)}>
                    {analysis.carrier_info.type}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">Type de ligne</p>
                </div>
              </CardContent>
            </Card>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="validation">
                <AccordionTrigger>Validation & Formats</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Security className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Validation</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Valide:</span>
                          <span className={analysis.validation.is_valid ? 'text-green-600' : 'text-red-600'}>
                            {analysis.validation.is_valid ? 'Oui' : 'Non'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Possible:</span>
                          <span className={analysis.validation.is_possible ? 'text-green-600' : 'text-red-600'}>
                            {analysis.validation.is_possible ? 'Oui' : 'Non'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Language className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Formats</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="font-medium">National:</span>
                          <span className="ml-2 font-mono">{analysis.validation.format_national}</span>
                        </div>
                        <div>
                          <span className="font-medium">E164:</span>
                          <span className="ml-2 font-mono">{analysis.validation.format_e164}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="geo">
                <AccordionTrigger>Informations géographiques</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl">{analysis.country_info.flag}</div>
                        <div className="text-sm font-medium">{analysis.country_info.name}</div>
                        <div className="text-xs text-gray-600">{analysis.country_info.code}</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium">Fuseau horaire</div>
                        <div className="text-xs text-gray-600">{analysis.country_info.timezone}</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium">Monnaie</div>
                        <div className="text-xs text-gray-600">{analysis.country_info.currency}</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium">Précision</div>
                        <div className={`text-xs ${getAccuracyColor(analysis.location_info.accuracy)}`}>
                          {analysis.location_info.accuracy}
                        </div>
                      </div>
                    </div>

                    {(analysis.location_info.city || analysis.location_info.region) && (
                      <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                        {analysis.location_info.city && (
                          <div>
                            <span className="font-medium">Ville:</span>
                            <span className="ml-2 text-gray-600">{analysis.location_info.city}</span>
                          </div>
                        )}
                        {analysis.location_info.region && (
                          <div>
                            <span className="font-medium">Région:</span>
                            <span className="ml-2 text-gray-600">{analysis.location_info.region}</span>
                          </div>
                        )}
                        {analysis.location_info.coordinates && (
                          <div className="col-span-2">
                            <span className="font-medium">Coordonnées:</span>
                            <span className="ml-2 text-gray-600 font-mono">
                              {analysis.location_info.coordinates.latitude.toFixed(4)},
                              {analysis.location_info.coordinates.longitude.toFixed(4)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="carrier">
                <AccordionTrigger>Informations de l&apos;opérateur</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Opérateur:</span>
                      <span className="ml-2 text-gray-600">{analysis.carrier_info.name}</span>
                    </div>
                    <div>
                      <span className="font-medium">Type:</span>
                      <Badge className={`ml-2 ${getCarrierTypeColor(analysis.carrier_info.type)}`}>
                        {analysis.carrier_info.type}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Réseau:</span>
                      <span className="ml-2 text-gray-600">{analysis.carrier_info.network_type}</span>
                    </div>
                    <div>
                      <span className="font-medium">MCC/MNC:</span>
                      <span className="ml-2 text-gray-600 font-mono">
                        {analysis.carrier_info.mcc}/{analysis.carrier_info.mnc}
                      </span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="risk">
                <AccordionTrigger>Évaluation des risques</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Score de risque</span>
                      <span className="text-sm text-gray-600">{analysis.risk_assessment.score}/100</span>
                    </div>
                    <Progress value={analysis.risk_assessment.score} className="h-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Réputation:</span>
                      <div>
                        {analysis.risk_assessment.factors.includes('disposable') ? (
                          <Badge variant="destructive" className="mr-2">Jetable</Badge>
                        ) : analysis.risk_assessment.factors.includes('spam') ? (
                          <Badge variant="destructive">Spam signalé</Badge>
                        ) : (
                          <Badge variant={analysis.risk_assessment.reputation === 'Clean' ? 'default' : 'destructive'}>
                            {analysis.risk_assessment.reputation}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {analysis.risk_assessment.factors.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <span className="text-sm font-medium">Facteurs de risque:</span>
                      <div className="flex flex-wrap gap-1">
                        {analysis.risk_assessment.factors.map((factor, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {analysis.social_media && analysis.social_media.length > 0 && (
                <AccordionItem value="social">
                  <AccordionTrigger>Profils sociaux associés</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-2">
                      {analysis.social_media.map((social, i) => (
                        <div key={i} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center space-x-2">
                            <Wifi className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{social.platform}</span>
                            {social.username && (
                              <span className="text-sm text-gray-600">@{social.username}</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {Math.round(social.confidence * 100)}%
                            </Badge>
                            {social.found && social.profile_url && (
                              <a
                                href={social.profile_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Voir le profil
                              </a>
                            )}
                            {social.found ? (
                              <CheckCircleOutline className="h-3 w-3 text-green-500" />
                            ) : (
                              <Cancel className="h-3 w-3 text-red-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              <AccordionItem value="tech">
                <AccordionTrigger>Informations techniques</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Type de ligne:</span>
                      <span className="ml-2 text-gray-600">{analysis.metadata.line_type}</span>
                    </div>
                    <div>
                      <span className="font-medium">Fuseau horaire:</span>
                      <span className="ml-2 text-gray-600">{analysis.metadata.time_zone}</span>
                    </div>
                    <div>
                      <span className="font-medium">Dernier scan:</span>
                      <span className="ml-2 text-gray-600">{analysis.metadata.last_scan}</span>
                    </div>
                    <div>
                      <span className="font-medium">Source:</span>
                      <span className="ml-2 text-gray-600">{analysis.metadata.source}</span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PhoneAnalysisView; 