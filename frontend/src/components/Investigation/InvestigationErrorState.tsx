import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Ticket } from "lucide-react";
import { useSession } from "next-auth/react";
import type { Investigation } from '@/types';

interface InvestigationErrorStateProps {
  investigation: Investigation;
}

export const InvestigationErrorState = ({ investigation }: InvestigationErrorStateProps) => {
  const { data: session } = useSession();

  const handleOpenTicket = () => {
    const subject = `Problème avec l'investigation : ${investigation.id}`;
    
    const userInfo = `--- Informations Utilisateur ---
Email: ${session?.user?.email || 'Non disponible'}
Plan: ${session?.user?.plan?.name || 'Non disponible'}
Rôle: ${session?.user?.role || 'Non disponible'}
`;

    const investigationInfo = `--- Informations Investigation ---
ID: ${investigation.id}
Statut: ${investigation.status}
Erreur: ${investigation.error || 'Non disponible'}
`;

    const description = `Une investigation a échoué.

${investigationInfo}
${userInfo}
`;
    const encodedSubject = encodeURIComponent(subject);
    const encodedDescription = encodeURIComponent(description);
    const customerEmail = encodeURIComponent(session?.user?.email || '');
    
    const ticketUrl = `/helpdesk/app/hd-ticket/new?subject=${encodedSubject}&description=${encodedDescription}&customer=${customerEmail}`;
    
    window.open(ticketUrl, '_blank');
  };

  return (
    <Card className="border-destructive bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <span>Échec de l'investigation</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-destructive/90 mb-4">
          L'investigation a rencontré une erreur et n'a pas pu se terminer.
        </p>
        <div className="p-3 bg-destructive/10 rounded-md border border-destructive/20 mb-4">
          <p className="text-xs text-destructive font-semibold mb-1">Message d'erreur :</p>
          <p className="text-xs text-destructive/80 font-mono">
            {investigation.error || "Aucun message d'erreur détaillé n'est disponible."}
          </p>
        </div>
        <Button variant="destructive" onClick={handleOpenTicket} className="w-full">
          <Ticket className="h-4 w-4 mr-2" />
          Contacter le support
        </Button>
      </CardContent>
    </Card>
  );
};