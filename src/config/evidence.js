const EvidenceType = {
  PROFILE: 'PROFILE',
  EMAIL: 'EMAIL',
  IP_ADDRESS: 'IP_ADDRESS',
  DOMAIN: 'DOMAIN',
  PHONE_NUMBER: 'PHONE_NUMBER',
  BREACH: 'BREACH',
  LOCATION: 'LOCATION',
  COMPANY: 'COMPANY',
  JOB: 'JOB',
  URL_ARCHIVE: 'URL_ARCHIVE',
  VALIDATION: 'VALIDATION',
  SUMMARY: 'SUMMARY',
  NAME: 'NAME',
  URL: 'URL',
  ORGANIZATION: 'ORGANIZATION',
};

const EvidenceCategory = {
  SOCIAL: 'Social',
  PROFESSIONAL: 'Professionnel',
  SECURITY: 'Sécurité',
  GEOLOCATION: 'Géolocalisation',
  TECHNICAL: 'Technique',
  IDENTITY: 'Identité',
  CONTACT: 'Contact',
  WEB_HISTORY: 'Historique Web',
  REPUTATION: 'Réputation',
  NETWORK: 'Réseau',
  EMPLOYMENT: 'Emploi',
  DATA_LEAK: 'Fuite de données',
  GENERAL: 'Général',
};

module.exports = {
  EvidenceType,
  EvidenceCategory,
};