import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

interface WaybackResult {
  url: string;
}

interface WaybackResultsProps {
  results?: WaybackResult[];
}

const WaybackResults = ({ results }: WaybackResultsProps) => {
  // Données factices pour le développement
  const dummyResults: WaybackResult[] = [
    { url: "http://web.archive.org/web/20230101000000/https://example.com" },
    { url: "http://web.archive.org/web/20230201000000/https://example.com" },
    { url: "http://web.archive.org/web/20230301000000/https://example.com" },
  ];

  const displayResults = results && results.length > 0 ? results : dummyResults;

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Archives du Site (Wayback Machine)</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>URL Archivée</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayResults.map((result, index) => (
            <TableRow key={index}>
              <TableCell>
                <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  {result.url}
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default WaybackResults;