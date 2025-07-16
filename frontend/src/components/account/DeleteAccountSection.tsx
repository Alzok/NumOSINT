'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function DeleteAccountSection() {
  const [isPending, setIsPending] = useState(false);

  const handleDelete = async () => {
    setIsPending(true);
    // TODO: Appeler l'API pour supprimer le compte
    console.log('Suppression du compte...');
    // Simuler un appel API
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsPending(false);
    // TODO: Déconnecter l'utilisateur et le rediriger vers la page d'accueil
  };

  return (
    <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Supprimer le compte</h3>
          <p className="text-sm text-muted-foreground">
            Cette action est irréversible. Toutes vos données seront perdues.
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isPending}>
              Supprimer
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action ne peut pas être annulée. Cela supprimera
                définitivement votre compte et toutes les données associées de nos
                serveurs.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isPending}>
                {isPending ? 'Suppression...' : 'Oui, supprimer mon compte'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}