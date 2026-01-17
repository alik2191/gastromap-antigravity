import React, { useState, useEffect, useMemo, memo } from 'react';
// import { base44 } from '@/api/client'; // DISABLED: Using mock client
import { base44 } from '@/api/client'; // MOCK DATA
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
    MapPin, Grid3X3, Map, Search, Heart, Check,
    Filter, Globe, Loader2, LogOut, Settings, Bell, User, Sparkles, Plus, X, SlidersHorizontal, BarChart3, ArrowLeft, LocateFixed, ChevronDown
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import LocationCard from '../components/dashboard/LocationCard';
import WorldMap from '../components/dashboard/WorldMap';
import MobileBottomNav from '../components/dashboard/MobileBottomNav';
import MobileLocationCard from '../components/dashboard/MobileLocationCard';
import AIAssistant from '../components/dashboard/AIAssistant';
import FeedbackModal from '../components/dashboard/FeedbackModal';
import CreatorLocationForm from '../components/dashboard/CreatorLocationForm';
import SearchAutocomplete from '../components/dashboard/SearchAutocomplete';
import Fuse from 'fuse.js';

import FilterPanel from '../components/dashboard/FilterPanel';
import { motion } from "framer-motion";
import { MessageSquare, Languages, Moon, Sun, Monitor } from "lucide-react";
import { useLanguage } from '../components/LanguageContext';
import { useTheme } from '../components/ThemeContext';
import { toast } from "sonner";
import { specialLabels } from '../components/constants';
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getTimeBasedImage, getTimeOfDayLabel } from '../components/utils/timeOfDay';
import { useAuth } from '@/lib/AuthContext';

