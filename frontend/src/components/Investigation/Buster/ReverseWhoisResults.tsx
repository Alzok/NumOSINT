import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReverseWhoisResultsProps {
  domains: string[];
}

export const ReverseWhoisResults: React.FC<ReverseWhoisResultsProps> = ({ domains }) => {
  if (!domains || domains.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reverse Whois Results</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No domains found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reverse Whois Results</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Registered Domain</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {domains.map((domain, index) => (
              <TableRow key={index}>
                <TableCell>{domain}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};