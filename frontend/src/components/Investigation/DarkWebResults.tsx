import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Warning } from '@mui/icons-material';

interface DarkWebResult {
  source: string;
  url: string;
  title: string;
  snippet: string;
  timestamp: string;
}

interface DarkWebResultsProps {
  results: DarkWebResult[];
}

const DarkWebResults: React.FC<DarkWebResultsProps> = ({ results }) => {
  if (!results || results.length === 0) {
    return <p>Aucun résultat trouvé sur le Dark Web.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Résultats du Dark Web</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <Warning className="h-4 w-4" />
          <AlertTitle>Avertissement</AlertTitle>
          <AlertDescription>
            Le contenu du Dark Web peut être illégal, dangereux ou dérangeant. Procédez avec une extrême prudence.
          </AlertDescription>
        </Alert>
        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={index} className="border rounded-lg p-4">
              <h3 className="font-semibold">{result.title}</h3>
              <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 break-all">{result.url}</a>
              <p className="text-sm text-gray-600 mt-2">{result.snippet}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">Source: {result.source}</span>
                <span className="text-xs text-gray-500">{new Date(result.timestamp).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DarkWebResults;