import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { NotificationsSettings } from "@/components/settings/NotificationsSettings";

const SettingsPage = () => {
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-4">Paramètres</h1>
      <div className="max-w-2xl">
        <Card>
            <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                    Gérez la façon dont vous recevez les notifications.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <NotificationsSettings />
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;