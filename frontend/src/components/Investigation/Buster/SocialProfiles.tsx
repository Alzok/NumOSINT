import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { GitHub, Twitter, LinkedIn, Instagram, Facebook, Reddit } from '@mui/icons-material';

interface SocialProfile {
  siteName: string;
  profileUrl: string;
}

interface SocialProfilesProps {
  profiles: SocialProfile[];
}

export function SocialProfiles({ profiles }: SocialProfilesProps) {
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

  if (!profiles || profiles.length === 0) {
    return <p>No social profiles found.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {profiles.map((profile) => (
        <Card key={profile.siteName}>
          <CardHeader className="flex flex-row items-center gap-4">
            {getSocialIcon(profile.siteName) || <div className="w-10 h-10 rounded-full bg-gray-200" />}
            <CardTitle>{profile.siteName}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href={profile.profileUrl} target="_blank" rel="noopener noreferrer">
                View Profile
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}