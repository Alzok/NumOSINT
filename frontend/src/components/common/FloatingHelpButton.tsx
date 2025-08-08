import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LifeBuoy } from "lucide-react";
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import Silk from '@/components/ui/Backgrounds/Silk/Silk';
import { useSession } from "next-auth/react";

export function FloatingHelpButton() {
  const { data: session } = useSession();

  const handleOpenTicket = () => {
    const subject = `Demande de support générale`;
    
    const userInfo = `--- Informations Utilisateur ---
Email: ${session?.user?.email || 'Non disponible'}
Plan: ${session?.user?.plan?.name || 'Non disponible'}
Rôle: ${session?.user?.role || 'Non disponible'}
`;

    const description = `Bonjour, j'ai une question ou un problème.

${userInfo}
`;
    const encodedSubject = encodeURIComponent(subject);
    const encodedDescription = encodeURIComponent(description);
    const customerEmail = encodeURIComponent(session?.user?.email || '');
    
    const ticketUrl = `/helpdesk/app/hd-ticket/new?subject=${encodedSubject}&description=${encodedDescription}&customer=${customerEmail}`;
    
    window.open(ticketUrl, '_blank');
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 120 }}
            onClick={handleOpenTicket}
            className="cursor-pointer"
          >
            <Card className="transition-transform hover:scale-105 relative overflow-hidden w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 overflow-hidden rounded-md">
                <Silk
                  speed={2}
                  scale={0.9}
                  color="#FFC700" // Jaune
                  noiseIntensity={8}
                  rotation={0}
                />
              </div>
              <div className="relative z-10">
                <LifeBuoy className="h-6 w-6 text-white" />
              </div>
            </Card>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Ouvrir un ticket de support</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}