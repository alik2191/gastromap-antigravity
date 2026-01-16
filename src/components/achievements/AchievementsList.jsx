import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { Trophy, MapPin, Star, Globe, Camera, Award, Lock } from "lucide-react";
import { useLanguage } from '../LanguageContext';

const achievements = [
    {
        id: 'first_visit',
        icon: MapPin,
        title: { ru: 'Первый шаг', en: 'First Step', uk: 'Перший крок', es: 'Primer paso' },
        description: { ru: 'Посетите первое место', en: 'Visit your first place', uk: 'Відвідайте перше місце', es: 'Visita tu primer lugar' },
        requirement: (stats) => stats.visitedCount >= 1,
        color: 'from-green-400 to-emerald-500'
    },
    {
        id: 'explorer_5',
        icon: MapPin,
        title: { ru: 'Исследователь', en: 'Explorer', uk: 'Дослідник', es: 'Explorador' },
        description: { ru: 'Посетите 5 мест', en: 'Visit 5 places', uk: 'Відвідайте 5 місць', es: 'Visita 5 lugares' },
        requirement: (stats) => stats.visitedCount >= 5,
        color: 'from-blue-400 to-cyan-500'
    },
    {
        id: 'explorer_10',
        icon: Trophy,
        title: { ru: 'Путешественник', en: 'Traveler', uk: 'Мандрівник', es: 'Viajero' },
        description: { ru: 'Посетите 10 мест', en: 'Visit 10 places', uk: 'Відвідайте 10 місць', es: 'Visita 10 lugares' },
        requirement: (stats) => stats.visitedCount >= 10,
        color: 'from-purple-400 to-pink-500'
    },
    {
        id: 'explorer_25',
        icon: Award,
        title: { ru: 'Гуру', en: 'Guru', uk: 'Гуру', es: 'Gurú' },
        description: { ru: 'Посетите 25 мест', en: 'Visit 25 places', uk: 'Відвідайте 25 місць', es: 'Visita 25 lugares' },
        requirement: (stats) => stats.visitedCount >= 25,
        color: 'from-amber-400 to-orange-500'
    },
    {
        id: 'wishlist_lover',
        icon: Star,
        title: { ru: 'Мечтатель', en: 'Dreamer', uk: 'Мрійник', es: 'Soñador' },
        description: { ru: 'Добавьте 10 мест в wish-list', en: 'Add 10 places to wish-list', uk: 'Додайте 10 місць у wish-list', es: 'Añade 10 lugares a la lista de deseos' },
        requirement: (stats) => stats.wishlistCount >= 10,
        color: 'from-rose-400 to-pink-500'
    },
    {
        id: 'city_explorer',
        icon: Globe,
        title: { ru: 'Городской исследователь', en: 'City Explorer', uk: 'Міський дослідник', es: 'Explorador urbano' },
        description: { ru: 'Посетите места в 3 городах', en: 'Visit places in 3 cities', uk: 'Відвідайте місця у 3 містах', es: 'Visita lugares en 3 ciudades' },
        requirement: (stats) => stats.citiesVisited >= 3,
        color: 'from-indigo-400 to-blue-500'
    },
    {
        id: 'country_hopper',
        icon: Globe,
        title: { ru: 'Международный турист', en: 'Globe Trotter', uk: 'Міжнародний турист', es: 'Trotamundos' },
        description: { ru: 'Посетите места в 3 странах', en: 'Visit places in 3 countries', uk: 'Відвідайте місця у 3 країнах', es: 'Visita lugares en 3 países' },
        requirement: (stats) => stats.countriesVisited >= 3,
        color: 'from-teal-400 to-cyan-500'
    },
    {
        id: 'reviewer',
        icon: Camera,
        title: { ru: 'Критик', en: 'Critic', uk: 'Критик', es: 'Crítico' },
        description: { ru: 'Оставьте 5 отзывов', en: 'Leave 5 reviews', uk: 'Залиште 5 відгуків', es: 'Deja 5 reseñas' },
        requirement: (stats) => stats.reviewsCount >= 5,
        color: 'from-yellow-400 to-amber-500'
    }
];

export default function AchievementsList({ stats }) {
    const { language } = useLanguage();

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement, idx) => {
                const isUnlocked = achievement.requirement(stats);
                const Icon = achievement.icon;
                const title = achievement.title[language] || achievement.title.en;
                const description = achievement.description[language] || achievement.description.en;

                return (
                    <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`relative p-5 rounded-2xl border-2 transition-all duration-300 ${
                            isUnlocked
                                ? 'bg-white dark:bg-neutral-800 border-transparent shadow-lg hover:shadow-xl hover:-translate-y-1'
                                : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 opacity-60'
                        }`}
                    >
                        {isUnlocked && (
                            <div className={`absolute inset-0 bg-gradient-to-br ${achievement.color} opacity-10 rounded-2xl`} />
                        )}
                        
                        <div className="relative flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                isUnlocked 
                                    ? `bg-gradient-to-br ${achievement.color} text-white` 
                                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400'
                            }`}>
                                {isUnlocked ? <Icon className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                            </div>
                            
                            <div className="flex-1">
                                <h3 className={`font-bold text-base mb-1 ${
                                    isUnlocked ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400'
                                }`}>
                                    {title}
                                </h3>
                                <p className={`text-sm ${
                                    isUnlocked ? 'text-neutral-600 dark:text-neutral-400' : 'text-neutral-400 dark:text-neutral-500'
                                }`}>
                                    {description}
                                </p>
                                
                                {isUnlocked && (
                                    <Badge className="mt-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-none">
                                        ✓ Unlocked
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}