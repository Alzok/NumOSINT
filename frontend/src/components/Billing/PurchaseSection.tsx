'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Check, X, Crown, Target, Search, Zap, Ghost, Mail, Fingerprint, Phone, Bug, Database, Waypoints, UserSearch, HelpCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { MarketingExplainer } from './MarketingExplainer';

const toolIcons: { [key: string]: React.ElementType } = {
  wauService: Waypoints,
  asnService: UserSearch,
  busterService: Ghost,
  mosintService: Mail,
  maigretService: Fingerprint,
  pdlService: Database,
  spiderfootService: Bug,
};

const plans = [
  {
    id: 'DECOUVERTE',
    name: 'Découverte',
    price: 'Gratuit',
    tokens: '10 jetons/mois',
    icon: Search,
  },
  {
    id: 'ENQUETEUR',
    name: 'Enquêteur',
    price: '19€/mois',
    tokens: '75 jetons/mois',
    icon: Target,
  },
  {
    id: 'STRATEGE',
    name: 'Stratège',
    price: '49€/mois',
    tokens: '250 jetons/mois',
    icon: Crown,
    isPopular: true,
  },
];

const features = [
  {
    category: "Capacités d'Investigation",
    items: [
      { name: "Nombre d'indicateurs max", decouverte: '2', enqueteur: '15', stratege: 'Illimité' },
      { name: "Profondeur d'investigation", decouverte: 'Niveau 1', enqueteur: 'Niveau 3', stratege: 'Niveau 20' },
      { name: "Seuil de fiabilité ajustable", decouverte: false, enqueteur: true, stratege: true },
    ]
  },
  {
    category: "Accès aux Outils",
    items: [
      { name: "Mosint (Infos Email)", tool: "mosintService", decouverte: true, enqueteur: true, stratege: true },
      { name: "Maigret (Recherche de pseudos)", tool: "maigretService", decouverte: true, enqueteur: true, stratege: true },
      { name: "Wau (Vérification URL)", tool: "wauService", decouverte: false, enqueteur: true, stratege: true },
      { name: "Asn (Infos IP)", tool: "asnService", decouverte: false, enqueteur: true, stratege: true },
      { name: "Buster (Recherche de profils)", tool: "busterService", decouverte: false, enqueteur: true, stratege: true },
      { name: "PDL (Données professionnelles)", tool: "pdlService", decouverte: false, enqueteur: true, stratege: true },
      { name: "Spiderfoot (Scan de domaine)", tool: "spiderfootService", decouverte: false, enqueteur: false, stratege: true },
    ]
  },
  {
    category: "Fonctionnalités",
    items: [
      { name: "Sauvegarde des rapports", decouverte: false, enqueteur: '60 jours', stratege: 'Illimité' },
      { name: "Gestion de cas", decouverte: false, enqueteur: '5 cas', stratege: 'Illimité' },
      { name: "Support", decouverte: 'Communautaire', enqueteur: 'Email (48h)', stratege: 'Prioritaire (12h)' },
    ]
  }
];

const currentUserPlan = 'STRATEGE'; // Simule le plan actuel de l'utilisateur
const discount = currentUserPlan === 'STRATEGE' ? 0.30 : (currentUserPlan === 'ENQUETEUR' ? 0.15 : 0);

