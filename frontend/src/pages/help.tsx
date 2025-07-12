import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const HelpPage = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Aide NumOSINT</h1>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Qu'est-ce qu'une investigation ?</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Une investigation dans NumOSINT est un processus de collecte et d'analyse
              d'informations à partir de sources ouvertes (OSINT) sur une cible spécifique,
              comme une adresse e-mail, un numéro de téléphone ou un nom d'utilisateur.
              Chaque investigation regroupe les données trouvées par nos différents outils
              pour vous donner une vue d'ensemble.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comment utiliser le formulaire de recherche ?</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Le formulaire de recherche sur la page d'accueil est le point de départ de
              toute investigation.
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                <strong>Valeur :</strong> Entrez ici l'identifiant que vous souhaitez
                investiguer (ex: un email, un téléphone, un pseudo).
              </li>
              <li>
                <strong>Type :</strong> Sélectionnez le type de donnée correspondant à votre
                valeur. Cela aide nos outils à mieux cibler la recherche.
              </li>
              <li>
                <strong>Options avancées :</strong> Vous pouvez sélectionner
                spécifiquement les outils à utiliser pour des recherches plus rapides ou
                plus discrètes.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comment interpréter le tableau de résultats et le graphe ?</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Une fois une investigation terminée, vous accédez à deux vues principales :
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                <strong>Tableau de résultats :</strong> Il s'agit d'une liste unifiée de
                toutes les informations trouvées, triées par catégorie (comptes en
                ligne, fuites de données, etc.). Vous pouvez filtrer et trier ces
                données pour affiner votre analyse.
              </li>
              <li>
                <strong>Graphe de corrélation :</strong> Le graphe visualise les liens
                entre les différentes informations. Par exemple, il peut montrer comment
                une adresse e-mail est liée à plusieurs comptes sur les réseaux sociaux.
                C'est un outil puissant pour découvrir des connexions cachées.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comment exporter des rapports ?</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Sur la page de résultats d'une investigation, vous trouverez un bouton
              d'export. Cette fonctionnalité vous permet de générer un rapport
              complet de l'investigation en format PDF ou JSON. C'est utile pour
              archiver vos découvertes ou les partager avec d'autres personnes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HelpPage;