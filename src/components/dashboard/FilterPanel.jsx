import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from '../LanguageContext';
import { specialLabels } from '../constants';



export default function FilterPanel({ 
    isOpen, 
    onClose, 
    filterType,
    setFilterType,
    filterPriceRange,
    setFilterPriceRange,
    filterRating,
    setFilterRating,
    filterLabels,
    setFilterLabels,
    activeFiltersCount,
    resetFilters,
    filteredLocationsCount
}) {
    const { t } = useLanguage();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={onClose}>
            <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-white dark:bg-neutral-800 rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700 shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{t('filters') || 'Фильтры'}</h3>
                        {activeFiltersCount > 0 && (
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                                {activeFiltersCount} {t(activeFiltersCount === 1 ? 'activeFilter' : 'activeFilters')}
                            </p>
                        )}
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                    >
                        <X className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Type Filter */}
                    <div>
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3 block">{t('type') || 'Тип заведения'}</label>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-full h-12 rounded-xl bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('allTypes') || 'Все типы'}</SelectItem>
                                <SelectItem value="cafe">☕ Кафе</SelectItem>
                                <SelectItem value="bar">🍸 Бар</SelectItem>
                                <SelectItem value="restaurant">🍽️ Ресторан</SelectItem>
                                <SelectItem value="market">🛒 Рынок</SelectItem>
                                <SelectItem value="shop">🏪 Магазин</SelectItem>
                                <SelectItem value="bakery">🥐 Пекарня</SelectItem>
                                <SelectItem value="winery">🍷 Винодельня</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Price Filter */}
                    <div>
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3 block">{t('price') || 'Цена'}</label>
                        <div className="grid grid-cols-5 gap-2">
                            {['all', '$', '$$', '$$$', '$$$$'].map(price => (
                                <button
                                    key={price}
                                    onClick={() => setFilterPriceRange(price)}
                                    className={`h-12 rounded-xl font-semibold transition-all ${
                                        filterPriceRange === price 
                                            ? 'bg-blue-600 text-white shadow-lg' 
                                            : 'bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                                    }`}
                                >
                                    {price === 'all' ? t('all') || 'Все' : price}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rating Filter */}
                    <div>
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3 block">{t('rating') || 'Минимальный рейтинг'}</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: 0, label: t('any') || 'Любой' },
                                { value: 4, label: '⭐ 4+' },
                                { value: 4.5, label: '⭐ 4.5+' }
                            ].map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => setFilterRating(option.value)}
                                    className={`h-12 rounded-xl font-semibold transition-all ${
                                        filterRating === option.value 
                                            ? 'bg-blue-600 text-white shadow-lg' 
                                            : 'bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Special Labels Filter */}
                                              <div>
                                                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3 block">{t('specialFeatures') || 'Особенности'}</label>
                                                  {(() => {
                                                      const groups = specialLabels.reduce((acc, l) => {
                                                          const key = l.category || 'Other';
                                                          (acc[key] ||= []).push(l);
                                                          return acc;
                                                      }, {});
                                                      return (
                                                          <div className="space-y-4">
                                                              {Object.entries(groups).map(([category, labels]) => (
                                                                  <div key={category}>
                                                                      <div className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold uppercase tracking-wide">{category}</div>
                                                                      <div className="flex flex-wrap gap-2 mt-2">
                                                                          {labels.map(label => (
                                                                              <button
                                                                                  key={label.id}
                                                                                  onClick={() => {
                                                                                      if (filterLabels.includes(label.id)) {
                                                                                          setFilterLabels(filterLabels.filter(l => l !== label.id));
                                                                                      } else {
                                                                                          setFilterLabels([...filterLabels, label.id]);
                                                                                      }
                                                                                  }}
                                                                                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                                                                      filterLabels.includes(label.id)
                                                                                          ? 'bg-blue-600 text-white shadow-lg'
                                                                                          : 'bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 border-0 dark:border dark:border-neutral-700 shadow-sm'
                                                                                  }`}
                                                                              >
                                                                                  <span className="mr-1.5">{label.emoji}</span>
                                                                                  {t(label.id) || label.label}
                                                                              </button>
                                                                          ))}
                                                                      </div>
                                                                  </div>
                                                              ))}
                                                          </div>
                                                      );
                                                  })()}
                                              </div>
                </div>

                {/* Footer Actions */}
                <div className="flex gap-3 p-6 pt-4 border-t border-neutral-200 dark:border-neutral-700 shrink-0 bg-white dark:bg-neutral-800">
                    {activeFiltersCount > 0 && (
                        <Button 
                            variant="outline" 
                            onClick={resetFilters}
                            className="flex-1 h-12 rounded-xl font-medium dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-700"
                        >
                            {t('resetAll')}
                        </Button>
                    )}
                    <Button 
                        onClick={onClose}
                        className={`h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium ${activeFiltersCount > 0 ? 'flex-1' : 'w-full'}`}
                    >
                        {t('showPlaces')} {filteredLocationsCount || 0} {t('places')}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}