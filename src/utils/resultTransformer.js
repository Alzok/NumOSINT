const { IndicatorType } = require('@prisma/client');

/**
 * Standardise les données brutes des résultats des outils en une liste d' "Items de Preuve".
 */
class ResultTransformer {
  /**
   * @param {Array<object>} results - La liste des résultats bruts de Prisma.
   * @returns {Array<object>} Une liste d'items de preuve standardisés.
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
          return [];
      }
    });

    // Déduplication simple pour éviter les doublons évidents
    const uniqueItems = Array.from(new Map(allItems.map(item => [`${item.type}:${item.value}`, item])).values());
    return uniqueItems;
  }

  static createItem(type, value, category, sourceTool, details = {}, link = null) {
    if (!value) return null;
    return { type, value, category, sourceTool, details, link };
  }

  static transformBuster(result) {
    const items = [];
    // Pour les résultats de reverse_whois
    if (result.data?.reverse_whois) {
      result.data.reverse_whois.forEach(domain => {
        items.push(this.createItem('DOMAIN', domain, 'Domaine enregistré', result.toolSource));
      });
    }
    // On pourrait ajouter d'autres transformations pour Buster ici si nécessaire
    return items.filter(Boolean);
  }

  static transformMaigret(result) {
    const profiles = result.data?.profiles || [];
    return profiles.map(p => this.createItem(
      'PROFILE',
      p.url,
      p.category || 'Social',
      result.toolSource,
      { username: p.username, siteName: p.sitename },
      p.url
    )).filter(Boolean);
  }

  static transformMosint(result) {
    const items = [];
    if (result.data?.breaches) {
      result.data.breaches.forEach(b => {
        items.push(this.createItem('BREACH', b.name, 'Fuite de données', result.toolSource, b));
      });
    }
    if (result.data?.ip_info) {
        items.push(this.createItem('IP', result.data.ip_info.ip, 'Réseau', result.toolSource, result.data.ip_info));
    }
    if (result.data?.social_media) {
        result.data.social_media.forEach(p => {
            items.push(this.createItem('PROFILE', p.url, 'Social', result.toolSource, { username: p.username, siteName: p.site }, p.url));
        });
    }
    if (result.data?.related_emails) {
        result.data.related_emails.forEach(email => {
            items.push(this.createItem('EMAIL', email, 'Email relié', result.toolSource));
        });
    }
    return items.filter(Boolean);
  }

  static transformPhoneInfoga(result) {
    const items = [];
    const analysis = result.data?.analysis;
    if (!analysis) return items;

    if (analysis.countryName) {
      items.push(this.createItem('LOCATION', analysis.countryName, 'Géolocalisation', result.toolSource, { code: analysis.countryCode }));
    }
    if (analysis.carrier) {
        items.push(this.createItem('ORGANIZATION', analysis.carrier, 'Télécom', result.toolSource, { lineType: analysis.lineType }));
    }
    return items.filter(Boolean);
  }

  static transformWaybulk(result) {
    const snapshots = result.data?.archived_snapshots?.closest;
    if (!snapshots || !snapshots.url) return [];
    
    return [this.createItem(
      'URL',
      snapshots.url,
      'Archive Web',
      result.toolSource,
      { timestamp: snapshots.timestamp },
      snapshots.url
    )].filter(Boolean);
  }

  static transformAsn(result) {
    const items = [];
    if (result.data?.asn) {
        items.push(this.createItem('ORGANIZATION', result.data.asn, 'Réseau', result.toolSource, result.data));
    }
    if (result.data?.country) {
        items.push(this.createItem('LOCATION', result.data.country, 'Géolocalisation', result.toolSource, result.data));
    }
    return items.filter(Boolean);
  }

  static transformWau(result) {
    const data = result.data;
    if (!data) return [];
    
    const category = data.is_valid ? 'Email Valide' : 'Email Invalide';
    const details = { reason: data.reason, is_disposable: data.is_disposable };
    
    return [this.createItem('VALIDATION', result.indicatorValue, category, result.toolSource, details)].filter(Boolean);
  }

  static transformPdl(result) {
    const items = [];
    const data = result.data;
    if (!data) return [];

    if (data.full_name) {
      items.push(this.createItem('NAME', data.full_name, 'Identité', result.toolSource));
    }
    if (data.location_name) {
      items.push(this.createItem('LOCATION', data.location_name, 'Géolocalisation', result.toolSource));
    }
    if (data.job_title) {
      items.push(this.createItem('JOB', `${data.job_title} @ ${data.job_company_name}`, 'Emploi', result.toolSource));
    }
    if (data.work_email) {
        items.push(this.createItem('EMAIL', data.work_email, 'Email Professionnel', result.toolSource));
    }
    if (data.profiles) {
        data.profiles.forEach(p => {
            items.push(this.createItem('PROFILE', p.url, p.network, result.toolSource, { username: p.username }, p.url));
        });
    }
    return items.filter(Boolean);
  }

  static transformSpiderfoot(result) {
    const data = result.data;
    if (!data || !data.summary) return [];

    const summaryText = `Scan terminé avec ${data.totalItems} éléments trouvés.`;
    return [this.createItem('SUMMARY', summaryText, 'Résumé de Scan', result.toolSource, data)].filter(Boolean);
  }
}

module.exports = ResultTransformer;