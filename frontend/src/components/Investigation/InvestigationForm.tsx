'use client';

import { useState } from 'react';
import { Search, Loader2, Plus, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { InvestigationInput } from '@/lib/investigation-api';

interface InvestigationFormProps {
  onSubmit: (input: InvestigationInput) => void;
  isLoading?: boolean;
}

export default function InvestigationForm({ onSubmit, isLoading = false }: InvestigationFormProps) {
  const [input, setInput] = useState<InvestigationInput>({
    names: [],
    emails: [],
    usernames: [],
    phones: [],
    ips: [],
    domains: [],
    urls: []
  });

  const [newValues, setNewValues] = useState<InvestigationInput>({
    names: '',
    emails: '',
    usernames: '',
    phones: '',
    ips: '',
    domains: '',
    urls: ''
  });

  const addValue = (type: keyof InvestigationInput, value: string) => {
    if (value.trim()) {
      setInput(prev => ({
        ...prev,
        [type]: [...(prev[type] as string[]), value.trim()]
      }));
      setNewValues(prev => ({
        ...prev,
        [type]: ''
      }));
    }
  };

  const removeValue = (type: keyof InvestigationInput, index: number) => {
    setInput(prev => ({
      ...prev,
      [type]: (prev[type] as string[]).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérifier qu'au moins un indicateur est fourni
    const hasIndicators = Object.values(input).some(values => 
      Array.isArray(values) && values.length > 0
    );

    if (!hasIndicators) {
      alert('Veuillez fournir au moins un indicateur (nom, email, username, téléphone, etc.)');
      return;
    }

    onSubmit(input);
  };

  const renderIndicatorSection = (
    type: keyof InvestigationInput,
    label: string,
    placeholder: string
  ) => {
    const values = input[type] as string[];
    const newValue = newValues[type] as string;

    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          {label}
          {values.length > 0 && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200">
              {values.length}
            </span>
          )}
        </label>
        
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={placeholder}
            value={newValue}
            onChange={(e) => setNewValues(prev => ({ ...prev, [type]: e.target.value }))}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addValue(type, newValue);
              }
            }}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => addValue(type, newValue)}
            disabled={!newValue.trim() || isLoading}
            className="px-3 py-2 text-gray-600 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {values.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {values.map((value, index) => (
              <span key={index} className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-full dark:bg-gray-700 dark:text-gray-200">
                {value}
                <button
                  type="button"
                  onClick={() => removeValue(type, index)}
                  disabled={isLoading}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const inputClasses = "w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
            <Search className="h-6 w-6" />
            Nouvelle Investigation
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Créez une nouvelle investigation avec plusieurs types d'indicateurs.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Noms */}
            {renderIndicatorSection(
              'names',
              'Noms',
              'Prénom Nom ou Nom complet'
            )}

            {/* Emails */}
            {renderIndicatorSection(
              'emails',
              'Emails',
              'email@exemple.com'
            )}

            {/* Usernames */}
            {renderIndicatorSection(
              'usernames',
              'Noms d\'utilisateur',
              'username'
            )}

            {/* Téléphones */}
            {renderIndicatorSection(
              'phones',
              'Numéros de téléphone',
              '+33 6 12 34 56 78'
            )}

            {/* IPs */}
            {renderIndicatorSection(
              'ips',
              'Adresses IP',
              '192.168.1.1'
            )}

            {/* Domaines */}
            {renderIndicatorSection(
              'domains',
              'Domaines',
              'exemple.com'
            )}
          </div>

          {/* URLs */}
          {renderIndicatorSection(
            'urls',
            'URLs',
            'https://exemple.com/page'
          )}

          {/* Résumé */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-gray-900 dark:text-white">Résumé des indicateurs</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              {Object.entries(input).map(([type, values]) => (
                <div key={type} className="flex justify-between">
                  <span className="capitalize text-gray-600 dark:text-gray-400">{type}:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {Array.isArray(values) ? values.length : 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bouton de soumission */}
          <button
            type="submit"
            disabled={isLoading || Object.values(input).every(values => 
              Array.isArray(values) && values.length === 0
            )}
            className="w-full flex items-center justify-center px-4 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 dark:disabled:bg-blue-800"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Création de l'investigation...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Créer l'investigation
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
}