export default function Dashboard() {
    const { language, toggleLanguage, t } = useLanguage();
    const { theme, toggleTheme, resolvedTheme } = useTheme();
    const { user: authUser, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false); // Always false in demo mode
    const [view, setView] = useState('grid');
    const [mobileTab, setMobileTab] = useState('discover');
    const [desktopFilter, setDesktopFilter] = useState('all'); // all, wishlist, visited
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
    // Hierarchical Navigation State
    const [browsingLevel, setBrowsingLevel] = useState('countries'); // countries -> cities -> locations
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);

    const [filterType, setFilterType] = useState('all');
    const [filterPriceRange, setFilterPriceRange] = useState([1, 4]); // [min, max] price levels
    const [filterLabels, setFilterLabels] = useState([]);
    const [filterRating, setFilterRating] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [showLocationForm, setShowLocationForm] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [searchRadius, setSearchRadius] = useState(10); // Default 10km radius
    const [showAllCountries, setShowAllCountries] = useState(false); // For expanding countries list


    const queryClient = useQueryClient();

    // Request geolocation permission
    useEffect(() => {
        if (navigator.geolocation) {
            // Safari-friendly options with longer timeout and high accuracy
            const geoOptions = {
                enableHighAccuracy: true,
                timeout: 10000, // 10 seconds timeout for Safari
                maximumAge: 0 // Don't use cached position
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log('Geolocation success:', position.coords);
                    setUserLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    console.error('Geolocation error:', error.code, error.message);
                    // Try again with lower accuracy for Safari
                    if (error.code === 3) { // TIMEOUT
                        navigator.geolocation.getCurrentPosition(
                            (position) => {
                                console.log('Geolocation success (retry):', position.coords);
                                setUserLocation({
                                    latitude: position.coords.latitude,
                                    longitude: position.coords.longitude
                                });
                            },
                            (retryError) => {
                                console.error('Geolocation retry failed:', retryError.code, retryError.message);
                            },
                            { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 }
                        );
                    }
                },
                geoOptions
            );
        }
    }, []);

    // AUTH & SUBSCRIPTION LOGIC - DISABLED FOR DEMO
    useEffect(() => {
        // DEMO MODE: Use mock user from AuthContext
        if (authUser) {
            setUser(authUser);
            setLoading(false);
        } else {
            // Fallback mock user
            setUser({
                id: 'demo-user-123',
                email: 'demo@gastromap.app',
                name: 'Demo User',
                role: 'admin',
                custom_role: 'admin'
            });
            setLoading(false);
        }

        // Original auth code commented out:
        /*
        const checkAuth = async () => {
            try {
                // 1. Check if logged in
                const userData = await base44.auth.me();
                setUser(userData);
                
                // Check for URL params to restore navigation state
                const params = new URLSearchParams(window.location.search);
                const tabParam = params.get('tab');
                const countryParam = params.get('country');
                const cityParam = params.get('city');
                
                if (tabParam === 'saved' || tabParam === 'done') {
                    setMobileTab(tabParam);
                }
                
                // Restore navigation state from URL
                if (countryParam && cityParam) {
                    setSelectedCountry(countryParam);
                    setSelectedCity(cityParam);
                    setBrowsingLevel('locations');
                } else if (countryParam) {
                    setSelectedCountry(countryParam);
                    setBrowsingLevel('cities');
                }
                
                // 2. Check for active subscription and validate expiration
                const subs = await base44.entities.Subscription.filter({ 
                    user_email: userData.email,
                    status: 'active'
                });

                // Check if subscription is actually expired
                const now = new Date();
                let hasValidSub = false;

                for (const sub of subs) {
                    const endDate = new Date(sub.end_date);
                    if (endDate < now) {
                        // Subscription expired, update status
                        await base44.entities.Subscription.update(sub.id, { status: 'expired' });
                    } else {
                        hasValidSub = true;
                    }
                }

                // 3. Logic: User exists but no valid subscription -> Redirect to Pricing
                // Exception: admins and creators don't need subscriptions
                if (!hasValidSub && userData.role !== 'admin' && userData.role !== 'creator' && userData.custom_role !== 'creator') {
                    navigate(createPageUrl('Pricing'));
                    return;
                }
                
                setLoading(false);
            } catch (e) {
                // 4. Not logged in -> Redirect to Login
                // If they are on dashboard, they must be logged in. 
                // Using current URL as nextUrl ensures they come back here, 
                // which then triggers the subscription check above.
                base44.auth.redirectToLogin(window.location.href);
            }
        };
        
        checkAuth();
        */
    }, [authUser, navigate]);

    const { data: locations = [], isLoading: loadingLocations } = useQuery({
        queryKey: ['locations'],
        queryFn: async () => {
            const allLocations = await base44.entities.Location.list();
            // Admin sees all locations
            if (user?.role === 'admin' || user?.custom_role === 'admin') {
                return allLocations;
            }
            // Creators see: their own locations + all published
            if (user?.role === 'creator' || user?.custom_role === 'creator') {
                return allLocations.filter(l =>
                    l.created_by === user.email ||  // Все свои локации
                    l.status === 'published'        // Все published от других
                );
            }
            // Regular users see ONLY published locations
            return allLocations.filter(l => l.status === 'published');
        },
        enabled: !loading && !!user
    });

    const { data: savedLocations = [], isLoading: loadingSaved } = useQuery({
        queryKey: ['savedLocations', user?.email],
        queryFn: () => base44.entities.SavedLocation.filter({ user_email: user.email }),
        enabled: !loading && !!user
    });

    const { data: regionStatuses = [] } = useQuery({
        queryKey: ['regionStatuses'],
        queryFn: () => base44.entities.RegionStatus.list(),
        enabled: !loading && !!user
    });

    const { data: newFeedbackCount = 0 } = useQuery({
        queryKey: ['newFeedbackCount'],
        queryFn: async () => {
            const items = await base44.entities.Feedback.filter({ status: 'new' });
            return items.length;
        },
        enabled: !!user && user.role === 'admin'
    });

    const { data: creatorTasksCount = 0 } = useQuery({
        queryKey: ['creatorTasksCount'],
        queryFn: async () => {
            const allRounds = await base44.entities.ModerationRound.filter({ status: 'pending_creator_answers' });
            const myAnswers = await base44.entities.CreatorAnswer.filter({ creator_email: user.email });
            const answeredIds = new Set(myAnswers.map(a => a.review_question_id));
            const unansweredRounds = allRounds.filter(round => !answeredIds.has(round.id));

            // Не показываем задачи для собственных локаций если есть другие
            const myEmail = user.email;
            const myLocations = await base44.entities.Location.filter({ created_by: myEmail });
            const myLocationIds = new Set(myLocations.map(l => l.id));

            const otherRounds = unansweredRounds.filter(r => !myLocationIds.has(r.location_id));
            return otherRounds.length > 0 ? otherRounds.length : unansweredRounds.length;
        },
        enabled: !!user && (user.role === 'creator' || user.custom_role === 'creator'),
        refetchInterval: 30000
    });

    const saveMutation = useMutation({
        mutationFn: async ({ locationId, listType, note }) => {
            const existing = savedLocations.find(s => s.location_id === locationId);
            if (existing) {
                const updateData = { list_type: listType };
                if (typeof note === 'string' && note.trim() !== '') {
                    updateData.personal_note = note;
                }
                return base44.entities.SavedLocation.update(existing.id, updateData);
            }
            const createData = {
                user_email: user.email,
                location_id: locationId,
                list_type: listType,
            };
            if (typeof note === 'string' && note.trim() !== '') {
                createData.personal_note = note;
            }
            return base44.entities.SavedLocation.create(createData);
        },
        onSuccess: () => queryClient.invalidateQueries(['savedLocations'])
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }) => {
            return base44.entities.SavedLocation.update(id, data);
        },
        onSuccess: () => queryClient.invalidateQueries(['savedLocations'])
    });

    const handleSave = async (locationId, listType, note) => {
        try {
            const existing = savedLocations.find(s => s.location_id === locationId);

            // If already saved with the same type, remove it (toggle off)
            if (existing && existing.list_type === listType) {
                await base44.entities.SavedLocation.delete(existing.id);
                await queryClient.invalidateQueries(['savedLocations']);
                await queryClient.refetchQueries(['savedLocations']);
                toast.success(listType === 'visited' ? t('removedFromVisited') : t('removedFromWishlist'));
            } else {
                // Otherwise add/update
                await saveMutation.mutateAsync({ locationId, listType, note });
                await queryClient.refetchQueries(['savedLocations']);
                toast.success(listType === 'visited' ? t('markedAsVisited') : t('addedToWishlist'));
            }
        } catch (error) {
            console.error('Error saving location:', error);
            toast.error(t('errorSavingLocation') || 'Не удалось сохранить локацию. Попробуйте еще раз.');
        }
    };

    const handleUpdate = async (id, data) => {
        try {
            await updateMutation.mutateAsync({ id, data });
            toast.success(t('savedSuccessfully') || 'Изменения сохранены');
        } catch (error) {
            console.error('Error updating saved location:', error);
            toast.error(t('errorUpdating') || 'Не удалось сохранить изменения. Попробуйте еще раз.');
        }
    };

    // Helper to get localized field
    const getLocalizedField = (location, field) => {
        if (language === 'ru') return location[field];
        const localizedField = `${field}_${language}`;
        return location[localizedField] || location[field];
    };

    // Helper to check if location is new (created within last 14 days)
    const isLocationNew = (location) => {
        if (!location.created_date) return false;
        const created = new Date(location.created_date);
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        return created > fourteenDaysAgo;
    };

    // Data aggregation for hierarchy - recalculate when language changes
    const countryData = useMemo(() => {
        const availableCountries = [...new Set(locations.map(l => l.country))].filter(Boolean).sort();
        return availableCountries.map(country => {
            const locs = locations.filter(l => l.country === country);
            const firstLoc = locs[0];
            const newLocationsCount = locs.filter(l => isLocationNew(l)).length;

            // Find the most recent location in this country to determine which city image to use
            const mostRecentLocation = locs.reduce((latest, loc) => {
                if (!latest) return loc;
                const latestDate = new Date(latest.created_date || 0);
                const locDate = new Date(loc.created_date || 0);
                return locDate > latestDate ? loc : latest;
            }, null);

            // Check region status from database
            const regionStatus = regionStatuses.find(rs => rs.region_name === country && rs.region_type === 'country');

            // Get time-based image for country
            let countryImage = getTimeBasedImage(regionStatus);

            // Fallback to city image if no country image
            if (!countryImage && mostRecentLocation?.city) {
                const cityRegionStatus = regionStatuses.find(rs =>
                    rs.region_name === mostRecentLocation.city &&
                    rs.region_type === 'city' &&
                    rs.parent_region === country
                );
                countryImage = getTimeBasedImage(cityRegionStatus);
                if (!countryImage && cityRegionStatus?.image_url) {
                    countryImage = cityRegionStatus.image_url;
                }
            }

            // Final fallback
            if (!countryImage) {
                if (mostRecentLocation?.image_url) {
                    countryImage = mostRecentLocation.image_url;
                } else {
                    countryImage = "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80";
                }
            }

            const isActive = regionStatus ? regionStatus.is_active && !regionStatus.is_coming_soon : true;
            const isComingSoon = regionStatus ? regionStatus.is_coming_soon : false;

            return {
                name: country,
                localizedName: firstLoc ? getLocalizedField(firstLoc, 'country') : country,
                count: locs.length,
                newCount: newLocationsCount,
                image: countryImage,
                citiesCount: new Set(locs.map(l => l.city)).size,
                isActive,
                isComingSoon
            };
        }).filter(country => {
            // Admin и Creator видят ВСЕ страны
            const isAdminOrCreator = user?.role === 'admin' || user?.custom_role === 'admin' ||
                user?.role === 'creator' || user?.custom_role === 'creator';
            if (isAdminOrCreator) {
                return true;
            }

            // Обычные пользователи видят: активные И Coming Soon страны
            const regionStatus = regionStatuses.find(rs => rs.region_name === country.name && rs.region_type === 'country');
            return !regionStatus || regionStatus.is_active || regionStatus.is_coming_soon;
        });
    }, [locations, language, regionStatuses, user]);

    // Get cities for selected country - recalculate when language changes
    const cityData = useMemo(() => {
        if (!selectedCountry) return [];

        // ИЕРАРХИЯ: Проверяем статус родительской страны
        const countryStatus = regionStatuses.find(rs => rs.region_name === selectedCountry && rs.region_type === 'country');
        const isAdminOrCreator = user?.role === 'admin' || user?.custom_role === 'admin' ||
            user?.role === 'creator' || user?.custom_role === 'creator';

        // Если страна полностью скрыта (is_active=false AND is_coming_soon=false) для обычных пользователей - не показываем города
        // Coming Soon страны - показываем города (они будут полупрозрачными)
        // Admin и Creator видят все города
        if (!isAdminOrCreator && countryStatus && !countryStatus.is_active && !countryStatus.is_coming_soon) {
            return [];
        }

        const availableCities = [...new Set(locations.filter(l => l.country === selectedCountry).map(l => l.city))].filter(Boolean).sort();
        return availableCities.map(city => {
            const locs = locations.filter(l => l.country === selectedCountry && l.city === city);
            const firstLoc = locs[0];
            const newLocationsCount = locs.filter(l => isLocationNew(l)).length;

            // Check city status from database
            const regionStatus = regionStatuses.find(rs => rs.region_name === city && rs.region_type === 'city' && rs.parent_region === selectedCountry);
            const isActive = regionStatus ? regionStatus.is_active && !regionStatus.is_coming_soon : true;
            const isComingSoon = regionStatus ? regionStatus.is_coming_soon : false;

            // Use image from RegionStatus if available, otherwise fallback to location images
            const cityImage = regionStatus?.image_url || locs.find(l => l.image_url)?.image_url || "https://images.unsplash.com/photo-1449824913929-223a6e34f541?w=800&q=80";

            return {
                name: city,
                localizedName: firstLoc ? getLocalizedField(firstLoc, 'city') : city,
                count: locs.length,
                newCount: newLocationsCount,
                image: cityImage,
                isActive,
                isComingSoon
            };
        }).filter(city => {
            // Admin и Creator видят ВСЕ города
            if (isAdminOrCreator) {
                return true;
            }

            // Обычные пользователи видят: активные И Coming Soon города
            const regionStatus = regionStatuses.find(rs => rs.region_name === city.name && rs.region_type === 'city' && rs.parent_region === selectedCountry);
            return !regionStatus || regionStatus.is_active || regionStatus.is_coming_soon;
        });
    }, [selectedCountry, locations, language, regionStatuses, user]);

    // Calculate distance between two points in km using Haversine formula
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Fuzzy search with Fuse.js
    const fuseSearch = useMemo(() => {
        if (!locations.length) return null;
        return new Fuse(locations, {
            keys: [
                { name: 'name', weight: 3 },
                { name: 'city', weight: 2 },
                { name: 'country', weight: 2 },
                { name: 'address', weight: 1 },
                { name: 'description', weight: 0.5 },
                { name: 'tags', weight: 1.5 }
            ],
            threshold: 0.3,
            includeScore: true
        });
    }, [locations]);

    // Filter Logic with improved search and radius (optimized with useMemo)
    const filteredLocations = useMemo(() => {
        let results = locations;

        // Apply fuzzy search if query exists
        if (searchQuery && fuseSearch) {
            const searchResults = fuseSearch.search(searchQuery);
            results = searchResults.map(result => result.item);
        }

        return results.filter(location => {
            // Search is already applied via Fuse.js, so matchesSearch is always true here
            const matchesSearch = true;

            // ИЕРАРХИЯ РЕГИОНОВ: Проверяем статусы страны и города ТОЛЬКО для обычных пользователей
            // Coming Soon регионы видны всем, но некликабельны для обычных пользователей
            // Admin и Creator видят все локации
            const isAdminOrCreator = user?.role === 'admin' || user?.custom_role === 'admin' ||
                user?.role === 'creator' || user?.custom_role === 'creator';
            if (!isAdminOrCreator) {
                // Проверяем статус страны - скрываем только если явно неактивна И не Coming Soon
                const countryStatus = regionStatuses.find(rs => rs.region_name === location.country && rs.region_type === 'country');
                if (countryStatus && !countryStatus.is_active && !countryStatus.is_coming_soon) {
                    return false; // Полностью скрытая страна - не показываем локации
                }

                // Проверяем статус города - скрываем только если явно неактивен И не Coming Soon
                const cityStatus = regionStatuses.find(rs =>
                    rs.region_name === location.city &&
                    rs.region_type === 'city' &&
                    rs.parent_region === location.country
                );
                if (cityStatus && !cityStatus.is_active && !cityStatus.is_coming_soon) {
                    return false; // Полностью скрытый город - не показываем локации
                }
            }

            // If searching, ignore hierarchy. If not searching, respect hierarchy.
            let matchesHierarchy = true;
            if (!searchQuery) {
                if (browsingLevel === 'locations') {
                    matchesHierarchy = location.country === selectedCountry && location.city === selectedCity;
                }
                else if (browsingLevel === 'cities') {
                    matchesHierarchy = location.country === selectedCountry;
                }
            }

            const matchesType = filterType === 'all' || location.type === filterType;

            // Price filter with range
            const matchesPrice = (() => {
                if (!location.price_range) return true;
                const priceLevel = location.price_range.length; // $ = 1, $$ = 2, etc.
                return priceLevel >= filterPriceRange[0] && priceLevel <= filterPriceRange[1];
            })();
            const matchesLabels = filterLabels.length === 0 ||
                (location.special_labels && filterLabels.some(label => location.special_labels.includes(label)));
            const matchesRating = filterRating === 0 ||
                (location.average_rating && location.average_rating >= filterRating);

            // Radius filter
            let matchesRadius = true;
            if (searchRadius && userLocation && location.latitude && location.longitude) {
                const distance = calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    location.latitude,
                    location.longitude
                );
                matchesRadius = distance <= searchRadius;
            }

            const savedLoc = savedLocations.find(s => s.location_id === location.id);

            // Mobile tab filtering
            if (mobileTab === 'saved') {
                if (!savedLoc || savedLoc.list_type !== 'wishlist') return false;
                matchesHierarchy = true;
            } else if (mobileTab === 'done') {
                if (!savedLoc || savedLoc.list_type !== 'visited') return false;
                matchesHierarchy = true;
            }

            // Desktop filter
            if (desktopFilter === 'wishlist') {
                if (!savedLoc || savedLoc.list_type !== 'wishlist') return false;
                matchesHierarchy = true;
            } else if (desktopFilter === 'visited') {
                if (!savedLoc || savedLoc.list_type !== 'visited') return false;
                matchesHierarchy = true;
            }

            return matchesSearch && matchesHierarchy && matchesType && matchesPrice && matchesLabels && matchesRating && matchesRadius;
        });
    }, [locations, searchQuery, browsingLevel, selectedCountry, selectedCity, mobileTab, desktopFilter, filterType, filterPriceRange, filterLabels, filterRating, searchRadius, savedLocations, user, regionStatuses, userLocation, fuseSearch]);

    // Helper to reset navigation
    const goHome = () => {
        setBrowsingLevel('countries');
        setSelectedCountry(null);
        setSelectedCity(null);
        setSearchQuery('');
        // Clear URL params
        const params = new URLSearchParams(window.location.search);
        params.delete('country');
        params.delete('city');
        const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
        window.history.replaceState({}, '', newUrl);
    };

    const selectCountry = (country) => {
        setSelectedCountry(country);
        setBrowsingLevel('cities');
        // Update URL
        const params = new URLSearchParams(window.location.search);
        params.set('country', country);
        params.delete('city');
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    };

    const selectCity = (city) => {
        setSelectedCity(city);
        setBrowsingLevel('locations');
        // Update URL
        const params = new URLSearchParams(window.location.search);
        params.set('city', city);
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    };

    // Подсчет уникальных локаций (на случай дубликатов в БД)
    const visitedCount = [...new Set(savedLocations.filter(s => s.list_type === 'visited').map(s => s.location_id))].length;
    const wishlistCount = [...new Set(savedLocations.filter(s => s.list_type === 'wishlist').map(s => s.location_id))].length;

    // Персонализированные рекомендации
    const getPersonalizedRecommendations = useMemo(() => {
        if (!locations.length || !savedLocations.length) return [];

        const userVisited = savedLocations
            .filter(s => s.list_type === 'visited')
            .map(s => locations.find(l => l.id === s.location_id))
            .filter(Boolean);

        const userWishlist = savedLocations
            .filter(s => s.list_type === 'wishlist')
            .map(s => locations.find(l => l.id === s.location_id))
            .filter(Boolean);

        const allUserLocations = [...userVisited, ...userWishlist];
        if (!allUserLocations.length) return [];

        // Анализ предпочтений пользователя
        const preferredTypes = [...new Set(allUserLocations.map(l => l.type))];
        const preferredCities = [...new Set(allUserLocations.map(l => l.city))];
        const preferredLabels = [...new Set(allUserLocations.flatMap(l => l.special_labels || []))];
        const preferredPrices = [...new Set(allUserLocations.map(l => l.price_range).filter(Boolean))];

        // Находим похожие места, которые пользователь еще не сохранил
        const savedIds = new Set(savedLocations.map(s => s.location_id));
        const recommendations = locations
            .filter(l => !savedIds.has(l.id) && l.status === 'published')
            .map(l => {
                let score = 0;

                // Совпадение типа заведения (высокий приоритет)
                if (preferredTypes.includes(l.type)) score += 3;

                // Совпадение города (средний приоритет)
                if (preferredCities.includes(l.city)) score += 2;

                // Совпадение ценовой категории
                if (preferredPrices.includes(l.price_range)) score += 1;

                // Совпадение special labels
                const matchingLabels = (l.special_labels || []).filter(label =>
                    preferredLabels.includes(label)
                );
                score += matchingLabels.length * 0.5;

                // Высокий рейтинг
                if (l.average_rating >= 4.5) score += 1;

                // Hidden gem bonus
                if (l.is_hidden_gem) score += 0.5;

                return { location: l, score };
            })
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 6)
            .map(item => item.location);

        return recommendations;
    }, [locations, savedLocations]);

    // Новые места в любимых городах
    const newInFavoriteCities = useMemo(() => {
        if (!locations.length || !savedLocations.length) return [];

        const userVisited = savedLocations
            .filter(s => s.list_type === 'visited')
            .map(s => locations.find(l => l.id === s.location_id))
            .filter(Boolean);

        const favoriteCities = [...new Set(userVisited.map(l => l.city))];
        if (!favoriteCities.length) return [];

        const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const savedIds = new Set(savedLocations.map(s => s.location_id));

        return locations
            .filter(l =>
                !savedIds.has(l.id) &&
                favoriteCities.includes(l.city) &&
                l.created_date &&
                new Date(l.created_date) > twoWeeksAgo &&
                l.status === 'published'
            )
            .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
            .slice(0, 6);
    }, [locations, savedLocations]);

    // Популярные места рядом
    const popularNearby = useMemo(() => {
        if (!locations.length || !userLocation) return [];

        const savedIds = new Set(savedLocations.map(s => s.location_id));

        return locations
            .filter(l =>
                !savedIds.has(l.id) &&
                l.latitude &&
                l.longitude &&
                l.average_rating >= 4.0 &&
                l.status === 'published'
            )
            .map(l => {
                const distance = calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    l.latitude,
                    l.longitude
                );
                return { location: l, distance };
            })
            .filter(item => item.distance <= 5) // 5km radius
            .sort((a, b) => {
                // Sort by rating first, then distance
                const ratingDiff = (b.location.average_rating || 0) - (a.location.average_rating || 0);
                return ratingDiff !== 0 ? ratingDiff : a.distance - b.distance;
            })
            .slice(0, 6)
            .map(item => item.location);
    }, [locations, savedLocations, userLocation]);

    // Показывать персонализированные секции только если не используются фильтры/поиск
    const showPersonalizedSections = !searchQuery &&
        browsingLevel === 'countries' &&
        mobileTab === 'discover' &&
        desktopFilter === 'all' &&
        savedLocations.length > 0;

    // Count active filters
    const activeFiltersCount = [
        filterType !== 'all',
        !(filterPriceRange[0] === 1 && filterPriceRange[1] === 4),
        filterRating > 0,
        filterLabels.length > 0,
        searchRadius !== 10
    ].filter(Boolean).length;

    const resetFilters = () => {
        setFilterType('all');
        setFilterPriceRange([1, 4]);
        setFilterRating(0);
        setFilterLabels([]);
        setSearchRadius(10);
        setShowFilters(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F2F2F7] dark:bg-neutral-900 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
        <div className="min-h-screen bg-[#F2F2F7] dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 pb-24 md:pb-10 font-sans">
            {/* Desktop Header */}
            <header className="hidden md:block sticky top-0 z-40 bg-[#F2F2F7]/90 dark:bg-neutral-900/90 backdrop-blur-xl border-b border-white/20 dark:border-neutral-800 pt-4 pb-4 px-4 lg:px-8">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3 lg:gap-8">
                        <Link to={createPageUrl("Home")} className="flex items-center gap-2 lg:gap-3">
                            <div className="w-9 h-9 lg:w-10 lg:h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                                G
                            </div>
                            <span className="text-lg lg:text-xl font-bold tracking-tight">GastroMap</span>
                        </Link>

                        {/* Desktop Nav */}
                        <div className="flex items-center gap-2 lg:gap-4">
                            <Button
                                variant={view === 'grid' ? 'secondary' : 'ghost'}
                                onClick={() => setView('grid')}
                                className="rounded-full h-9 px-3 lg:h-10 lg:px-4 transition-all hover:bg-white dark:hover:bg-neutral-800 hover:shadow-sm"
                                aria-label="Grid view"
                            >
                                <Grid3X3 className="w-4 h-4 mr-1.5 lg:mr-2" /> <span className="hidden lg:inline">{t('overview')}</span><span className="lg:hidden text-sm">Grid</span>
                            </Button>
                            <Button
                                variant={view === 'map' ? 'secondary' : 'ghost'}
                                onClick={() => setView('map')}
                                className="rounded-full h-9 px-3 lg:h-10 lg:px-4 transition-all hover:bg-white dark:hover:bg-neutral-800 hover:shadow-sm"
                                aria-label="Map view"
                            >
                                <Map className="w-4 h-4 mr-1.5 lg:mr-2" /> <span className="hidden lg:inline">{t('map')}</span><span className="lg:hidden text-sm">Map</span>
                            </Button>
                            {(user?.role === 'creator' || user?.custom_role === 'creator') && (
                                <>
                                    <Link to={createPageUrl('CreatorTools')} className="relative">
                                        <Button
                                            variant="outline"
                                            className="rounded-full h-9 px-3 lg:h-10 lg:px-4 text-sm"
                                        >
                                            <BarChart3 className="w-4 h-4 mr-1.5" />
                                            Contribution
                                            {creatorTasksCount > 0 && (
                                                <span className="ml-1.5 bg-purple-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                                                    {creatorTasksCount > 99 ? '99+' : creatorTasksCount}
                                                </span>
                                            )}
                                        </Button>
                                    </Link>
                                    <Button
                                        onClick={() => setShowLocationForm(true)}
                                        className="rounded-full h-9 px-3 lg:h-10 lg:px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm"
                                    >
                                        <Plus className="w-4 h-4 mr-1.5" />
                                        <span className="hidden xl:inline">{t('addLocation')}</span>
                                        <span className="xl:hidden">Add</span>
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 lg:gap-3">
                        <div className="flex items-center gap-2 lg:gap-3 bg-white dark:bg-neutral-800 rounded-full px-3 lg:px-4 py-1.5 lg:py-2 shadow-sm border border-neutral-100 dark:border-neutral-700">
                            <button
                                onClick={() => {
                                    if (desktopFilter === 'visited') {
                                        // Сбросить фильтр и вернуться на главный экран
                                        setDesktopFilter('all');
                                        goHome();
                                    } else {
                                        setDesktopFilter('visited');
                                        setBrowsingLevel('locations');
                                    }
                                }}
                                className={`flex items-center gap-1.5 text-sm font-medium transition-all rounded-md px-2 py-1 hover:bg-green-50 dark:hover:bg-green-950/20 ${desktopFilter === 'visited' ? 'text-green-700 dark:text-green-500' : 'text-green-600 dark:text-green-500'
                                    }`}
                                aria-label="View visited places"
                            >
                                <Check className="w-4 h-4" /> {visitedCount}
                            </button>
                            <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-600" />
                            <button
                                onClick={() => {
                                    if (desktopFilter === 'wishlist') {
                                        // Сбросить фильтр и вернуться на главный экран
                                        setDesktopFilter('all');
                                        goHome();
                                    } else {
                                        setDesktopFilter('wishlist');
                                        setBrowsingLevel('locations');
                                    }
                                }}
                                className={`flex items-center gap-1.5 text-sm font-medium transition-all rounded-md px-2 py-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 ${desktopFilter === 'wishlist' ? 'text-rose-700 dark:text-rose-500' : 'text-rose-500 dark:text-rose-400'
                                    }`}
                                aria-label="View wishlist"
                            >
                                <Heart className="w-4 h-4" /> {wishlistCount}
                            </button>
                        </div>

                        {user?.role === 'admin' && (
                            <Link to={createPageUrl('Admin')}>
                                <button
                                    type="button"
                                    className="relative inline-flex items-center justify-center text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-white dark:hover:bg-neutral-800 rounded-full w-9 h-9 lg:w-10 lg:h-10 transition-colors"
                                    aria-label="Admin panel"
                                >
                                    <Settings className="w-4 h-4 lg:w-5 lg:h-5" />
                                    <span className="sr-only">Admin</span>
                                    {newFeedbackCount > 0 && (
                                        <div className="absolute inline-flex items-center justify-center w-5 h-5 lg:w-6 lg:h-6 text-[10px] lg:text-xs font-bold text-white bg-red-500 border-2 border-[#F2F2F7] dark:border-neutral-900 rounded-full -top-1 -end-1">
                                            {newFeedbackCount > 99 ? '99+' : newFeedbackCount}
                                        </div>
                                    )}
                                </button>
                            </Link>
                        )}

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setFeedbackOpen(true)}
                            className="rounded-full hover:bg-white dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 h-9 w-9 lg:h-10 lg:w-10 transition-all hover:shadow-sm"
                            title={t('feedback')}
                            aria-label="Open feedback form"
                        >
                            <MessageSquare className="w-4 h-4 lg:w-5 lg:h-5" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleTheme}
                            className="rounded-full hover:bg-white dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 h-9 w-9 lg:h-10 lg:w-10 transition-all hover:shadow-sm"
                            title={theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : theme === 'auto' ? 'Auto (Time-based)' : 'System'}
                            aria-label="Toggle theme"
                        >
                            {theme === 'light' && <Sun className="w-4 h-4 lg:w-5 lg:h-5" />}
                            {theme === 'dark' && <Moon className="w-4 h-4 lg:w-5 lg:h-5" />}
                            {theme === 'auto' && <Sparkles className="w-4 h-4 lg:w-5 lg:h-5" />}
                            {theme === 'system' && <Monitor className="w-4 h-4 lg:w-5 lg:h-5" />}
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={async () => {
                                await base44.auth.logout();
                                navigate('/');
                            }}
                            className="rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 h-9 w-9 lg:h-10 lg:w-10 transition-all hover:shadow-sm"
                            aria-label="Logout"
                        >
                            <LogOut className="w-4 h-4 lg:w-5 lg:h-5" />
                        </Button>

                        <Link to={createPageUrl('Profile')}>
                            <button
                                className="w-9 h-9 lg:w-10 lg:h-10 bg-neutral-200 rounded-full flex items-center justify-center border-2 border-white shadow-sm hover:bg-neutral-300 transition-colors"
                                aria-label="Open profile"
                            >
                                {user?.avatar_url ? (
                                    <img src={user.avatar_url} alt="User avatar" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <User className="w-4 h-4 lg:w-5 lg:h-5 text-neutral-500" />
                                )}
                            </button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Mobile Header */}
            <header className="md:hidden sticky top-0 z-40 bg-[#F2F2F7]/95 dark:bg-neutral-900/95 backdrop-blur-md px-5 py-2 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                    <Link to={createPageUrl("Home")} className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            G
                        </div>
                        <span className="text-base font-bold">GastroMap</span>
                    </Link>
                    <div className="flex items-center gap-1">
                        {user?.role === 'admin' && (
                            <Link to={createPageUrl('Admin')}>
                                <button
                                    type="button"
                                    className="relative inline-flex items-center justify-center text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-white dark:hover:bg-neutral-800 rounded-full w-9 h-9 transition-colors"
                                    aria-label="Admin panel"
                                >
                                    <Settings className="w-5 h-5 pointer-events-none" />
                                    <span className="sr-only">Admin</span>
                                    {newFeedbackCount > 0 && (
                                        <div className="absolute inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 border-2 border-[#F2F2F7] dark:border-neutral-900 rounded-full -top-1 -end-1 pointer-events-none">
                                            {newFeedbackCount > 99 ? '99+' : newFeedbackCount}
                                        </div>
                                    )}
                                </button>
                            </Link>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setFeedbackOpen(true)}
                            className="hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            aria-label="Open feedback form"
                        >
                            <MessageSquare className="w-5 h-5 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleTheme}
                            className="hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            aria-label="Toggle theme"
                        >
                            {theme === 'light' && <Sun className="w-5 h-5 text-neutral-400 dark:text-neutral-500 pointer-events-none" />}
                            {theme === 'dark' && <Moon className="w-5 h-5 text-neutral-400 dark:text-neutral-500 pointer-events-none" />}
                            {theme === 'auto' && <Sparkles className="w-5 h-5 text-neutral-400 dark:text-neutral-500 pointer-events-none" />}
                            {theme === 'system' && <Monitor className="w-5 h-5 text-neutral-400 dark:text-neutral-500 pointer-events-none" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={async () => {
                                await base44.auth.logout();
                                navigate('/');
                            }}
                            className="hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            aria-label="Logout"
                        >
                            <LogOut className="w-5 h-5 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
                        </Button>
                        <Link to={createPageUrl('Profile')}>
                            <button
                                className="w-9 h-9 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-all hover:shadow-md"
                                aria-label="Open profile"
                            >
                                {user?.avatar_url ? (
                                    <img src={user.avatar_url} alt="User avatar" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <User className="w-5 h-5 text-neutral-500 dark:text-neutral-300" />
                                )}
                            </button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto px-4 md:px-8 py-0">
                {/* Desktop: Breadcrumbs, Search & Filters - with Active Filters Display */}
                <div className="hidden md:flex flex-col gap-3 mb-4">
                    {/* Breadcrumbs + Search & AI Guide Row */}
                    <div className="flex items-center justify-between gap-4">
                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                            <button onClick={goHome} className={`hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors rounded px-1 py-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 ${browsingLevel === 'countries' ? 'font-semibold text-neutral-900 dark:text-neutral-100' : ''}`}>
                                {t('world')}
                            </button>
                            {selectedCountry && (
                                <>
                                    <span className="text-neutral-300 dark:text-neutral-600">/</span>
                                    <button onClick={() => {
                                        setSelectedCity(null);
                                        setBrowsingLevel('cities');
                                    }} className={`hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors rounded px-1 py-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 ${browsingLevel === 'cities' ? 'font-semibold text-neutral-900 dark:text-neutral-100' : ''}`}>
                                        {selectedCountry}
                                    </button>
                                </>
                            )}
                            {selectedCity && (
                                <>
                                    <span className="text-neutral-300 dark:text-neutral-600">/</span>
                                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">{selectedCity}</span>
                                </>
                            )}
                        </div>

                        {/* Search, AI Guide & Filters */}
                        <div className="flex items-center gap-3">
                            {/* Desktop Search with Autocomplete */}
                            <div className="w-72">
                                <SearchAutocomplete
                                    locations={locations}
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    placeholder={t('search')}
                                    className="bg-white text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500 border-neutral-200 shadow-sm rounded-xl h-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* AI Guide Button */}
                            <Button
                                onClick={() => setAiAssistantOpen(true)}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl h-10 px-4 shadow-sm hover:shadow-md transition-all shrink-0"
                                aria-label="Open AI Guide"
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                {t('aiGuide')}
                            </Button>

                            {/* Filters Button */}
                            <Button
                                variant="outline"
                                onClick={() => setShowFilters(true)}
                                className="h-10 px-4 rounded-xl bg-white !text-neutral-900 hover:!text-neutral-900 dark:bg-neutral-800 dark:!text-neutral-100 dark:hover:!text-neutral-100 dark:border-neutral-700 relative shrink-0"
                                aria-label="Open filters"
                            >
                                <SlidersHorizontal className="w-4 h-4 mr-2" />
                                {t('filters')}
                                {activeFiltersCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Active Filters Display (Desktop) */}
                    {activeFiltersCount > 0 && (
                        <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Active filters:</span>
                            {filterType !== 'all' && (
                                <Badge
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-red-100 transition-colors"
                                    onClick={() => setFilterType('all')}
                                >
                                    {filterType} <X className="w-3 h-3 ml-1" />
                                </Badge>
                            )}
                            {!(filterPriceRange[0] === 1 && filterPriceRange[1] === 4) && (
                                <Badge
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-red-100 transition-colors"
                                    onClick={() => setFilterPriceRange([1, 4])}
                                >
                                    {'$'.repeat(filterPriceRange[0])} - {'$'.repeat(filterPriceRange[1])} <X className="w-3 h-3 ml-1" />
                                </Badge>
                            )}
                            {filterRating > 0 && (
                                <Badge
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-red-100 transition-colors"
                                    onClick={() => setFilterRating(0)}
                                >
                                    ⭐ {filterRating}+ <X className="w-3 h-3 ml-1" />
                                </Badge>
                            )}
                            {filterLabels.map(labelId => {
                                const label = specialLabels.find(l => l.id === labelId);
                                return label ? (
                                    <Badge
                                        key={labelId}
                                        variant="secondary"
                                        className="cursor-pointer hover:bg-red-100 transition-colors"
                                        onClick={() => setFilterLabels(filterLabels.filter(l => l !== labelId))}
                                    >
                                        {label.emoji} {label.label} <X className="w-3 h-3 ml-1" />
                                    </Badge>
                                ) : null;
                            })}
                            {searchRadius !== 10 && (
                                <Badge
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-red-100 transition-colors"
                                    onClick={() => setSearchRadius(10)}
                                >
                                    📍 {searchRadius}km <X className="w-3 h-3 ml-1" />
                                </Badge>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetFilters}
                                className="h-7 text-xs"
                            >
                                Clear all
                            </Button>
                        </div>
                    )}
                </div>



                {/* Content Area */}
                <div className="relative">
                    {loadingLocations ? (
                        <>
                            {/* Skeleton Screens for Loading */}
                            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="space-y-3">
                                        <Skeleton className="h-64 w-full rounded-3xl" />
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                ))}
                            </div>
                            <div className="md:hidden space-y-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="space-y-3">
                                        <Skeleton className="h-40 w-full rounded-2xl" />
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Mobile View */}
                            <div className="md:hidden min-h-[50vh]">
                                {mobileTab === 'ai' ? (
                                    <div className="fixed inset-0 top-[68px] bottom-16 z-[5] bg-[#F2F2F7] dark:bg-neutral-900">
                                        <AIAssistant
                                            allLocations={locations}
                                            savedLocations={savedLocations}
                                            user={user}
                                            onSave={handleSave}
                                            onUpdate={handleUpdate}
                                            isOpen={true}
                                            onOpenChange={() => { }}
                                            showFloatingButton={false}
                                            userLocation={userLocation}
                                        />
                                    </div>
                                ) : mobileTab === 'map' ? (
                                    <div className="fixed inset-0 top-[68px] bottom-16 z-[5]">
                                        <WorldMap locations={filteredLocations} savedLocations={savedLocations} onLocationClick={setSelectedLocation} />
                                    </div>
                                ) : (
                                    <div className="space-y-4 pb-20">
                                        {/* Search and AI Guide for non-map tabs */}
                                        <div className="relative space-y-2 px-4 pt-2">
                                            <SearchAutocomplete
                                                locations={locations}
                                                value={searchQuery}
                                                onChange={setSearchQuery}
                                                placeholder={t('search')}
                                                className="bg-white text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500 border-neutral-200 shadow-sm rounded-xl h-11 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            {(user?.role === 'creator' || user?.custom_role === 'creator') && (
                                                <div className="flex gap-2">
                                                    <Link to={createPageUrl('CreatorTools')} className="flex-1 relative">
                                                        <Button
                                                            variant="outline"
                                                            className="w-full rounded-xl h-9 text-xs font-medium px-2"
                                                        >
                                                            <BarChart3 className="w-3.5 h-3.5 mr-1" />
                                                            Contribution
                                                            {creatorTasksCount > 0 && (
                                                                <span className="ml-1 bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0 rounded-full">
                                                                    {creatorTasksCount > 99 ? '99+' : creatorTasksCount}
                                                                </span>
                                                            )}
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        onClick={() => setShowLocationForm(true)}
                                                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl h-9 text-xs font-medium shadow-sm px-2"
                                                    >
                                                        <Plus className="w-3.5 h-3.5 mr-1" />
                                                        Add
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Breadcrumbs & Filters (Mobile) - Moved below search */}
                                        <div className="px-4 space-y-3">
                                            <div className="flex items-center justify-between gap-4">
                                                {/* Breadcrumbs */}
                                                <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 flex-1 min-w-0 overflow-hidden">
                                                    <button onClick={goHome} className={`hover:text-neutral-900 dark:hover:text-neutral-100 shrink-0 ${browsingLevel === 'countries' ? 'font-semibold text-neutral-900 dark:text-neutral-100' : ''}`}>
                                                        {t('world')}
                                                    </button>
                                                    {selectedCountry && (
                                                        <>
                                                            <span className="text-neutral-300 dark:text-neutral-600 shrink-0">/</span>
                                                            <button onClick={() => {
                                                                setSelectedCity(null);
                                                                setBrowsingLevel('cities');
                                                            }} className={`hover:text-neutral-900 dark:hover:text-neutral-100 truncate ${browsingLevel === 'cities' ? 'font-semibold text-neutral-900 dark:text-neutral-100' : ''}`}>
                                                                {selectedCountry}
                                                            </button>
                                                        </>
                                                    )}
                                                    {selectedCity && (
                                                        <>
                                                            <span className="text-neutral-300 dark:text-neutral-600 shrink-0">/</span>
                                                            <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">{selectedCity}</span>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Filter Button */}
                                                <div className="shrink-0">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setShowFilters(true)}
                                                        className="h-10 px-3 rounded-xl bg-white !text-neutral-900 hover:!text-neutral-900 dark:bg-neutral-800 dark:!text-neutral-100 dark:hover:!text-neutral-100 dark:border-neutral-700 relative"
                                                    >
                                                        <SlidersHorizontal className="w-4 h-4" />
                                                        {activeFiltersCount > 0 && (
                                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                                                {activeFiltersCount}
                                                            </span>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Active Filters Display (Mobile) */}
                                            {activeFiltersCount > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {filterType !== 'all' && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="cursor-pointer hover:bg-red-100 transition-colors text-xs"
                                                            onClick={() => setFilterType('all')}
                                                        >
                                                            {filterType} <X className="w-3 h-3 ml-1" />
                                                        </Badge>
                                                    )}
                                                    {filterPriceRange !== 'all' && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="cursor-pointer hover:bg-red-100 transition-colors text-xs"
                                                            onClick={() => setFilterPriceRange('all')}
                                                        >
                                                            {filterPriceRange} <X className="w-3 h-3 ml-1" />
                                                        </Badge>
                                                    )}
                                                    {filterRating > 0 && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="cursor-pointer hover:bg-red-100 transition-colors text-xs"
                                                            onClick={() => setFilterRating(0)}
                                                        >
                                                            ⭐ {filterRating}+ <X className="w-3 h-3 ml-1" />
                                                        </Badge>
                                                    )}
                                                    {filterLabels.map(labelId => {
                                                        const label = specialLabels.find(l => l.id === labelId);
                                                        return label ? (
                                                            <Badge
                                                                key={labelId}
                                                                variant="secondary"
                                                                className="cursor-pointer hover:bg-red-100 transition-colors text-xs"
                                                                onClick={() => setFilterLabels(filterLabels.filter(l => l !== labelId))}
                                                            >
                                                                {label.emoji} {label.label} <X className="w-3 h-3 ml-1" />
                                                            </Badge>
                                                        ) : null;
                                                    })}
                                                    {searchRadius !== null && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="cursor-pointer hover:bg-red-100 transition-colors text-xs"
                                                            onClick={() => setSearchRadius(null)}
                                                        >
                                                            📍 {searchRadius}km <X className="w-3 h-3 ml-1" />
                                                        </Badge>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={resetFilters}
                                                        className="h-6 text-xs px-2"
                                                    >
                                                        Clear all
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {/* HIERARCHY FOR MOBILE */}

                                        {/* Mobile: Explore by Country */}
                                        {!searchQuery && browsingLevel === 'countries' && mobileTab === 'discover' && showPersonalizedSections && (
                                            <div className="space-y-6 px-4">
                                                {/* 1. Explore by Country */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <Globe className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                                                            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                                                                {t('exploreByCountry') || 'Исследовать по странам'}
                                                            </h2>
                                                        </div>
                                                        {countryData.length > 5 && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setShowAllCountries(!showAllCountries)}
                                                                className="flex items-center gap-1 text-xs h-8 px-2"
                                                            >
                                                                {showAllCountries ? 'Less' : `All (${countryData.length})`}
                                                                <ChevronDown className={`w-3 h-3 transition-transform ${showAllCountries ? 'rotate-180' : ''}`} />
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-4">
                                                        {(showAllCountries ? countryData : countryData.slice(0, 5)).map(country => (
                                                            <div
                                                                key={country.name}
                                                                onClick={() => country.isActive && !country.isComingSoon && selectCountry(country.name)}
                                                                className={`group relative h-40 rounded-2xl overflow-hidden shadow-sm transition-all ${country.isActive && !country.isComingSoon
                                                                        ? 'cursor-pointer active:scale-[0.98]'
                                                                        : 'cursor-not-allowed opacity-60'
                                                                    }`}
                                                            >
                                                                <img src={country.image} alt={country.name} loading="lazy" className="w-full h-full object-cover" />
                                                                <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent ${(!country.isActive || country.isComingSoon) && 'bg-black/40'}`} />
                                                                {!country.isActive && !country.isComingSoon && (user?.role === 'admin' || user?.custom_role === 'admin' || user?.role === 'creator' || user?.custom_role === 'creator') && (
                                                                    <div className="absolute top-3 right-3">
                                                                        <Badge className="bg-red-500 text-white border-none shadow-lg px-2.5 py-1 text-xs font-bold">
                                                                            Not Active
                                                                        </Badge>
                                                                    </div>
                                                                )}
                                                                {country.isComingSoon && (
                                                                    <div className="absolute top-3 right-3">
                                                                        <Badge className="bg-amber-500 text-white border-none shadow-lg px-2.5 py-1 text-xs font-bold">
                                                                            {t('comingSoon')}
                                                                        </Badge>
                                                                    </div>
                                                                )}
                                                                {country.isActive && !country.isComingSoon && country.newCount > 0 && (
                                                                    <div className="absolute top-3 right-3">
                                                                        <Badge className="bg-blue-500 text-white border-none shadow-lg px-2.5 py-1 text-xs font-bold">
                                                                            +{country.newCount} {t('new')}
                                                                        </Badge>
                                                                    </div>
                                                                )}
                                                                <div className="absolute bottom-0 left-0 p-4">
                                                                    <h3 className="text-xl font-bold text-white">{country.localizedName}</h3>
                                                                    <p className="text-white/80 text-xs font-medium flex items-center gap-1.5 mt-1">
                                                                        <MapPin className="w-3 h-3" />
                                                                        {country.citiesCount} {t('cities')} • {country.count} {t('places')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* 2. Recommended for You (Mobile) */}
                                                {getPersonalizedRecommendations.length > 0 && (
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <Sparkles className="w-5 h-5 text-purple-600" />
                                                            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                                                                {t('recommendedForYou') || 'Рекомендовано для вас'}
                                                            </h2>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {getPersonalizedRecommendations.map(location => (
                                                                <MobileLocationCard
                                                                    key={location.id}
                                                                    location={location}
                                                                    savedLocation={savedLocations.find(s => s.location_id === location.id)}
                                                                    onSave={handleSave}
                                                                    onOpenDetail={setSelectedLocation}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* 3. New in Your Cities (Mobile) */}
                                                {newInFavoriteCities.length > 0 && (
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <MapPin className="w-5 h-5 text-blue-600" />
                                                            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                                                                {t('newInYourCities') || 'Новое в ваших городах'}
                                                            </h2>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {newInFavoriteCities.map(location => (
                                                                <MobileLocationCard
                                                                    key={location.id}
                                                                    location={location}
                                                                    savedLocation={savedLocations.find(s => s.location_id === location.id)}
                                                                    onSave={handleSave}
                                                                    onOpenDetail={setSelectedLocation}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Countries without personalized sections (Mobile) */}
                                        {!searchQuery && browsingLevel === 'countries' && mobileTab === 'discover' && !showPersonalizedSections && (
                                            <div className="grid grid-cols-1 gap-4 px-4">
                                                {countryData.map((country, index) => (
                                                    <div
                                                        key={country.name}
                                                        onClick={() => country.isActive && !country.isComingSoon && selectCountry(country.name)}
                                                        className={`group relative h-40 rounded-2xl overflow-hidden shadow-sm transition-all ${country.isActive && !country.isComingSoon
                                                                ? 'cursor-pointer active:scale-[0.98]'
                                                                : 'cursor-not-allowed opacity-60'
                                                            }`}
                                                    >
                                                        <img src={country.image} alt={country.name} loading="lazy" className="w-full h-full object-cover" />
                                                        <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent ${(!country.isActive || country.isComingSoon) && 'bg-black/40'}`} />
                                                        {!country.isActive && !country.isComingSoon && (user?.role === 'admin' || user?.custom_role === 'admin' || user?.role === 'creator' || user?.custom_role === 'creator') && (
                                                            <div className="absolute top-3 right-3">
                                                                <Badge className="bg-red-500 text-white border-none shadow-lg px-2.5 py-1 text-xs font-bold">
                                                                    Not Active
                                                                </Badge>
                                                            </div>
                                                        )}
                                                        {country.isComingSoon && (
                                                            <div className="absolute top-3 right-3">
                                                                <Badge className="bg-amber-500 text-white border-none shadow-lg px-2.5 py-1 text-xs font-bold">
                                                                    {t('comingSoon')}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                        {country.isActive && !country.isComingSoon && country.newCount > 0 && (
                                                            <div className="absolute top-3 right-3">
                                                                <Badge className="bg-blue-500 text-white border-none shadow-lg px-2.5 py-1 text-xs font-bold">
                                                                    +{country.newCount} {t('new')}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                        <div className="absolute bottom-0 left-0 p-4">
                                                            <h3 className="text-xl font-bold text-white">{country.localizedName}</h3>
                                                            <p className="text-white/80 text-xs font-medium flex items-center gap-1.5 mt-1">
                                                                <MapPin className="w-3 h-3" />
                                                                {country.citiesCount} {t('cities')} • {country.count} {t('places')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* 2. Cities List Mobile */}
                                        {!searchQuery && browsingLevel === 'cities' && mobileTab === 'discover' && (
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="px-1 mb-2">
                                                    <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{selectedCountry}</h2>
                                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('selectCity')}</p>
                                                </div>
                                                {cityData.map((city, index) => (
                                                    <div
                                                        key={city.name}
                                                        onClick={() => city.isActive && !city.isComingSoon && selectCity(city.name)}
                                                        className={`group relative h-40 rounded-2xl overflow-hidden shadow-sm transition-all ${city.isActive && !city.isComingSoon
                                                                ? 'cursor-pointer active:scale-[0.98]'
                                                                : 'cursor-not-allowed opacity-60'
                                                            }`}
                                                    >
                                                        <img
                                                            src={city.image}
                                                            alt={city.name}
                                                            loading={index < 4 ? "eager" : "lazy"}
                                                            fetchPriority={index < 2 ? "high" : "auto"}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent ${(!city.isActive || city.isComingSoon) && 'bg-black/40'}`} />
                                                        {!city.isActive && !city.isComingSoon && (user?.role === 'admin' || user?.custom_role === 'admin' || user?.role === 'creator' || user?.custom_role === 'creator') && (
                                                            <div className="absolute top-3 right-3">
                                                                <Badge className="bg-red-500 text-white border-none shadow-lg px-2.5 py-1 text-xs font-bold">
                                                                    Not Active
                                                                </Badge>
                                                            </div>
                                                        )}
                                                        {city.isComingSoon && (
                                                            <div className="absolute top-3 right-3">
                                                                <Badge className="bg-amber-500 text-white border-none shadow-lg px-2.5 py-1 text-xs font-bold">
                                                                    {t('comingSoon')}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                        {city.isActive && !city.isComingSoon && city.newCount > 0 && (
                                                            <div className="absolute top-3 right-3">
                                                                <Badge className="bg-blue-500 text-white border-none shadow-lg px-2.5 py-1 text-xs font-bold">
                                                                    +{city.newCount} {t('new')}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                        <div className="absolute bottom-0 left-0 p-4">
                                                            <h3 className="text-xl font-bold text-white">{city.localizedName}</h3>
                                                            <p className="text-white/80 text-xs font-medium flex items-center gap-1.5 mt-1">
                                                                <MapPin className="w-3 h-3" />
                                                                {city.count} {t('places')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* 3. Locations List Mobile */}
                                        {(searchQuery || browsingLevel === 'locations' || mobileTab !== 'discover') && (
                                            <div className="px-4">
                                                {browsingLevel === 'locations' && !searchQuery && mobileTab === 'discover' && (
                                                    <div className="mb-4">
                                                        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{selectedCity}</h2>
                                                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('bestPlaces')}</p>
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-2 gap-3">
                                                    {filteredLocations.map(location => (
                                                        <MobileLocationCard
                                                            key={location.id}
                                                            location={location}
                                                            savedLocation={savedLocations.find(s => s.location_id === location.id)}
                                                            onSave={handleSave}
                                                            onOpenDetail={setSelectedLocation}
                                                        />
                                                    ))}
                                                </div>
                                                {filteredLocations.length === 0 && (
                                                    <div className="col-span-2 py-10 text-center space-y-4">
                                                        <p className="text-neutral-700 dark:text-neutral-300 font-medium text-lg">{t('nothingFound')}</p>
                                                        {searchQuery && (
                                                            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                                                                {t('tryDifferentSearch') || `Попробуйте изменить поисковый запрос: "${searchQuery}"`}
                                                            </p>
                                                        )}
                                                        {activeFiltersCount > 0 && !searchQuery && (
                                                            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                                                                {t('noResultsWithFilters') || 'Нет результатов с выбранными фильтрами. Попробуйте сбросить фильтры.'}
                                                            </p>
                                                        )}
                                                        <div className="flex flex-col gap-2 items-center">
                                                            {activeFiltersCount > 0 && (
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={resetFilters}
                                                                    className="rounded-xl"
                                                                    aria-label="Clear all filters"
                                                                >
                                                                    {t('clearFilters') || 'Сбросить фильтры'}
                                                                </Button>
                                                            )}
                                                            {searchQuery && (
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => setSearchQuery('')}
                                                                    className="rounded-xl"
                                                                    aria-label="Clear search"
                                                                >
                                                                    {t('clearSearch') || 'Очистить поиск'}
                                                                </Button>
                                                            )}
                                                            {(selectedCountry || selectedCity) && (
                                                                <Button
                                                                    variant="ghost"
                                                                    onClick={goHome}
                                                                    className="rounded-xl"
                                                                    aria-label="Back to world view"
                                                                >
                                                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                                                    {t('backToWorld') || 'Вернуться к странам'}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Desktop View */}
                            <div className="hidden md:block">
                                {view === 'grid' ? (
                                    <>
                                        {/* Персонализированные секции */}
                                        {showPersonalizedSections && (
                                            <div className="space-y-10 mb-12">
                                                {/* 1. Explore by Country */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-6">
                                                        <div className="flex items-center gap-3">
                                                            <Globe className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                                                            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                                                                {t('exploreByCountry') || 'Исследовать по странам'}
                                                            </h2>
                                                        </div>
                                                        {countryData.length > 5 && (
                                                            <Button
                                                                variant="ghost"
                                                                onClick={() => setShowAllCountries(!showAllCountries)}
                                                                className="flex items-center gap-2 text-sm"
                                                            >
                                                                {showAllCountries ? 'Show less' : `Show all (${countryData.length})`}
                                                                <ChevronDown className={`w-4 h-4 transition-transform ${showAllCountries ? 'rotate-180' : ''}`} />
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                                                    >
                                                        {(showAllCountries ? countryData : countryData.slice(0, 5)).map(country => (
                                                            <div
                                                                key={country.name}
                                                                onClick={() => country.isActive && !country.isComingSoon && selectCountry(country.name)}
                                                                className={`group relative h-64 rounded-3xl overflow-hidden shadow-sm transition-all duration-300 ${country.isActive && !country.isComingSoon
                                                                        ? 'cursor-pointer hover:shadow-xl'
                                                                        : 'cursor-not-allowed opacity-60'
                                                                    }`}
                                                            >
                                                                <img src={country.image} alt={country.name} loading="lazy" className={`w-full h-full object-cover transition-transform duration-700 ${country.isActive && !country.isComingSoon && 'group-hover:scale-105'}`} />
                                                                <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent ${(!country.isActive || country.isComingSoon) && 'bg-black/40'}`} />
                                                                {!country.isActive && !country.isComingSoon && (user?.role === 'admin' || user?.custom_role === 'admin' || user?.role === 'creator' || user?.custom_role === 'creator') && (
                                                                    <div className="absolute top-4 right-4">
                                                                        <Badge className="bg-red-500 text-white border-none shadow-lg px-3 py-1.5 text-sm font-bold">
                                                                            Not Active
                                                                        </Badge>
                                                                    </div>
                                                                )}
                                                                {country.isComingSoon && (
                                                                    <div className="absolute top-4 right-4">
                                                                        <Badge className="bg-amber-500 text-white border-none shadow-lg px-3 py-1.5 text-sm font-bold">
                                                                            {t('comingSoon')}
                                                                        </Badge>
                                                                    </div>
                                                                )}
                                                                {country.isActive && !country.isComingSoon && country.newCount > 0 && (
                                                                    <div className="absolute top-4 right-4">
                                                                        <Badge className="bg-blue-500 text-white border-none shadow-lg px-3 py-1.5 text-sm font-bold">
                                                                            +{country.newCount} {t('new')}
                                                                        </Badge>
                                                                    </div>
                                                                )}
                                                                <div className="absolute bottom-0 left-0 p-6">
                                                                    <h3 className="text-2xl font-bold text-white mb-1">{country.localizedName}</h3>
                                                                    <p className="text-white/80 text-sm font-medium flex items-center gap-2">
                                                                        <MapPin className="w-4 h-4" />
                                                                        {country.citiesCount} {t('cities')} • {country.count} {t('places')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </motion.div>
                                                </div>

                                                {/* 2. Рекомендовано для вас */}
                                                {getPersonalizedRecommendations.length > 0 && (
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-6">
                                                            <Sparkles className="w-6 h-6 text-purple-600" />
                                                            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                                                                {t('recommendedForYou') || 'Рекомендовано для вас'}
                                                            </h2>
                                                        </div>
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.1 }}
                                                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                                                        >
                                                            {getPersonalizedRecommendations.map(location => (
                                                                <LocationCard
                                                                    key={location.id}
                                                                    location={location}
                                                                    savedLocation={savedLocations.find(s => s.location_id === location.id)}
                                                                    onSave={handleSave}
                                                                    onUpdate={handleUpdate}
                                                                    user={user}
                                                                />
                                                            ))}
                                                        </motion.div>
                                                    </div>
                                                )}

                                                {/* 3. Новые места в любимых городах */}
                                                {newInFavoriteCities.length > 0 && (
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-6">
                                                            <MapPin className="w-6 h-6 text-blue-600" />
                                                            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                                                                {t('newInYourCities') || 'Новое в ваших городах'}
                                                            </h2>
                                                        </div>
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.2 }}
                                                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                                                        >
                                                            {newInFavoriteCities.map(location => (
                                                                <LocationCard
                                                                    key={location.id}
                                                                    location={location}
                                                                    savedLocation={savedLocations.find(s => s.location_id === location.id)}
                                                                    onSave={handleSave}
                                                                    onUpdate={handleUpdate}
                                                                    user={user}
                                                                />
                                                            ))}
                                                        </motion.div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* HIERARCHY VIEW: COUNTRIES */}
                                        {!searchQuery && browsingLevel === 'countries' && mobileTab === 'discover' && (
                                            <motion.div
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                                            >
                                                {countryData.map((country, index) => (
                                                    <div
                                                        key={country.name}
                                                        onClick={() => country.isActive && !country.isComingSoon && selectCountry(country.name)}
                                                        className={`group relative h-64 rounded-3xl overflow-hidden shadow-sm transition-all duration-300 ${country.isActive && !country.isComingSoon
                                                                ? 'cursor-pointer hover:shadow-xl'
                                                                : 'cursor-not-allowed opacity-60'
                                                            }`}
                                                    >
                                                        <img src={country.image} alt={country.name} loading="lazy" className={`w-full h-full object-cover transition-transform duration-700 ${country.isActive && !country.isComingSoon && 'group-hover:scale-105'}`} />
                                                        <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent ${(!country.isActive || country.isComingSoon) && 'bg-black/40'}`} />
                                                        {!country.isActive && !country.isComingSoon && (user?.role === 'admin' || user?.custom_role === 'admin' || user?.role === 'creator' || user?.custom_role === 'creator') && (
                                                            <div className="absolute top-4 right-4">
                                                                <Badge className="bg-red-500 text-white border-none shadow-lg px-3 py-1.5 text-sm font-bold">
                                                                    Not Active
                                                                </Badge>
                                                            </div>
                                                        )}
                                                        {country.isComingSoon && (
                                                            <div className="absolute top-4 right-4">
                                                                <Badge className="bg-amber-500 text-white border-none shadow-lg px-3 py-1.5 text-sm font-bold">
                                                                    {t('comingSoon')}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                        {country.isActive && !country.isComingSoon && country.newCount > 0 && (
                                                            <div className="absolute top-4 right-4">
                                                                <Badge className="bg-blue-500 text-white border-none shadow-lg px-3 py-1.5 text-sm font-bold">
                                                                    +{country.newCount} {t('new')}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                        <div className="absolute bottom-0 left-0 p-6">
                                                            <h3 className="text-2xl font-bold text-white mb-1">{country.localizedName}</h3>
                                                            <p className="text-white/80 text-sm font-medium flex items-center gap-2">
                                                                <MapPin className="w-4 h-4" />
                                                                {country.citiesCount} {t('cities')} • {country.count} {t('places')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}

                                        {/* HIERARCHY VIEW: CITIES */}
                                        {!searchQuery && browsingLevel === 'cities' && mobileTab === 'discover' && (
                                            <motion.div
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                                            >
                                                {cityData.map((city, index) => (
                                                    <div
                                                        key={city.name}
                                                        onClick={() => city.isActive && !city.isComingSoon && selectCity(city.name)}
                                                        className={`group relative h-64 rounded-3xl overflow-hidden shadow-sm transition-all duration-300 ${city.isActive && !city.isComingSoon
                                                                ? 'cursor-pointer hover:shadow-xl'
                                                                : 'cursor-not-allowed opacity-60'
                                                            }`}
                                                    >
                                                        <img
                                                            src={city.image}
                                                            alt={city.name}
                                                            loading={index < 4 ? "eager" : "lazy"}
                                                            fetchPriority={index < 2 ? "high" : "auto"}
                                                            className={`w-full h-full object-cover transition-transform duration-700 ${city.isActive && !city.isComingSoon && 'group-hover:scale-105'}`}
                                                        />
                                                        <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent ${(!city.isActive || city.isComingSoon) && 'bg-black/40'}`} />
                                                        {!city.isActive && !city.isComingSoon && (user?.role === 'admin' || user?.custom_role === 'admin' || user?.role === 'creator' || user?.custom_role === 'creator') && (
                                                            <div className="absolute top-4 right-4">
                                                                <Badge className="bg-red-500 text-white border-none shadow-lg px-3 py-1.5 text-sm font-bold">
                                                                    Not Active
                                                                </Badge>
                                                            </div>
                                                        )}
                                                        {city.isComingSoon && (
                                                            <div className="absolute top-4 right-4">
                                                                <Badge className="bg-amber-500 text-white border-none shadow-lg px-3 py-1.5 text-sm font-bold">
                                                                    {t('comingSoon')}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                        {city.isActive && !city.isComingSoon && city.newCount > 0 && (
                                                            <div className="absolute top-4 right-4">
                                                                <Badge className="bg-blue-500 text-white border-none shadow-lg px-3 py-1.5 text-sm font-bold">
                                                                    +{city.newCount} {t('new')}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                        <div className="absolute bottom-0 left-0 p-6">
                                                            <h3 className="text-2xl font-bold text-white mb-1">{city.localizedName}</h3>
                                                            <p className="text-white/80 text-sm font-medium flex items-center gap-2">
                                                                <MapPin className="w-4 h-4" />
                                                                {city.count} {t('places')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}

                                        {/* LOCATIONS VIEW (Browsing Locations OR Search OR Saved/Visited Tabs) */}
                                        {(searchQuery || browsingLevel === 'locations' || mobileTab !== 'discover') && (
                                            <motion.div
                                                layout
                                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                                            >
                                                {filteredLocations.length > 0 ? filteredLocations.map(location => (
                                                    <LocationCard
                                                        key={location.id}
                                                        location={location}
                                                        savedLocation={savedLocations.find(s => s.location_id === location.id)}
                                                        onSave={handleSave}
                                                        onUpdate={handleUpdate}
                                                        user={user}
                                                    />
                                                )) : (
                                                    <div className="col-span-full py-20 text-center space-y-4">
                                                        <p className="text-neutral-700 dark:text-neutral-300 font-medium text-xl">{t('nothingFound')}</p>
                                                        {searchQuery && (
                                                            <p className="text-neutral-500 dark:text-neutral-400">
                                                                {t('tryDifferentSearch') || `Попробуйте изменить поисковый запрос: "${searchQuery}"`}
                                                            </p>
                                                        )}
                                                        {activeFiltersCount > 0 && !searchQuery && (
                                                            <p className="text-neutral-500 dark:text-neutral-400">
                                                                {t('noResultsWithFilters') || 'Нет результатов с выбранными фильтрами. Попробуйте сбросить фильтры.'}
                                                            </p>
                                                        )}
                                                        <div className="flex gap-3 justify-center flex-wrap">
                                                            {activeFiltersCount > 0 && (
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={resetFilters}
                                                                    className="rounded-full"
                                                                    aria-label="Clear all filters"
                                                                >
                                                                    {t('clearFilters') || 'Сбросить фильтры'}
                                                                </Button>
                                                            )}
                                                            {searchQuery && (
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => setSearchQuery('')}
                                                                    className="rounded-full"
                                                                    aria-label="Clear search"
                                                                >
                                                                    {t('clearSearch') || 'Очистить поиск'}
                                                                </Button>
                                                            )}
                                                            {(selectedCountry || selectedCity) && (
                                                                <Button
                                                                    variant="ghost"
                                                                    onClick={goHome}
                                                                    className="rounded-full"
                                                                    aria-label="Back to world view"
                                                                >
                                                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                                                    {t('backToWorld') || 'Вернуться к странам'}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </>
                                ) : (
                                    <div className="h-[calc(100vh-180px)] rounded-[2.5rem] overflow-hidden shadow-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
                                        <WorldMap
                                            locations={filteredLocations}
                                            savedLocations={savedLocations}
                                            onLocationClick={setSelectedLocation}
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Mobile Bottom Nav */}
            <MobileBottomNav activeTab={mobileTab} onTabChange={setMobileTab} />

            {/* AI Assistant - Desktop Only */}
            <div className="hidden md:block">
                <AIAssistant
                    allLocations={locations}
                    savedLocations={savedLocations}
                    user={user}
                    onSave={handleSave}
                    onUpdate={handleUpdate}
                    isOpen={aiAssistantOpen}
                    onOpenChange={setAiAssistantOpen}
                    showFloatingButton={false}
                    userLocation={userLocation}
                />
            </div>

            <FeedbackModal
                isOpen={feedbackOpen}
                onOpenChange={setFeedbackOpen}
                user={user}
            />

            {(user?.role === 'creator' || user?.custom_role === 'creator') && (
                <CreatorLocationForm
                    isOpen={showLocationForm}
                    onOpenChange={setShowLocationForm}
                    user={user}
                    onSuccess={() => {
                        queryClient.invalidateQueries(['locations']);
                        setShowLocationForm(false);
                    }}
                />
            )}

            {/* Location Detail Modal (Desktop Map) */}
            {selectedLocation && view === 'map' && (
                <LocationCard
                    location={selectedLocation}
                    savedLocation={savedLocations.find(s => s.location_id === selectedLocation.id)}
                    onSave={handleSave}
                    onUpdate={handleUpdate}
                    user={user}
                    isOpen={true}
                    onOpenChange={(open) => !open && setSelectedLocation(null)}
                />
            )}

            {/* Filters Panel (Mobile & Desktop) */}
            {showFilters && (
                <div className="fixed inset-0 bg-black/50 z-[10000] flex items-end md:items-center md:justify-center" onClick={() => setShowFilters(false)}>
                    <motion.div
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full md:w-[600px] bg-white dark:bg-neutral-800 rounded-t-3xl md:rounded-3xl max-h-[85vh] overflow-y-auto"
                    >
                        <div className="sticky top-0 z-10 bg-white dark:bg-neutral-800 flex items-center justify-between px-6 py-4 rounded-t-3xl md:rounded-t-3xl border-b border-neutral-100 dark:border-neutral-700">
                            <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{t('filters') || 'Фильтры'}</h3>
                            <button
                                onClick={() => setShowFilters(false)}
                                className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                                aria-label="Close filters"
                            >
                                <X className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
                            </button>
                        </div>

                        <div className="px-6 pt-6 space-y-6">
                            {/* Type Filter */}
                            <div>
                                <label className="text-sm font-medium text-neutral-900 dark:text-neutral-300 mb-3 block">{t('type') || 'Тип заведения'}</label>
                                <Select value={filterType} onValueChange={setFilterType}>
                                    <SelectTrigger className="w-full h-12 rounded-xl bg-neutral-50 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('allTypes') || 'Все типы'}</SelectItem>
                                        <SelectItem value="cafe">Cafe</SelectItem>
                                        <SelectItem value="bar">Bar</SelectItem>
                                        <SelectItem value="restaurant">Restaurant</SelectItem>
                                        <SelectItem value="market">Market</SelectItem>
                                        <SelectItem value="shop">Shop</SelectItem>
                                        <SelectItem value="bakery">Bakery</SelectItem>
                                        <SelectItem value="winery">Winery</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Price Filter */}
                            <div>
                                <label className="text-sm font-medium text-neutral-900 dark:text-neutral-300 mb-2 block">{t('price') || 'Цена'}</label>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{'$'.repeat(filterPriceRange[0])}</span>
                                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{'$'.repeat(filterPriceRange[1])}</span>
                                </div>
                                <Slider
                                    value={filterPriceRange}
                                    onValueChange={setFilterPriceRange}
                                    min={1}
                                    max={4}
                                    step={1}
                                    className="mb-2"
                                />
                                <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                                    <span>Budget</span>
                                    <span>Luxury</span>
                                </div>
                            </div>

                            {/* Rating Filter */}
                            <div>
                                <label className="text-sm font-medium text-neutral-900 dark:text-neutral-300 mb-3 block">{t('rating') || 'Минимальный рейтинг'}</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: 0, label: t('any') || 'Любой' },
                                        { value: 4, label: '⭐ 4+' },
                                        { value: 4.5, label: '⭐ 4.5+' }
                                    ].map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => setFilterRating(option.value)}
                                            className={`h-12 rounded-xl font-semibold transition-all ${filterRating === option.value
                                                    ? 'bg-blue-600 text-white shadow-lg'
                                                    : 'bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Special Labels Filter */}
                            <div>
                                <label className="text-sm font-medium text-neutral-900 dark:text-neutral-300 mb-3 block">{t('specialFeatures') || 'Особенности'}</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[...specialLabels].sort((a, b) => a.label.localeCompare(b.label)).map(label => (
                                        <button
                                            key={label.id}
                                            onClick={() => {
                                                if (filterLabels.includes(label.id)) {
                                                    setFilterLabels(filterLabels.filter(l => l !== label.id));
                                                } else {
                                                    setFilterLabels([...filterLabels, label.id]);
                                                }
                                            }}
                                            className={`h-12 rounded-xl font-semibold transition-all text-sm ${filterLabels.includes(label.id)
                                                    ? 'bg-blue-600 text-white shadow-lg'
                                                    : 'bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                                                }`}
                                        >
                                            {label.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Radius Filter */}
                            {userLocation && (
                                <div>
                                    <label className="text-sm font-medium text-neutral-900 dark:text-neutral-300 mb-2 block">📍 {t('nearMe') || 'Рядом со мной'}</label>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm text-neutral-600 dark:text-neutral-400">1 km</span>
                                        <span className="text-lg font-bold text-blue-600">{searchRadius} km</span>
                                        <span className="text-sm text-neutral-600 dark:text-neutral-400">50 km</span>
                                    </div>
                                    <Slider
                                        value={[searchRadius]}
                                        onValueChange={(val) => setSearchRadius(val[0])}
                                        min={1}
                                        max={50}
                                        step={1}
                                        className="mb-2"
                                    />
                                    <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                                        <span>Nearby</span>
                                        <span>City-wide</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="sticky bottom-0 bg-white dark:bg-neutral-800 flex gap-3 mt-8 pt-6 pb-6 px-6 border-t border-neutral-200 dark:border-neutral-700">
                            {activeFiltersCount > 0 && (
                                <Button
                                    variant="outline"
                                    onClick={resetFilters}
                                    className="flex-1 h-12 rounded-xl"
                                >
                                    Reset
                                </Button>
                            )}
                            <Button
                                onClick={() => setShowFilters(false)}
                                className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700"
                            >
                                Show Results
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}