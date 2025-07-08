'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSearch } from '@/hooks/useSearch';
import { SearchRequest } from '@/types';

export default function SearchForm() {
  const [formData, setFormData] = useState<SearchRequest>({
    first_name: '',
    last_name: '',
    domain_filter: '',
  });
  const [errors, setErrors] = useState<Partial<SearchRequest>>({});
  
  const { startSearch, isLoading } = useSearch();

  const validateForm = (): boolean => {
    const newErrors: Partial<SearchRequest> = {};
    if (!formData.first_name.trim()) newErrors.first_name = 'Le prénom est requis';
    if (!formData.last_name.trim()) newErrors.last_name = 'Le nom est requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const taskId = await startSearch(formData);
    if (taskId) {
      setFormData({ first_name: '', last_name: '', domain_filter: '' });
      setErrors({});
    }
    // Si taskId est null (échec), les champs ne sont pas réinitialisés.
  };

  const handleInputChange = (field: keyof SearchRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const inputClasses = "w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const errorInputClasses = "border-red-500 dark:border-red-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Recherche OSINT
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Trouvez des comptes en utilisant un nom et prénom.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="first_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Prénom *
              </label>
              <input
                type="text"
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                placeholder="John"
                disabled={isLoading}
                className={`${inputClasses} ${errors.first_name ? errorInputClasses : ''}`}
              />
              {errors.first_name && <p className="text-sm text-red-600">{errors.first_name}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="last_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nom *
              </label>
              <input
                type="text"
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                placeholder="Doe"
                disabled={isLoading}
                className={`${inputClasses} ${errors.last_name ? errorInputClasses : ''}`}
              />
              {errors.last_name && <p className="text-sm text-red-600">{errors.last_name}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="domain_filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filtrer par domaine (optionnel)
            </label>
            <input
              type="text"
              id="domain_filter"
              value={formData.domain_filter}
              onChange={(e) => handleInputChange('domain_filter', e.target.value)}
              placeholder="gmail.com, outlook.com..."
              disabled={isLoading}
              className={inputClasses}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Laissez vide pour rechercher sur tous les domaines.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 dark:disabled:bg-blue-800"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Recherche en cours...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Lancer la recherche
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
}