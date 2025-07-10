import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface SocialProfile {
  siteName: string;
  profileUrl: string;
  logoUrl: string;
}

interface SocialProfilesProps {
  profiles: SocialProfile[];
}

const mockProfiles: SocialProfile[] = [
  {
    siteName: "Facebook",
    profileUrl: "https://www.facebook.com/johndoe",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg",
  },
  {
    siteName: "Twitter",
    profileUrl: "https://twitter.com/johndoe",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/6/60/X_logo.svg",
  },
  {
    siteName: "LinkedIn",
    profileUrl: "https://www.linkedin.com/in/johndoe",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png",
  },
  {
    siteName: "GitHub",
    profileUrl: "https://github.com/johndoe",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg",
  },
];

export function SocialProfiles({ profiles = mockProfiles }: SocialProfilesProps) {
  if (!profiles || profiles.length === 0) {
    return <p>No social profiles found.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {profiles.map((profile) => (
        <Card key={profile.siteName}>
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar>
              <AvatarImage src={profile.logoUrl} alt={`${profile.siteName} logo`} />
              <AvatarFallback>{profile.siteName.charAt(0)}</AvatarFallback>
            </Avatar>
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