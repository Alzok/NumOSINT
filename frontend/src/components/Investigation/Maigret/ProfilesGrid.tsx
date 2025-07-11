import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import { GitHub, Twitter, LinkedIn, Instagram, Facebook, Reddit } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";


interface Profile {
  siteName: string;
  profileUrl: string;
  siteLogoUrl: string;
  bio?: string;
  location?: string;
  fullName?: string;
}

interface ProfilesGridProps {
  profiles: Profile[];
  investigationId: string;
  username: string;
}

const ProfilesGrid: React.FC<ProfilesGridProps> = ({ profiles, investigationId, username }) => {
  const [isRecursiveLoading, setIsRecursiveLoading] = useState(false);
  const [isTagLoading, setIsTagLoading] = useState(false);
  const [tags, setTags] = useState('');

  const getSocialIcon = (siteName: string) => {
    switch (siteName.toLowerCase()) {
      case 'github':
        return <GitHub />;
      case 'twitter':
        return <Twitter />;
      case 'linkedin':
        return <LinkedIn />;
      case 'instagram':
        return <Instagram />;
      case 'facebook':
        return <Facebook />;
      case 'reddit':
        return <Reddit />;
      default:
        return null;
    }
  };

  const handleRecursiveSearch = async () => {
    setIsRecursiveLoading(true);
    toast.info(`Lancement de la recherche récursive pour ${username}...`);
    try {
      const response = await fetch(`/api/v1/investigations/${investigationId}/recursive-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'La recherche récursive a échoué.');
      }

      toast.success("La recherche récursive a été lancée. Les résultats apparaîtront au fur et à mesure.");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Une erreur inconnue est survenue.");
      }
    } finally {
      setIsRecursiveLoading(false);
    }
  };

  const handleTagSearch = async () => {
    if (!tags) {
      toast.warning("Veuillez entrer des tags pour la recherche.");
      return;
    }
    setIsTagLoading(true);
    toast.info(`Lancement de la recherche par tags pour ${username}...`);
    try {
      // Note: This API endpoint needs to be created.
      const response = await fetch(`/api/v1/investigations/${investigationId}/tag-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, tags }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'La recherche par tags a échoué.');
      }

      toast.success("La recherche par tags a été lancée. Les résultats seront mis à jour.");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Une erreur inconnue est survenue.");
      }
    } finally {
      setIsTagLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filtrer par tags (ex: gaming,social)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-64"
          />
          <Button onClick={handleTagSearch} disabled={isTagLoading}>
            {isTagLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Rechercher
          </Button>
        </div>
        <Button onClick={handleRecursiveSearch} disabled={isRecursiveLoading}>
          {isRecursiveLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Lancer une recherche récursive
        </Button>
      </div>
      
      {(!profiles || profiles.length === 0) && <p>Aucun profil trouvé pour le moment.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((profile) => (
          <Popover key={profile.siteName}>
            <PopoverTrigger asChild>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    {getSocialIcon(profile.siteName) || <div className="w-10 h-10 rounded-full bg-gray-200" />}
                    <CardTitle>{profile.siteName}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="link" className="p-0">
                    <Link href={profile.profileUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                      Voir le profil
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">{profile.fullName || 'N/A'}</h4>
                  <p className="text-sm text-muted-foreground">
                    {profile.bio || 'Aucune bio disponible.'}
                  </p>
                </div>
                <div className="grid gap-2">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <span className="font-semibold">Lieu</span>
                    <span className="col-span-2">{profile.location || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        ))}
      </div>
    </div>
  );
};

export default ProfilesGrid;