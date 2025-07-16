const { IndicatorType } = require('@prisma/client');
const { EvidenceType, EvidenceCategory } = require('../config/evidence');
const logger = require('./logger');

/**
 * Standardise les données brutes des résultats des outils en une liste d' "Items de Preuve".
 * Chaque méthode de transformation est responsable de la conversion des données d'un outil spécifique.
 */
class ResultTransformer {
  /**
   * Transforme une liste de résultats bruts de la base de données en une liste unifiée d'items de preuve.
   * @param {Array<object>} results - La liste des résultats bruts de Prisma, contenant les données et la source de l'outil.
   * @returns {Array<object>} Une liste d'items de preuve standardisés et dédupliqués.
   */
  static transform(results) {
    if (!results || results.length === 0) {
      return [];
    }

    const allItems = results.flatMap(result => {
      switch (result.toolSource.toLowerCase()) {
        case 'maigret':
          return this.transformMaigret(result);
        case 'buster':
          return this.transformBuster(result);
        case 'mosint':
          return this.transformMosint(result);
        case 'phoneinfoga':
          return this.transformPhoneInfoga(result);
        case 'waybulk':
          return this.transformWaybulk(result);
        case 'asn':
          return this.transformAsn(result);
        case 'wau':
          return this.transformWau(result);
        case 'pdl':
          return this.transformPdl(result);
        case 'spiderfoot':
            return this.transformSpiderfoot(result);
        default:
          logger.warn(`Aucun transformateur n'a été trouvé pour l'outil : ${result.toolSource}`, { tool: result.toolSource });
          return [];
      }
    });

    // Déduplication basée sur une clé composite type-valeur pour éviter les doublons.
    const uniqueItems = Array.from(new Map(allItems.map(item => [`${item.type}:${item.value}`, item])).values());
    return uniqueItems;
  }

  /**
   * Crée un item de preuve standardisé.
   * @param {EvidenceType} type - Le type de preuve (ex: EMAIL, PROFILE).
   * @param {string} value - La valeur de la preuve.
   * @param {EvidenceCategory} category - La catégorie de la preuve (ex: SOCIAL, TECHNICAL).
   * @param {string} sourceTool - L'outil qui a généré cette preuve.
   * @param {object} [details={}] - Un objet contenant des informations supplémentaires.
   * @param {string|null} [link=null] - Un lien direct vers la preuve, si applicable.
   * @returns {object|null} L'objet de preuve créé, ou null si la valeur est vide.
   */
  static createItem(type, value, category, sourceTool, details = {}, link = null) {
    if (!value) return null;
    return { type, value, category, sourceTool, details, link };
  }

  /**
   * Transforme les résultats de l'outil Buster (Reverse Whois).
   * @param {object} result - Le résultat brut de Buster.
   * @returns {Array<object>} Une liste d'items de preuve de type DOMAIN.
   */
  static transformBuster(result) {
    const items = [];
    // Extrait les domaines trouvés par la recherche "reverse whois".
    if (result.data?.reverse_whois) {
      result.data.reverse_whois.forEach(domain => {
        items.push(this.createItem(EvidenceType.DOMAIN, domain, EvidenceCategory.TECHNICAL, result.toolSource));
      });
    }
    return items.filter(Boolean);
  }

  /**
   * Transforme les résultats de l'outil Maigret (recherche de profils sociaux).
   * @param {object} result - Le résultat brut de Maigret.
   * @returns {Array<object>} Une liste d'items de preuve de type PROFILE.
   */
  static transformMaigret(result) {
    const profiles = result.data?.profiles || [];
    // Mappe chaque profil trouvé à un item de preuve.
    return profiles.map(p => this.createItem(
      EvidenceType.PROFILE,
      p.url,
      p.category || EvidenceCategory.SOCIAL, // Utilise la catégorie fournie, sinon SOCIAL par défaut.
      result.toolSource,
      { username: p.username, siteName: p.sitename },
      p.url
    )).filter(Boolean);
  }

  /**
   * Transforme les résultats de l'outil MOSINT (renseignement sur les emails).
   * @param {object} result - Le résultat brut de MOSINT.
   * @returns {Array<object>} Une liste variée d'items de preuve (fuites, IP, profils, etc.).
   */
  static transformMosint(result) {
    const items = [];
    // Fuites de données (breaches)
    if (result.data?.breaches) {
      result.data.breaches.forEach(b => {
        items.push(this.createItem(EvidenceType.BREACH, b.name, EvidenceCategory.DATA_LEAK, result.toolSource, b));
      });
    }
    // Informations IP
    if (result.data?.ip_info) {
        const ipInfo = result.data.ip_info;
        items.push(this.createItem(EvidenceType.IP_ADDRESS, ipInfo.ip, EvidenceCategory.NETWORK, result.toolSource, ipInfo));
        if (ipInfo.city && ipInfo.country) {
            items.push(this.createItem(EvidenceType.LOCATION, `${ipInfo.city}, ${ipInfo.country}`, EvidenceCategory.GEOLOCATION, result.toolSource, { countryCode: ipInfo.country_code }));
        }
        if (ipInfo.org) {
            items.push(this.createItem(EvidenceType.ORGANIZATION, ipInfo.org, EvidenceCategory.NETWORK, result.toolSource, { type: 'ISP' }));
        }
    }
    // Profils sur les réseaux sociaux
    if (result.data?.social_media) {
        result.data.social_media.forEach(p => {
            items.push(this.createItem(EvidenceType.PROFILE, p.url, EvidenceCategory.SOCIAL, result.toolSource, { username: p.username, siteName: p.site }, p.url));
        });
    }
    // Emails associés
    if (result.data?.related_emails) {
        result.data.related_emails.forEach(email => {
            items.push(this.createItem(EvidenceType.EMAIL, email, EvidenceCategory.CONTACT, result.toolSource));
        });
    }
    return items.filter(Boolean);
  }

