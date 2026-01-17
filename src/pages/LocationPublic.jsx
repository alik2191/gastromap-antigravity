import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Loader2, ArrowLeft, Share2, Clock, Phone, Calendar, Globe, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { useLanguage } from '../components/LanguageContext';

export default function LocationPublic() {
    const { language, t } = useLanguage();
    const [locationId, setLocationId] = useState(null);

    useEffect(() => {
        // Parse location ID from URL
        const path = window.location.pathname;
        const id = path.split('/location/')[1];
        setLocationId(id);
    }, []);

    const { data: location, isLoading } = useQuery({
        queryKey: ['public-location', locationId],
        queryFn: async () => {
            const locs = await base44.entities.Location.filter({ id: locationId });
            return locs[0];
        },
        enabled: !!locationId
    });

    const { data: reviews = [] } = useQuery({
        queryKey: ['reviews', locationId],
        queryFn: () => base44.entities.Review.filter({ location_id: locationId, status: 'approved' }),
        enabled: !!locationId
    });

    const averageRating = reviews.length > 0 
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    const getLocalizedField = (field) => {
        if (!location) return '';
        if (language === 'ru') return location[field];
        const localizedField = `${field}_${language}`;
        return location[localizedField] || location[field];
    };

    const handleShare = () => {
        const shareUrl = window.location.href;
        if (navigator.share) {
            navigator.share({
                title: location.name,
                text: `Посмотри это место: ${location.name}`,
                url: shareUrl
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(shareUrl);
            toast.success('Ссылка скопирована!');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!location) {
        return (
            <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-neutral-900 mb-4">Локация не найдена</h1>
                    <Link to={createPageUrl("Home")}>
                        <Button>На главную</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const localizedDescription = getLocalizedField('description');
    const localizedInsiderTip = getLocalizedField('insider_tip');
    const localizedMustTry = getLocalizedField('must_try');
    const localizedCity = getLocalizedField('city');
    const localizedCountry = getLocalizedField('country');

    return (
        <div className="min-h-screen bg-[#F2F2F7]">
            {/* Hero Section */}
            <div className="relative h-[60vh] max-h-[500px]">
                <img 
                    src={location.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80"} 
                    alt={location.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                
                <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
                    <Link to={createPageUrl("Home")}>
                        <Button variant="ghost" size="icon" className="bg-white/90 backdrop-blur-sm rounded-full hover:bg-white">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleShare}
                        className="bg-white/90 backdrop-blur-sm rounded-full hover:bg-white"
                    >
                        <Share2 className="w-5 h-5" />
                    </Button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-8">
                    <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">{location.name}</h1>
                    <div className="flex items-center text-white/95 mb-4">
                        <MapPin className="w-5 h-5 mr-2" />
                        <span className="drop-shadow">{localizedCity}, {localizedCountry}</span>
                    </div>
                    {reviews.length > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <Star 
                                        key={i} 
                                        className={`w-5 h-5 ${i < Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-white/50'}`}
                                    />
                                ))}
                            </div>
                            <span className="text-lg font-semibold text-white drop-shadow">{averageRating}</span>
                            <span className="text-sm text-white/80 drop-shadow">({reviews.length})</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-3">
                    {location.is_hidden_gem && (
                        <Badge className="bg-neutral-100 text-neutral-700 text-xs font-semibold uppercase px-3 py-1.5">
                            Hidden Gem
                        </Badge>
                    )}
                    {location.price_range && (
                        <Badge className="bg-neutral-100 text-neutral-700 text-sm font-semibold px-3 py-1.5">
                            {location.price_range}
                        </Badge>
                    )}
                    {location.special_labels && location.special_labels.map(label => (
                        <Badge key={label} className="bg-neutral-100 text-neutral-700 text-xs font-semibold uppercase px-3 py-1.5">
                            {t(label)}
                        </Badge>
                    ))}
                </div>

                {/* Description */}
                {localizedDescription && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <p className="text-neutral-700 leading-relaxed text-lg">{localizedDescription}</p>
                    </div>
                )}

                {/* Curator's Tip */}
                {localizedInsiderTip && (
                    <div className="bg-purple-50 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <h4 className="font-semibold text-purple-900">{t('curatorsTip')}</h4>
                        </div>
                        <p className="text-purple-900 italic leading-relaxed">"{localizedInsiderTip}"</p>
                    </div>
                )}

                {/* Must Try */}
                {localizedMustTry && (
                    <div className="bg-amber-50 rounded-2xl p-6 shadow-sm">
                        <h4 className="font-semibold text-amber-900 mb-2">{t('mustTry')}</h4>
                        <p className="text-amber-800 leading-relaxed">{localizedMustTry}</p>
                    </div>
                )}

                {/* Additional Info */}
                {(location.opening_hours || location.phone || location.booking_url || location.website) && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
                        <h4 className="font-semibold text-neutral-900 mb-4">Дополнительная информация</h4>
                        
                        {location.opening_hours && (
                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-neutral-500 mt-0.5" />
                                <div>
                                    <p className="text-sm text-neutral-500">Часы работы</p>
                                    <p className="text-neutral-900">{location.opening_hours}</p>
                                </div>
                            </div>
                        )}
                        
                        {location.phone && (
                            <div className="flex items-start gap-3">
                                <Phone className="w-5 h-5 text-neutral-500 mt-0.5" />
                                <div>
                                    <p className="text-sm text-neutral-500">Телефон</p>
                                    <a href={`tel:${location.phone}`} className="text-blue-600 hover:text-blue-700">{location.phone}</a>
                                </div>
                            </div>
                        )}
                        
                        {location.website && (
                            <div className="flex items-start gap-3">
                                <Globe className="w-5 h-5 text-neutral-500 mt-0.5" />
                                <div>
                                    <p className="text-sm text-neutral-500">Сайт</p>
                                    <a 
                                        href={location.website} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-700"
                                    >
                                        {location.website}
                                    </a>
                                </div>
                            </div>
                        )}
                        
                        {location.booking_url && (
                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-neutral-500 mt-0.5" />
                                <div>
                                    <p className="text-sm text-neutral-500">Бронирование</p>
                                    <a 
                                        href={location.booking_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-700"
                                    >
                                        Забронировать →
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Address & Map */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h4 className="font-semibold text-neutral-900 mb-3">Адрес</h4>
                    <p className="text-neutral-700 mb-3">
                        {location.address || `${localizedCity}, {localizedCountry}`}
                    </p>
                    {location.latitude && location.longitude && (
                        <a 
                            href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Открыть на карте →
                        </a>
                    )}
                </div>

                {/* CTA */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center shadow-xl">
                    <h3 className="text-2xl font-bold text-white mb-3">Хочешь больше таких мест?</h3>
                    <p className="text-white/90 mb-6">Присоединяйся к GastroGuide и открой тысячи лучших локаций мира</p>
                    <Link to={createPageUrl("Pricing")}>
                        <Button size="lg" className="bg-white text-blue-600 hover:bg-neutral-100 rounded-full h-12 px-8 font-semibold">
                            Начать сейчас
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}