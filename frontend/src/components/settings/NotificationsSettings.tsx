'use client';

import { useState } from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function NotificationsSettings() {
  const [inAppNotifications, setInAppNotifications] = useState(true);

  // TODO: Récupérer et mettre à jour cette valeur depuis une source de données (contexte, API, etc.)

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="in-app-notifications"
        checked={inAppNotifications}
        onCheckedChange={setInAppNotifications}
      />
      <Label htmlFor="in-app-notifications">
        Activer les notifications dans l'application
      </Label>
    </div>
  );
}