  /**
   * Transforme les résultats de PhoneInfoga (renseignement sur les numéros de téléphone).
   * @param {object} result - Le résultat brut de PhoneInfoga.
   * @returns {Array<object>} Une liste d'items de preuve (localisation, opérateur).
   */
  static transformPhoneInfoga(result) {
    const items = [];
    const analysis = result.data?.analysis;
    if (!analysis) return items;

    // Pays d'origine du numéro
    if (analysis.countryName) {
      items.push(this.createItem(EvidenceType.LOCATION, analysis.countryName, EvidenceCategory.GEOLOCATION, result.toolSource, { code: analysis.countryCode }));
    }
    // Opérateur téléphonique
    if (analysis.carrier) {
        items.push(this.createItem(EvidenceType.ORGANIZATION, analysis.carrier, EvidenceCategory.TECHNICAL, result.toolSource, { lineType: analysis.lineType }));
    }
    return items.filter(Boolean);
  }

  /**
   * Transforme les résultats de Waybulk (archives du web).
   * @param {object} result - Le résultat brut de Waybulk.
   * @returns {Array<object>} Un item de preuve de type URL_ARCHIVE.
   */
  static transformWaybulk(result) {
    const snapshots = result.data?.archived_snapshots?.closest;
    if (!snapshots || !snapshots.url) return [];
    
    // Crée un item pour l'archive la plus proche trouvée.
    return [this.createItem(
      EvidenceType.URL_ARCHIVE,
      snapshots.url,
      EvidenceCategory.WEB_HISTORY,
      result.toolSource,
      { timestamp: snapshots.timestamp },
      snapshots.url
    )].filter(Boolean);
  }

  /**
   * Transforme les résultats de l'outil ASN (informations sur les systèmes autonomes).
   * @param {object} result - Le résultat brut de l'outil ASN.
   * @returns {Array<object>} Une liste d'items de preuve (organisation, localisation).
   */
  static transformAsn(result) {
    const items = [];
    if (result.data?.asn) {
        items.push(this.createItem(EvidenceType.ORGANIZATION, result.data.asn, EvidenceCategory.NETWORK, result.toolSource, result.data));
    }
    if (result.data?.country) {
        items.push(this.createItem(EvidenceType.LOCATION, result.data.country, EvidenceCategory.GEOLOCATION, result.toolSource, result.data));
    }
    return items.filter(Boolean);
  }

  /**
   * Transforme les résultats de WAU (vérification d'email).
   * @param {object} result - Le résultat brut de WAU.
   * @returns {Array<object>} Un item de preuve de type VALIDATION.
   */
  static transformWau(result) {
    const data = result.data;
    if (!data) return [];
    
    const category = data.is_valid ? EvidenceCategory.REPUTATION : EvidenceCategory.REPUTATION;
    const details = { reason: data.reason, is_disposable: data.is_disposable, isValid: data.is_valid };
    
    return [this.createItem(EvidenceType.VALIDATION, result.indicatorValue, category, result.toolSource, details)].filter(Boolean);
  }

  /**
   * Transforme les résultats de PDL (enrichissement de données).
   * @param {object} result - Le résultat brut de PDL.
   * @returns {Array<object>} Une liste variée d'items de preuve (nom, emploi, profils, etc.).
   */
  static transformPdl(result) {
    const items = [];
    const data = result.data;
    if (!data) return [];

    if (data.full_name) {
      items.push(this.createItem(EvidenceType.NAME, data.full_name, EvidenceCategory.IDENTITY, result.toolSource));
    }
    if (data.location_name) {
      items.push(this.createItem(EvidenceType.LOCATION, data.location_name, EvidenceCategory.GEOLOCATION, result.toolSource));
    }
    if (data.job_title) {
      items.push(this.createItem(EvidenceType.JOB, `${data.job_title} @ ${data.job_company_name}`, EvidenceCategory.EMPLOYMENT, result.toolSource));
    }
    if (data.work_email) {
        items.push(this.createItem(EvidenceType.EMAIL, data.work_email, EvidenceCategory.PROFESSIONAL, result.toolSource));
    }
    if (data.profiles) {
        data.profiles.forEach(p => {
            items.push(this.createItem(EvidenceType.PROFILE, p.url, p.network || EvidenceCategory.SOCIAL, result.toolSource, { username: p.username }, p.url));
        });
    }
    return items.filter(Boolean);
  }

  /**
   * Transforme les résultats de Spiderfoot en un résumé.
   * @param {object} result - Le résultat brut de Spiderfoot.
   * @returns {Array<object>} Un item de preuve de type SUMMARY.
   */
  static transformSpiderfoot(result) {
    const data = result.data;
    if (!data || !data.summary) return [];

    const summaryText = `Scan terminé avec ${data.totalItems} éléments trouvés.`;
    return [this.createItem(EvidenceType.SUMMARY, summaryText, EvidenceCategory.GENERAL, result.toolSource, data)].filter(Boolean);
  }
}

module.exports = ResultTransformer;