const PurchaseSection = () => {
  const { data: session } = useSession();
  const [tokenAmount, setTokenAmount] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<{ top: number; height: number } | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const handlePlanChange = async (planId: string) => {
    setIsLoading(true);
    toast.info(`Changement vers le plan ${planId}...`);
    const { error } = await api.createCheckoutSession(planId, session?.accessToken);
    if (error) {
      toast.error('Erreur lors du changement de plan.', { description: error });
    } else {
      toast.success('Abonnement mis à jour avec succès ! (Simulation)');
    }
    setIsLoading(false);
  };

  const handlePurchase = async () => {
    setIsLoading(true);
    toast.info(`Achat de ${tokenAmount} jetons en cours...`);
    const { data, error } = await api.purchaseTokens(tokenAmount, session?.accessToken);
    if (error) {
      toast.error('Erreur lors de l\'achat.', { description: error });
    } else {
      toast.success(`${tokenAmount} jetons ajoutés à votre compte !`, {
        description: `Nouveau solde : ${data?.credits} jetons.`
      });
    }
    setIsLoading(false);
  };

  const { pricePerToken, totalPrice, originalPrice } = useMemo(() => {
    let price;
    if (tokenAmount <= 20) price = 1.00;
    else if (tokenAmount <= 100) price = 0.80;
    else price = 0.60;
    const total = tokenAmount * price;
    const discountedTotal = total * (1 - discount);
    return { pricePerToken: price, totalPrice: discountedTotal, originalPrice: total };
  }, [tokenAmount]);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Choisissez votre plan</CardTitle>
          <CardDescription>Accédez à plus de puissance et de fonctionnalités avec nos plans premium.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={`flex flex-col transition-all hover:shadow-lg hover:-translate-y-1 ${plan.isPopular ? 'border-primary' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <plan.icon size={22} />
                      {plan.name}
                    </CardTitle>
                    {plan.isPopular && <Badge>Le plus populaire</Badge>}
                  </div>
                  <CardDescription>{plan.price} - {plan.tokens}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow"></CardContent>
                <CardFooter>
                  <Button className="w-full" disabled={isLoading || currentUserPlan === plan.id} onClick={() => handlePlanChange(plan.id)}>
                    {currentUserPlan === plan.id ? 'Votre plan actuel' : 'Choisir ce plan'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          <Separator className="my-8" />

          {/* Comparison Table */}
          <div 
            className="space-y-6 relative" 
            ref={tableRef}
            onMouseLeave={() => setHoveredRow(null)}
          >
            {hoveredRow && (
              <motion.div
                className="absolute left-0 right-0 bg-gray-500/10 rounded-lg z-0"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  y: hoveredRow.top,
                  height: hoveredRow.height,
                }}
                transition={{ ease: 'easeInOut', duration: 0.2 }}
              />
            )}
            <div className="grid grid-cols-4 items-center text-sm font-bold py-3 sticky top-0 bg-background z-20">
              <span className="col-span-1">Fonctionnalités</span>
              {plans.map(plan => (
                <span key={plan.id} className="text-center flex items-center justify-center gap-2">
                  <plan.icon size={16} />
                  {plan.name}
                </span>
              ))}
            </div>
            {features.map(category => (
              <div key={category.category} className="relative z-10">
                <h4 className="text-lg font-semibold mb-4">{category.category}</h4>
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {category.items.map(item => {
                    const Icon = 'tool' in item && item.tool ? toolIcons[item.tool] : null;
                    return (
                      <div 
                        key={item.name} 
                        className="grid grid-cols-4 items-center text-sm py-3"
                        onMouseEnter={(e) => {
                          if (tableRef.current) {
                            const row = e.currentTarget;
                            const tableTop = tableRef.current.getBoundingClientRect().top;
                            const rowTop = row.getBoundingClientRect().top;
                            setHoveredRow({ top: rowTop - tableTop, height: row.offsetHeight });
                          }
                        }}
                      >
                        <span className="col-span-1 text-muted-foreground flex items-center gap-2">
                          {Icon && <Icon className="h-4 w-4" />}
                          {item.name}
                        </span>
                        <span className="text-center">
                          {typeof item.decouverte === 'boolean' ? (item.decouverte ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-red-500 mx-auto" />) : item.decouverte}
                        </span>
                        <span className="text-center">
                          {typeof item.enqueteur === 'boolean' ? (item.enqueteur ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-red-500 mx-auto" />) : item.enqueteur}
                        </span>
                        <span className="text-center">
                          {typeof item.stratege === 'boolean' ? (item.stratege ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-red-500 mx-auto" />) : item.stratege}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Achat de jetons à la carte</CardTitle>
            <CardDescription>Rechargez votre compte en jetons à tout moment.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-6 max-w-md mx-auto">
              <div className="flex justify-between items-end mb-2">
                <span className="text-5xl font-bold">{tokenAmount}</span>
                <span className="text-muted-foreground">jetons</span>
              </div>
              <Slider defaultValue={[50]} max={500} step={1} onValueChange={(value) => setTokenAmount(value[0])} disabled={isLoading} />
              <div className="text-xs text-muted-foreground mt-1 flex justify-between"><span>1</span><span>500</span></div>
              <div className="mt-6 space-y-2">
                <div className="flex justify-between"><span>Coût par jeton:</span><span className="font-semibold">{pricePerToken.toFixed(2)}€</span></div>
                {discount > 0 && (<div className="flex justify-between text-green-600"><span>Réduction membre ({discount * 100}%):</span><span className="font-semibold">-{(originalPrice - totalPrice).toFixed(2)}€</span></div>)}
                <Separator />
                <div className="flex justify-between text-xl font-bold">
                  <span>Total:</span>
                  <div>
                    {discount > 0 && <span className="text-base font-normal text-muted-foreground line-through mr-2">{originalPrice.toFixed(2)}€</span>}
                    <span>{totalPrice.toFixed(2)}€</span>
                  </div>
                </div>
              </div>
              <Button className="w-full mt-6" onClick={handlePurchase} disabled={isLoading}>
                <Zap className="mr-2" size={16} />
                Acheter {tokenAmount} jetons
              </Button>
            </div>
          </CardContent>
        </Card>
        <MarketingExplainer />
      </div>
    </div>
  );
};

export default PurchaseSection;
