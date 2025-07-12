import {
  Email,
  Person,
  Phone as PhoneIcon,
  Language,
  VpnKey,
  Link,
  LocationOn,
  Apartment,
  Security,
  HelpOutline
} from '@mui/icons-material';

// Définir un type plus strict pour les types d'items
export type ItemType = 'PROFILE' | 'EMAIL' | 'PHONE' | 'IP' | 'URL' | 'LOCATION' | 'ORGANIZATION' | 'BREACH' | 'DOMAIN';

// Mapping des types d'items aux icônes
export const getItemIcon = (type: ItemType | string) => {
  switch (type) {
    case 'PROFILE':
      return <Person className="h-5 w-5" />;
    case 'EMAIL':
      return <Email className="h-5 w-5" />;
    case 'PHONE':
      return <PhoneIcon className="h-5 w-5" />;
    case 'IP':
      return <VpnKey className="h-5 w-5" />;
    case 'URL':
      return <Link className="h-5 w-5" />;
    case 'LOCATION':
      return <LocationOn className="h-5 w-5" />;
    case 'ORGANIZATION':
      return <Apartment className="h-5 w-5" />;
    case 'BREACH':
      return <Security className="h-5 w-5 text-red-500" />;
    case 'DOMAIN':
        return <Language className="h-5 w-5" />;
    default:
      return <HelpOutline className="h-5 w-5 text-gray-500" />;
  }
};