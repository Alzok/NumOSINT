#!/bin/bash

echo "🔄 Migration des résultats vers reports/"
echo "======================================="

# Créer le dossier reports s'il n'existe pas
mkdir -p reports

# Compteur pour les migrations
migrated_count=0

# Trouver tous les dossiers contenant des fichiers holehe CSV (mais pas reports/ lui-même)
for dir in */; do
    # Exclure certains dossiers
    if [[ "$dir" == "reports/" || "$dir" == "results/" || "$dir" == "logs/" || "$dir" == "frontend/" || "$dir" == ".git/" ]]; then
        continue
    fi
    
    # Vérifier si le dossier contient des fichiers holehe
    if ls "${dir}"holehe_*@*.csv 2>/dev/null | head -1 >/dev/null; then
        echo "📁 Trouvé des résultats dans: $dir"
        
        # Vérifier si le dossier existe déjà dans reports/
        dirname="${dir%/}"  # Enlever le slash final
        if [[ -d "reports/$dirname" ]]; then
            echo "⚠️  Le dossier reports/$dirname existe déjà"
            echo "   Voulez-vous le remplacer ? (y/N)"
            read -r response
            if [[ "$response" != "y" && "$response" != "Y" ]]; then
                echo "   ⏭️  Ignoré: $dirname"
                continue
            fi
            rm -rf "reports/$dirname"
        fi
        
        # Migrer le dossier
        mv "$dir" "reports/"
        echo "✅ Migré: $dirname -> reports/$dirname"
        ((migrated_count++))
    fi
done

# Résumé
echo ""
echo "📊 Résumé de la migration:"
echo "   📁 Dossiers migrés: $migrated_count"

if [[ $migrated_count -gt 0 ]]; then
    echo ""
    echo "📋 Structure actuelle de reports/:"
    ls -la reports/ | grep ^d | awk '{print "   📂 " $9}'
    
    echo ""
    echo "🔄 Mise à jour du fichier data.json..."
    python3 parse_csv.py > /dev/null 2>&1
    echo "✅ Fichier data.json mis à jour"
else
    echo "   ℹ️  Aucun nouveau résultat à migrer"
fi

echo ""
echo "🎉 Migration terminée !"
echo "   Les nouveaux résultats iront automatiquement dans reports/Prénom-Nom/" 