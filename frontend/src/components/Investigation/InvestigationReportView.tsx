'use client';

import React, { useMemo } from 'react';
import { Investigation, Result, Indicator } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Person, Email, Phone as PhoneIcon, LocationOn, Link as MuiLink, Language } from '@mui/icons-material';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

interface InvestigationReportViewProps {
  investigation: Investigation;
  results: Result[];
  indicators: Indicator[];
}

interface KeyInfo {
  names: string[];
  emails: string[];
  phones: string[];
  locations: string[];
}

interface OnlineAccount {
  platform: string;
  username: string;
  url: string;
  category?: string;
}

const InvestigationReportView: React.FC<InvestigationReportViewProps> = ({
  investigation,
  results,
  indicators,
}) => {
  const processedData = useMemo(() => {
    const keyInfo: KeyInfo = { names: [], emails: [], phones: [], locations: [] };
    const onlineAccounts: OnlineAccount[] = [];
    const imageUrls: string[] = [];

    // Extraire les noms des indicateurs initiaux
    keyInfo.names = indicators.filter(ind => ind.type === 'NAME').map(ind => ind.value);

    results.forEach(result => {
      const { toolSource, data } = result;
      
      // Mosint (email info)
      if (toolSource.toLowerCase() === 'mosint' && data) {
        if (data.email && !keyInfo.emails.includes(data.email)) {
          keyInfo.emails.push(data.email);
        }
        if (data.social_profiles) {
            data.social_profiles.forEach((profile: any) => {
                if(profile.url && !onlineAccounts.some(acc => acc.url === profile.url)) {
                    onlineAccounts.push({
                        platform: profile.platform,
                        username: profile.username || 'N/A',
                        url: profile.url,
                    });
                }
            });
        }
      }

      // PhoneInfoga (phone info)
      if (toolSource.toLowerCase() === 'phoneinfoga' && data) {
        if (data.phone_number && !keyInfo.phones.includes(data.phone_number)) {
          keyInfo.phones.push(data.phone_number);
        }
        if (data.location_info?.name && !keyInfo.locations.includes(data.location_info.name)) {
          keyInfo.locations.push(data.location_info.name);
        }
      }

      // Maigret (username info)
      if (toolSource.toLowerCase() === 'maigret' && data) {
        if (data.found_profiles) {
          data.found_profiles.forEach((profile: any) => {
            if (profile.url && !onlineAccounts.some(acc => acc.url === profile.url)) {
              onlineAccounts.push({
                platform: profile.site_name,
                username: profile.username_on_site,
                url: profile.url,
                category: profile.category,
              });
              if (profile.profile_pic_url) {
                imageUrls.push(profile.profile_pic_url);
              }
            }
          });
        }
      }
    });

    return { keyInfo, onlineAccounts, imageUrls };
  }, [results, indicators]);

  const { keyInfo, onlineAccounts, imageUrls } = processedData;

  const getPrimaryTarget = () => {
    const { inputData } = investigation;
    if (!inputData) return "N/A";
    return inputData.names?.[0] || inputData.usernames?.[0] || inputData.emails?.[0] || "Cible inconnue";
  };

  const InfoItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | string[] | null }) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;
    return (
      <div className="flex items-start gap-4">
        <div className="text-muted-foreground mt-1">{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          {Array.isArray(value) ? (
            value.map((v, i) => <p key={i} className="font-semibold">{v}</p>)
          ) : (
            <p className="font-semibold">{value}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Rapport de Synthèse</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Ce rapport consolide toutes les informations collectées lors de l&apos;investigation sur{" "}
            <span className="font-semibold text-primary">{getPrimaryTarget()}</span>.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations Clés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoItem icon={<Person className="h-5 w-5" />} label="Noms" value={keyInfo.names} />
              <InfoItem icon={<Email className="h-5 w-5" />} label="Emails" value={keyInfo.emails} />
              <InfoItem icon={<PhoneIcon className="h-5 w-5" />} label="Téléphones" value={keyInfo.phones} />
              <InfoItem icon={<LocationOn className="h-5 w-5" />} label="Localisations" value={keyInfo.locations} />
            </CardContent>
          </Card>
          
          {imageUrls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Images Associées</CardTitle>
              </CardHeader>
              <CardContent>
                <Carousel className="w-full">
                  <CarouselContent>
                    {imageUrls.map((url, index) => (
                      <CarouselItem key={index}>
                        <div className="p-1 relative w-full h-48">
                          <Image src={url} alt={`Image associée ${index + 1}`} layout="fill" objectFit="cover" className="rounded-lg" />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Comptes en Ligne ({onlineAccounts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {onlineAccounts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plateforme</TableHead>
                      <TableHead>Nom d&apos;utilisateur</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Lien</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {onlineAccounts.map((account, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{account.platform}</TableCell>
                        <TableCell>{account.username}</TableCell>
                        <TableCell>
                          {account.category && <Badge variant="outline">{account.category}</Badge>}
                        </TableCell>
                        <TableCell>
                          <a href={account.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            <MuiLink className="h-4 w-4 inline-block" />
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Language className="h-8 w-8 mx-auto mb-2" />
                  <p>Aucun compte en ligne trouvé.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InvestigationReportView;