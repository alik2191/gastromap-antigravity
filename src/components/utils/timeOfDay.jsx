/**
 * Get current time of day period
 * Returns: 'утро' | 'день' | 'вечер' | 'поздняя ночь'
 */
export const getTimeOfDay = () => {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 11) return 'утро';
    if (hour >= 11 && hour < 18) return 'день';
    if (hour >= 18 && hour < 21) return 'вечер';
    return 'поздняя ночь';
};

/**
 * Get appropriate image URL based on time of day
 * Falls back to default image_url if time-specific image not available
 */
export const getTimeBasedImage = (region) => {
    if (!region) return null;
    
    const timeOfDay = getTimeOfDay();
    
    // Map time of day to image field
    if (timeOfDay === 'утро' || timeOfDay === 'день') {
        return region.image_url_day || region.image_url || null;
    }
    if (timeOfDay === 'вечер') {
        return region.image_url_evening || region.image_url || null;
    }
    if (timeOfDay === 'поздняя ночь') {
        return region.image_url_night || region.image_url || null;
    }
    
    return region.image_url || null;
};

/**
 * Check if location is suitable for current time of day
 */
export const isSuitableForCurrentTime = (location) => {
    const timeOfDay = getTimeOfDay();
    
    // Check best_time_to_visit array
    if (location.best_time_to_visit?.includes(timeOfDay)) {
        return true;
    }
    
    // Check special_labels for time-relevant features
    const labels = location.special_labels || [];
    
    if (timeOfDay === 'утро') {
        return labels.includes('breakfastMenu') || labels.includes('allDayBreakfast');
    }
    if (timeOfDay === 'день') {
        return labels.includes('lunchMenu') || labels.includes('businessLunch');
    }
    if (timeOfDay === 'вечер' || timeOfDay === 'поздняя ночь') {
        return labels.includes('lateDinner') || location.type === 'bar';
    }
    
    return false;
};

/**
 * Get user-friendly time of day description
 */
export const getTimeOfDayLabel = (lang = 'ru') => {
    const timeOfDay = getTimeOfDay();
    
    const labels = {
        'утро': { ru: 'Утро', en: 'Morning', uk: 'Ранок', es: 'Mañana', emoji: '☀️' },
        'день': { ru: 'День', en: 'Afternoon', uk: 'День', es: 'Tarde', emoji: '🌤️' },
        'вечер': { ru: 'Вечер', en: 'Evening', uk: 'Вечір', es: 'Noche', emoji: '🌆' },
        'поздняя ночь': { ru: 'Поздняя ночь', en: 'Late Night', uk: 'Пізня ніч', es: 'Madrugada', emoji: '🌙' }
    };
    
    return labels[timeOfDay] || labels['день'];
};

/**
 * Determine if dark theme should be used based on time of day
 */
export const shouldUseDarkTheme = () => {
    const hour = new Date().getHours();
    // Dark theme from 18:00 to 6:00
    return hour >= 18 || hour < 6;
};