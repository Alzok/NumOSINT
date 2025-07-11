import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Briefcase, Mail, Phone, School, Home } from 'lucide-react';

interface PersonProfile {
  fullName: string;
  avatarUrl?: string;
  title?: string;
  company?: string;
  location?: string;
  emails?: { address: string, type: string }[];
  phones?: string[];
  education?: { school: string, degree: string, end_date: string }[];
  experience?: { company: string, title: string, start_date: string, end_date: string }[];
}

interface PersonProfileViewProps {
  profile: PersonProfile;
}

const PersonProfileView: React.FC<PersonProfileViewProps> = ({ profile }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center space-x-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile.avatarUrl} />
          <AvatarFallback>{profile.fullName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-2xl">{profile.fullName}</CardTitle>
          {profile.title && profile.company && (
            <p className="text-muted-foreground">{profile.title} at {profile.company}</p>
          )}
          {profile.location && (
            <p className="text-sm text-muted-foreground flex items-center mt-1">
              <Home className="h-4 w-4 mr-2" />
              {profile.location}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {profile.emails && (
          <div>
            <h3 className="font-semibold flex items-center"><Mail className="h-4 w-4 mr-2" /> Emails</h3>
            <ul className="list-disc list-inside">
              {profile.emails.map((email, i) => <li key={i}>{email.address} ({email.type})</li>)}
            </ul>
          </div>
        )}
        {profile.phones && (
          <div>
            <h3 className="font-semibold flex items-center"><Phone className="h-4 w-4 mr-2" /> Phones</h3>
            <ul className="list-disc list-inside">
              {profile.phones.map((phone, i) => <li key={i}>{phone}</li>)}
            </ul>
          </div>
        )}
        {profile.experience && (
          <div>
            <h3 className="font-semibold flex items-center"><Briefcase className="h-4 w-4 mr-2" /> Experience</h3>
            {profile.experience.map((exp, i) => (
              <div key={i} className="mt-2">
                <p className="font-medium">{exp.title} at {exp.company}</p>
                <p className="text-sm text-muted-foreground">{exp.start_date} - {exp.end_date || 'Present'}</p>
              </div>
            ))}
          </div>
        )}
        {profile.education && (
          <div>
            <h3 className="font-semibold flex items-center"><School className="h-4 w-4 mr-2" /> Education</h3>
            {profile.education.map((edu, i) => (
              <div key={i} className="mt-2">
                <p className="font-medium">{edu.degree} from {edu.school}</p>
                <p className="text-sm text-muted-foreground">Finished in {edu.end_date}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PersonProfileView;