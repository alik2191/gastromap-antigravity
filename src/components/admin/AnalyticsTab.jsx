import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Eye, Heart, Star, MapPin, TrendingUp, Globe, 
    ArrowLeft, Loader2, Search, ChevronRight, MessageSquare,
    EyeOff
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AnalyticsTab() {
    const [browsingLevel, setBrowsingLevel] = useState('countries'); // countries -> cities -> locations
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [showReviewsDialog, setShowReviewsDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch all data
    const { data: locations = [], isLoading: loadingLocations } = useQuery({
        queryKey: ['analytics-locations'],
        queryFn: () => base44.entities.Location.list()
    });

    const { data: views = [], isLoading: loadingViews } = useQuery({
        queryKey: ['analytics-views'],
        queryFn: () => base44.entities.LocationView.list()
    });

    const { data: savedLocations = [], isLoading: loadingSaved } = useQuery({
        queryKey: ['analytics-saved'],
        queryFn: () => base44.entities.SavedLocation.list()
    });

    const { data: reviews = [], isLoading: loadingReviews, refetch: refetchReviews } = useQuery({
        queryKey: ['analytics-reviews'],
        queryFn: () => base44.entities.Review.list('-created_date')
    });

    // Calculate analytics for locations
    const locationsWithAnalytics = useMemo(() => {
        return locations.map(location => {
            const locationViews = views.filter(v => v.location_id === location.id).length;
            const locationSaves = savedLocations.filter(s => s.location_id === location.id).length;
            const locationReviews = reviews.filter(r => r.location_id === location.id);
            const visibleReviews = locationReviews.filter(r => !r.is_hidden);
            const newReviews = locationReviews.filter(r => {
                const reviewDate = new Date(r.created_date);
                const threeDaysAgo = new Date();
                threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
                return reviewDate > threeDaysAgo;
            });
            const avgRating = visibleReviews.length > 0 
                ? (visibleReviews.reduce((sum, r) => sum + r.rating, 0) / visibleReviews.length).toFixed(1)
                : 0;

            return {
                ...location,
                viewsCount: locationViews,
                savesCount: locationSaves,
                reviewsCount: visibleReviews.length,
                totalReviews: locationReviews.length,
                newReviewsCount: newReviews.length,
                avgRating,
                engagementScore: locationViews + (locationSaves * 2) + (visibleReviews.length * 3)
            };
        });
    }, [locations, views, savedLocations, reviews]);

    // Filter by search
    const filteredBySearch = searchQuery 
        ? locationsWithAnalytics.filter(l => 
            l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.country?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : locationsWithAnalytics;

    // Country aggregation
    const countryData = useMemo(() => {
        const countries = [...new Set(filteredBySearch.map(l => l.country))].filter(Boolean).sort();
        return countries.map(country => {
            const locs = filteredBySearch.filter(l => l.country === country);
            return {
                name: country,
                locationsCount: locs.length,
                citiesCount: new Set(locs.map(l => l.city)).size,
                totalViews: locs.reduce((sum, l) => sum + l.viewsCount, 0),
                totalSaves: locs.reduce((sum, l) => sum + l.savesCount, 0),
                totalReviews: locs.reduce((sum, l) => sum + l.reviewsCount, 0),
                newReviews: locs.reduce((sum, l) => sum + l.newReviewsCount, 0)
            };
        });
    }, [filteredBySearch]);

    // City aggregation
    const cityData = useMemo(() => {
        if (!selectedCountry) return [];
        const cities = [...new Set(filteredBySearch.filter(l => l.country === selectedCountry).map(l => l.city))].filter(Boolean).sort();
        return cities.map(city => {
            const locs = filteredBySearch.filter(l => l.country === selectedCountry && l.city === city);
            return {
                name: city,
                locationsCount: locs.length,
                totalViews: locs.reduce((sum, l) => sum + l.viewsCount, 0),
                totalSaves: locs.reduce((sum, l) => sum + l.savesCount, 0),
                totalReviews: locs.reduce((sum, l) => sum + l.reviewsCount, 0),
                newReviews: locs.reduce((sum, l) => sum + l.newReviewsCount, 0)
            };
        });
    }, [selectedCountry, filteredBySearch]);

    // Locations in selected city
    const locationsInCity = useMemo(() => {
        if (!selectedCountry || !selectedCity) return [];
        return filteredBySearch
            .filter(l => l.country === selectedCountry && l.city === selectedCity)
            .sort((a, b) => b.engagementScore - a.engagementScore);
    }, [selectedCountry, selectedCity, filteredBySearch]);

    const handleToggleReviewVisibility = async (review) => {
        try {
            await base44.entities.Review.update(review.id, { is_hidden: !review.is_hidden });
            toast.success(review.is_hidden ? 'Отзыв снова виден пользователям' : 'Отзыв скрыт от пользователей');
            refetchReviews();
        } catch (error) {
            console.error(error);
            toast.error('Ошибка обновления отзыва');
        }
    };

    const goHome = () => {
        setBrowsingLevel('countries');
        setSelectedCountry(null);
        setSelectedCity(null);
    };

    if (loadingLocations || loadingViews || loadingSaved || loadingReviews) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
            </div>
        );
    }

    const totalStats = {
        views: locationsWithAnalytics.reduce((sum, l) => sum + l.viewsCount, 0),
        saves: locationsWithAnalytics.reduce((sum, l) => sum + l.savesCount, 0),
        reviews: locationsWithAnalytics.reduce((sum, l) => sum + l.reviewsCount, 0),
        avgRating: locationsWithAnalytics.length > 0
            ? (locationsWithAnalytics.reduce((sum, l) => sum + parseFloat(l.avgRating || 0), 0) / locationsWithAnalytics.filter(l => l.avgRating > 0).length).toFixed(1)
            : 0
    };

    return (
        <div className="space-y-6">
            {/* Overall Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">Просмотры</p>
                                <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{totalStats.views.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">Сохранения</p>
                                <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{totalStats.saves.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-green-500 dark:text-green-400 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">Отзывы</p>
                                <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{totalStats.reviews.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">Рейтинг</p>
                                <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{totalStats.avgRating}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                <Input 
                    placeholder="Поиск по названию, городу или стране..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                />
            </div>

            {/* Breadcrumbs */}
            {browsingLevel !== 'countries' && (
                <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                    <button onClick={goHome} className="hover:text-neutral-900 dark:hover:text-neutral-100 font-medium">
                        Все страны
                    </button>
                    {selectedCountry && (
                        <>
                            <span>/</span>
                            <button 
                                onClick={() => {
                                    setBrowsingLevel('cities');
                                    setSelectedCity(null);
                                }}
                                className={`hover:text-neutral-900 dark:hover:text-neutral-100 font-medium ${browsingLevel === 'cities' ? 'text-neutral-900 dark:text-neutral-100' : ''}`}
                            >
                                {selectedCountry}
                            </button>
                        </>
                    )}
                    {selectedCity && (
                        <>
                            <span>/</span>
                            <span className="text-neutral-900 dark:text-neutral-100 font-semibold">{selectedCity}</span>
                        </>
                    )}
                </div>
            )}

            {/* COUNTRIES VIEW */}
            {browsingLevel === 'countries' && (
                <Card className="shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                    <CardHeader>
                        <CardTitle className="text-neutral-900 dark:text-neutral-100">Статистика по странам</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {countryData.map(country => (
                                <motion.div
                                    key={country.name}
                                    whileHover={{ y: -4 }}
                                    onClick={() => {
                                        setSelectedCountry(country.name);
                                        setBrowsingLevel('cities');
                                    }}
                                    className="group bg-white dark:bg-neutral-900 shadow-sm border-0 dark:border dark:border-neutral-700 rounded-xl p-3 md:p-4 hover:shadow-lg transition-all cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-base md:text-lg font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                                {country.name}
                                            </h3>
                                            <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400">
                                                {country.citiesCount} городов • {country.locationsCount} локаций
                                            </p>
                                        </div>
                                        <Globe className="w-4 h-4 text-neutral-400 dark:text-neutral-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="text-center">
                                            <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 mx-auto mb-0.5" />
                                            <p className="text-[10px] text-neutral-700 dark:text-neutral-400 mb-0.5">Просмотры</p>
                                            <p className="text-sm md:text-base font-bold text-neutral-900 dark:text-neutral-100">{country.totalViews.toLocaleString()}</p>
                                        </div>

                                        <div className="text-center">
                                            <Heart className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 mx-auto mb-0.5" />
                                            <p className="text-[10px] text-neutral-700 dark:text-neutral-400 mb-0.5">Сохранения</p>
                                            <p className="text-sm md:text-base font-bold text-neutral-900 dark:text-neutral-100">{country.totalSaves.toLocaleString()}</p>
                                        </div>

                                        <div className="text-center">
                                            <MessageSquare className="w-3.5 h-3.5 text-green-600 dark:text-green-400 mx-auto mb-0.5" />
                                            <p className="text-[10px] text-neutral-700 dark:text-neutral-400 mb-0.5">Отзывы</p>
                                            <p className="text-sm md:text-base font-bold text-neutral-900 dark:text-neutral-100">{country.totalReviews.toLocaleString()}</p>
                                        </div>

                                        <div className="text-center">
                                            <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mx-auto mb-0.5" />
                                            <p className="text-[10px] text-neutral-700 dark:text-neutral-400 mb-0.5">Новые</p>
                                            <p className="text-sm md:text-base font-bold text-neutral-900 dark:text-neutral-100">{country.newReviews}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* CITIES VIEW */}
            {browsingLevel === 'cities' && selectedCountry && (
                <Card className="shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                    <CardHeader>
                        <CardTitle className="text-neutral-900 dark:text-neutral-100">Статистика по городам: {selectedCountry}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {cityData.map(city => (
                                <motion.div
                                    key={city.name}
                                    whileHover={{ y: -4 }}
                                    onClick={() => {
                                        setSelectedCity(city.name);
                                        setBrowsingLevel('locations');
                                    }}
                                    className="group bg-white dark:bg-neutral-900 shadow-sm border-0 dark:border dark:border-neutral-700 rounded-xl p-3 md:p-4 hover:shadow-lg transition-all cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-base md:text-lg font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                                {city.name}
                                            </h3>
                                            <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400">{city.locationsCount} локаций</p>
                                        </div>
                                        <MapPin className="w-4 h-4 text-neutral-400 dark:text-neutral-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-neutral-700 dark:text-neutral-400">Просмотры:</span>
                                            <span className="font-bold text-neutral-900 dark:text-neutral-100">{city.totalViews.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-neutral-700 dark:text-neutral-400">Сохранения:</span>
                                            <span className="font-bold text-neutral-900 dark:text-neutral-100">{city.totalSaves.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-neutral-700 dark:text-neutral-400">Отзывы:</span>
                                            <span className="font-bold text-neutral-900 dark:text-neutral-100">{city.totalReviews.toLocaleString()}</span>
                                        </div>
                                        {city.newReviews > 0 && (
                                            <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 mt-1">
                                                +{city.newReviews} новых
                                            </Badge>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* LOCATIONS VIEW */}
            {browsingLevel === 'locations' && selectedCountry && selectedCity && (
                <Card className="shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-neutral-900 dark:text-neutral-100">Локации: {selectedCity}, {selectedCountry}</CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => {
                                setBrowsingLevel('cities');
                                setSelectedCity(null);
                            }}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                К городам
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {locationsInCity.map(location => (
                                <div 
                                    key={location.id}
                                    className="shadow-sm border-0 dark:border dark:border-neutral-700 rounded-xl p-3 hover:shadow-md transition-all bg-white dark:bg-neutral-900"
                                >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm md:text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-0.5 truncate">{location.name}</h3>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{location.address}</p>
                                        </div>
                                        {location.image_url && (
                                            <img 
                                                src={location.image_url} 
                                                alt={location.name}
                                                className="w-12 h-12 md:w-14 md:h-14 object-cover rounded-lg shrink-0"
                                            />
                                        )}
                                    </div>

                                    <div className="grid grid-cols-4 gap-2 mb-2">
                                        <div className="text-center">
                                            <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 mx-auto mb-0.5" />
                                            <p className="text-sm md:text-base font-bold text-neutral-900 dark:text-neutral-100">{location.viewsCount}</p>
                                        </div>

                                        <div className="text-center">
                                            <Heart className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 mx-auto mb-0.5" />
                                            <p className="text-sm md:text-base font-bold text-neutral-900 dark:text-neutral-100">{location.savesCount}</p>
                                        </div>

                                        <div className="text-center">
                                            <MessageSquare className="w-3.5 h-3.5 text-green-600 dark:text-green-400 mx-auto mb-0.5" />
                                            <p className="text-sm md:text-base font-bold text-neutral-900 dark:text-neutral-100">{location.reviewsCount}</p>
                                        </div>

                                        <div className="text-center">
                                            <Star className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mx-auto mb-0.5" />
                                            <p className="text-sm md:text-base font-bold text-neutral-900 dark:text-neutral-100">{location.avgRating || '—'}</p>
                                        </div>
                                    </div>

                                    {location.totalReviews > 0 && (
                                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-700">
                                            {location.newReviewsCount > 0 && (
                                                <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0">
                                                    +{location.newReviewsCount}
                                                </Badge>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedLocation(location);
                                                    setShowReviewsDialog(true);
                                                }}
                                                className="ml-auto text-xs h-7 px-2 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                            >
                                                Отзывы ({location.totalReviews})
                                                <ChevronRight className="w-3 h-3 ml-1" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {locationsInCity.length === 0 && (
                                <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
                                    Нет локаций в этом городе
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Reviews Dialog */}
            <Dialog open={showReviewsDialog} onOpenChange={setShowReviewsDialog}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto dark:bg-neutral-800 dark:border-neutral-700">
                    <DialogHeader>
                        <DialogTitle className="text-neutral-900 dark:text-neutral-100">
                            Отзывы: {selectedLocation?.name}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {reviews
                            .filter(r => r.location_id === selectedLocation?.id)
                            .map(review => (
                                <div 
                                    key={review.id}
                                    className={`rounded-xl p-4 transition-all ${
                                        review.is_hidden 
                                            ? 'border-0 dark:border dark:border-red-900 bg-red-50 dark:bg-red-950/30 shadow-sm' 
                                            : 'shadow-sm border-0 dark:border dark:border-neutral-700 bg-white dark:bg-neutral-900'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{review.user_name}</span>
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star 
                                                            key={i} 
                                                            className={`w-3 h-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300 dark:text-neutral-600'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">{review.user_email}</p>
                                        </div>
                                        
                                        <div className="text-right">
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                                                {format(new Date(review.created_date), 'dd.MM.yyyy HH:mm')}
                                            </p>
                                            <Button
                                                variant={review.is_hidden ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => handleToggleReviewVisibility(review)}
                                                className={review.is_hidden ? "bg-green-600 hover:bg-green-700" : "dark:border-neutral-600 dark:text-neutral-300"}
                                            >
                                                {review.is_hidden ? (
                                                    <>
                                                        <Eye className="w-3 h-3 mr-1" />
                                                        Показать
                                                    </>
                                                ) : (
                                                    <>
                                                        <EyeOff className="w-3 h-3 mr-1" />
                                                        Скрыть
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {review.comment && (
                                        <p className="text-sm text-neutral-900 dark:text-neutral-200 leading-relaxed bg-neutral-50 dark:bg-neutral-950 rounded-lg p-3">
                                            {review.comment}
                                        </p>
                                    )}

                                    {review.is_hidden && (
                                        <div className="mt-3 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                                            <EyeOff className="w-3 h-3" />
                                            <span>Этот отзыв скрыт от пользователей</span>
                                        </div>
                                    )}
                                </div>
                            ))}

                        {reviews.filter(r => r.location_id === selectedLocation?.id).length === 0 && (
                            <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                                Пока нет отзывов для этой локации
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}