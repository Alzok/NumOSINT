import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Reputation = "Good" | "Suspicious" | "Bad";

interface EmailSummaryProps {
  email: string;
  reputation: Reputation;
}

const reputationVariantMap: Record<Reputation, "default" | "secondary" | "destructive"> = {
  Good: "default",
  Suspicious: "secondary",
  Bad: "destructive",
};

export function EmailSummary({ email, reputation }: EmailSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Email Information
          <Badge variant={reputationVariantMap[reputation]}>{reputation}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{email}</p>
      </CardContent>
    </Card>
  );
}