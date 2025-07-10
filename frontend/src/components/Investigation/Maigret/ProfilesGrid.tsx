import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
}

// Mock data with extra details for demonstration
const sampleProfiles: Profile[] = [
  {
    siteName: "GitHub",
    profileUrl: "https://github.com/example",
    siteLogoUrl: "/github-logo.png",
    bio: "Software developer, open source enthusiast.",
    location: "San Francisco, CA",
    fullName: "John Doe",
  },
  {
    siteName: "Twitter",
    profileUrl: "https://twitter.com/example",
    siteLogoUrl: "/twitter-logo.png",
    bio: "Tweeting about tech and life.",
    location: "New York, NY",
    fullName: "Jane Smith",
  },
  {
    siteName: "LinkedIn",
    profileUrl: "https://linkedin.com/in/example",
    siteLogoUrl: "/linkedin-logo.png",
    bio: "Product Manager at a tech company.",
    location: "Austin, TX",
    fullName: "Sam Wilson",
  },
];


const ProfilesGrid: React.FC<ProfilesGridProps> = ({ profiles = sampleProfiles }) => {
  if (!profiles || profiles.length === 0) {
    return <p>No profiles found.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {profiles.map((profile) => (
        <Popover key={profile.siteName}>
          <PopoverTrigger asChild>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Image src={profile.siteLogoUrl} alt={`${profile.siteName} logo`} width={40} height={40} className="rounded-full" />
                  <CardTitle>{profile.siteName}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild variant="link" className="p-0">
                  <Link href={profile.profileUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                    View Profile
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
                  {profile.bio || 'No bio available.'}
                </p>
              </div>
              <div className="grid gap-2">
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-semibold">Location</span>
                  <span className="col-span-2">{profile.location || 'N/A'}</span>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  );
};

export default ProfilesGrid;