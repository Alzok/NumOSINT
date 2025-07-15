import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Public, LocationCity, Business } from '@mui/icons-material';

interface IpAnalysisData {
  ip: string;
  asn: string;
  org: string;
  country: string;
  city: string;
  is_proxy: boolean;
  is_hosting: boolean;
}

interface IpAnalysisViewProps {
  data: IpAnalysisData[];
}

const IpAnalysisView: React.FC<IpAnalysisViewProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p>Aucune analyse d&apos;IP disponible.</p>;
  }

  return (
    <div className="space-y-4">
      {data.map((analysis, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Public />
              <span>{analysis.ip}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold">ASN</p>
              <p>{analysis.asn}</p>
            </div>
            <div>
              <p className="font-semibold">Organisation</p>
              <p>{analysis.org}</p>
            </div>
            <div>
              <p className="font-semibold">Localisation</p>
              <p>{analysis.city}, {analysis.country}</p>
            </div>
            <div className="flex items-center space-x-2">
              {analysis.is_proxy && <Badge variant="destructive">Proxy</Badge>}
              {analysis.is_hosting && <Badge variant="destructive">Hébergement</Badge>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default IpAnalysisView;