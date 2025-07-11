import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Person,
  Language,
  Security,
  CheckCircleOutline,
  Cancel,
  Schedule,
  Star,
  Group,
  OpenInNew
} from '@mui/icons-material';

interface UsernameProfile {
  platform: string;
  username: string;
  url: string;
  exists: boolean;
  verified: boolean;
  followers?: number;
  following?: number;
  posts?: number;
  bio?: string;
  avatar?: string;
  last_activity?: string;
  confidence_score: number;
  metadata?: {
    created_at?: string;
    location?: string;
    website?: string;
    profile_type?: string;
  };
}

interface UsernameAnalysisData {
  search_username: string;
  username_variations: string[];
  found_profiles: UsernameProfile[];
  statistics: {
    total_platforms: number;
    found_platforms: number;
    verified_profiles: number;
    success_rate: number;
  };
  related_usernames: string[];
}

interface UsernameAnalysisViewProps {
  data: UsernameAnalysisData[];
  loading?: boolean;
}

const UsernameAnalysisView: React.FC<UsernameAnalysisViewProps> = ({ data, loading = false }) => {
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
        <Person className="h-4 w-4" />
        <AlertDescription>
          Aucune analyse de nom d'utilisateur disponible pour cette investigation.
        </AlertDescription>
      </Alert>
    );
  }

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      'Twitter': 'bg-blue-500',
      'Facebook': 'bg-blue-600',
      'Instagram': 'bg-pink-500',
      'LinkedIn': 'bg-blue-700',
      'GitHub': 'bg-gray-800',
      'YouTube': 'bg-red-500',
      'TikTok': 'bg-black',
      'Reddit': 'bg-orange-500',
      'Discord': 'bg-indigo-500',
      'Telegram': 'bg-blue-400',
    };
    return colors[platform] || 'bg-gray-500';
  };

  const formatNumber = (num?: number) => {
    if (!num) return 'N/A';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Person className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-semibold">Analyse des Noms d'Utilisateur</h2>
        <Badge variant="outline">{data.length} recherche(s)</Badge>
      </div>

      {data.map((analysis, index) => (
        <Card key={index} className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Person className="h-5 w-5" />
                <span className="font-mono text-sm">{analysis.search_username}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {analysis.statistics.found_platforms}/{analysis.statistics.total_platforms} trouvés
                </Badge>
                <Badge variant={analysis.statistics.success_rate > 0.5 ? "default" : "secondary"}>
                  {Math.round(analysis.statistics.success_rate * 100)}%
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Statistiques globales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{analysis.statistics.total_platforms}</div>
                <div className="text-sm text-gray-600">Plateformes scannées</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{analysis.statistics.found_platforms}</div>
                <div className="text-sm text-gray-600">Profils trouvés</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{analysis.statistics.verified_profiles}</div>
                <div className="text-sm text-gray-600">Profils vérifiés</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{Math.round(analysis.statistics.success_rate * 100)}%</div>
                <div className="text-sm text-gray-600">Taux de succès</div>
              </div>
            </div>

            {/* Taux de réussite */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Taux de réussite global</span>
                <span className="text-sm text-gray-600">{Math.round(analysis.statistics.success_rate * 100)}%</span>
              </div>
              <Progress value={analysis.statistics.success_rate * 100} className="h-2" />
            </div>

            {/* Variations de nom d'utilisateur */}
            {analysis.username_variations && analysis.username_variations.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Group className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Variations testées</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {analysis.username_variations.map((variation, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {variation}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Profils trouvés */}
            {analysis.found_profiles && analysis.found_profiles.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Language className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Profils trouvés</span>
                  <Badge variant="outline">{analysis.found_profiles.length}</Badge>
                </div>

                <div className="grid gap-4">
                  {analysis.found_profiles.map((profile, i) => (
                    <div key={i} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${getPlatformColor(profile.platform)}`} />
                          <span className="font-medium">{profile.platform}</span>
                          {profile.verified && (
                            <CheckCircleOutline className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {Math.round(profile.confidence_score * 100)}% confiance
                          </Badge>
                          <a
                            href={profile.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <OpenInNew className="h-4 w-4" />
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Person className="h-4 w-4 text-gray-500" />
                        <span className="font-mono text-sm">{profile.username}</span>
                      </div>

                      {profile.bio && (
                        <div className="text-sm text-gray-600 italic">
                          "{profile.bio}"
                        </div>
                      )}

                      {/* Statistiques du profil */}
                      {(profile.followers || profile.following || profile.posts) && (
                        <div className="flex space-x-4 text-sm">
                          {profile.followers && (
                            <div>
                              <span className="font-medium">{formatNumber(profile.followers)}</span>
                              <span className="text-gray-600 ml-1">followers</span>
                            </div>
                          )}
                          {profile.following && (
                            <div>
                              <span className="font-medium">{formatNumber(profile.following)}</span>
                              <span className="text-gray-600 ml-1">following</span>
                            </div>
                          )}
                          {profile.posts && (
                            <div>
                              <span className="font-medium">{formatNumber(profile.posts)}</span>
                              <span className="text-gray-600 ml-1">posts</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Métadonnées */}
                      {profile.metadata && (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {profile.metadata.location && (
                            <div>
                              <span className="font-medium">Localisation:</span>
                              <span className="ml-2 text-gray-600">{profile.metadata.location}</span>
                            </div>
                          )}
                          {profile.metadata.created_at && (
                            <div>
                              <span className="font-medium">Créé le:</span>
                              <span className="ml-2 text-gray-600">{profile.metadata.created_at}</span>
                            </div>
                          )}
                          {profile.metadata.website && (
                            <div>
                              <span className="font-medium">Site web:</span>
                              <a 
                                href={profile.metadata.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="ml-2 text-blue-600 hover:text-blue-800"
                              >
                                {profile.metadata.website}
                              </a>
                            </div>
                          )}
                          {profile.last_activity && (
                            <div>
                              <span className="font-medium">Dernière activité:</span>
                              <span className="ml-2 text-gray-600">{profile.last_activity}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Noms d'utilisateur liés */}
            {analysis.related_usernames && analysis.related_usernames.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Group className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Noms d'utilisateur liés</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {analysis.related_usernames.map((username, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {username}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default UsernameAnalysisView; 