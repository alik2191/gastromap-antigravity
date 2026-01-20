import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    MapPin, Search, Edit, Trash2, ChevronRight, Image as ImageIcon
} from "lucide-react";
import { format } from "date-fns";

/**
 * Hierarchical Locations View Component
 * Shows: Countries → Cities → Locations
 */
export default function HierarchicalLocationsView({ locations, onEdit, onDelete }) {
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Group locations by country and city
    const groupedData = useMemo(() => {
        const countries = {};

        locations.forEach(location => {
            const country = location.country || 'Unknown';
            const city = location.city || 'Unknown';

            if (!countries[country]) {
                countries[country] = {
                    name: country,
                    cities: {},
                    totalLocations: 0
                };
            }

            if (!countries[country].cities[city]) {
                countries[country].cities[city] = {
                    name: city,
                    country: country,
                    locations: []
                };
            }

            countries[country].cities[city].locations.push(location);
            countries[country].totalLocations++;
        });

        return countries;
    }, [locations]);

    // Get country image (use first location's image or placeholder)
    const getCountryImage = (countryData) => {
        const firstLocation = Object.values(countryData.cities)[0]?.locations[0];
        return firstLocation?.image_url || null;
    };

    // Get city image
    const getCityImage = (cityData) => {
        return cityData.locations[0]?.image_url || null;
    };

    // Filter locations in selected city
    const filteredLocations = useMemo(() => {
        if (!selectedCity) return [];

        const cityData = groupedData[selectedCountry]?.cities[selectedCity];
        if (!cityData) return [];

        return cityData.locations.filter(loc =>
            loc.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [selectedCity, selectedCountry, groupedData, searchQuery]);

    // Breadcrumb navigation
    const renderBreadcrumb = () => {
        return (
            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                <button
                    onClick={() => {
                        setSelectedCountry(null);
                        setSelectedCity(null);
                    }}
                    className="hover:text-neutral-900 dark:hover:text-neutral-200"
                >
                    Все страны
                </button>
                {selectedCountry && (
                    <>
                        <ChevronRight className="w-4 h-4" />
                        <button
                            onClick={() => setSelectedCity(null)}
                            className="hover:text-neutral-900 dark:hover:text-neutral-200"
                        >
                            {selectedCountry}
                        </button>
                    </>
                )}
                {selectedCity && (
                    <>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-neutral-900 dark:text-neutral-100 font-medium">
                            {selectedCity}
                        </span>
                    </>
                )}
            </div>
        );
    };

    // View 1: Countries Grid
    if (!selectedCountry) {
        return (
            <div className="space-y-6">
                {renderBreadcrumb()}

                <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    Страны
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.values(groupedData).map(country => {
                        const cityCount = Object.keys(country.cities).length;
                        const activeCount = country.totalLocations;
                        const image = getCountryImage(country);

                        return (
                            <Card
                                key={country.name}
                                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow dark:bg-neutral-800 dark:border-neutral-700"
                                onClick={() => setSelectedCountry(country.name)}
                            >
                                <div className="relative h-48 bg-neutral-100 dark:bg-neutral-900">
                                    {image ? (
                                        <img
                                            src={image}
                                            alt={country.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageIcon className="w-16 h-16 text-neutral-300 dark:text-neutral-600" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <h3 className="absolute bottom-4 left-4 text-2xl font-bold text-white">
                                        {country.name}
                                    </h3>
                                </div>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                            {cityCount} {cityCount === 1 ? 'город' : 'городов'} • {activeCount} локаций
                                        </span>
                                        <div className="flex gap-2">
                                            <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-0">
                                                Active
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        );
    }

    // View 2: Cities Grid
    if (selectedCountry && !selectedCity) {
        const countryData = groupedData[selectedCountry];

        return (
            <div className="space-y-6">
                {renderBreadcrumb()}

                <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    Города в {selectedCountry}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.values(countryData.cities).map(city => {
                        const locationCount = city.locations.length;
                        const image = getCityImage(city);

                        return (
                            <Card
                                key={city.name}
                                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow dark:bg-neutral-800 dark:border-neutral-700"
                                onClick={() => setSelectedCity(city.name)}
                            >
                                <div className="relative h-48 bg-neutral-100 dark:bg-neutral-900">
                                    {image ? (
                                        <img
                                            src={image}
                                            alt={city.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageIcon className="w-16 h-16 text-neutral-300 dark:text-neutral-600" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <h3 className="absolute bottom-4 left-4 text-2xl font-bold text-white">
                                        {city.name}
                                    </h3>
                                </div>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                            {locationCount} {locationCount === 1 ? 'локация' : 'локаций'}
                                        </span>
                                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-0">
                                            Active
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        );
    }

    // View 3: Locations Table
    return (
        <div className="space-y-6">
            {renderBreadcrumb()}

            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    {selectedCity}
                </h2>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input
                        placeholder="Поиск..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 dark:bg-neutral-900 dark:border-neutral-700"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-lg border dark:border-neutral-700 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-neutral-50 dark:bg-neutral-900 border-b dark:border-neutral-700">
                        <tr>
                            <th className="text-left p-4 text-sm font-medium text-neutral-900 dark:text-neutral-300">
                                Название
                            </th>
                            <th className="text-left p-4 text-sm font-medium text-neutral-900 dark:text-neutral-300">
                                Локация
                            </th>
                            <th className="text-left p-4 text-sm font-medium text-neutral-900 dark:text-neutral-300">
                                Создано
                            </th>
                            <th className="text-left p-4 text-sm font-medium text-neutral-900 dark:text-neutral-300">
                                Обновлено
                            </th>
                            <th className="text-left p-4 text-sm font-medium text-neutral-900 dark:text-neutral-300">
                                Инфо
                            </th>
                            <th className="text-right p-4 text-sm font-medium text-neutral-900 dark:text-neutral-300">
                                Действия
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-neutral-700">
                        {filteredLocations.map(location => (
                            <tr
                                key={location.id}
                                className="hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                            >
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        {location.image_url && (
                                            <img
                                                src={location.image_url}
                                                alt={location.name}
                                                className="w-12 h-12 rounded-lg object-cover"
                                            />
                                        )}
                                        <div>
                                            <div className="font-medium text-neutral-900 dark:text-neutral-100">
                                                {location.name}
                                            </div>
                                            <Badge variant="outline" className="mt-1 text-xs">
                                                {location.type}
                                            </Badge>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span>{location.city}</span>
                                    </div>
                                    <div className="text-xs text-neutral-500 dark:text-neutral-500">
                                        {location.country}
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-neutral-600 dark:text-neutral-400">
                                    {location.created_at ? format(new Date(location.created_at), 'dd.MM.yy') : '-'}
                                </td>
                                <td className="p-4 text-sm text-neutral-600 dark:text-neutral-400">
                                    {location.updated_at ? format(new Date(location.updated_at), 'dd.MM.yy') : '-'}
                                </td>
                                <td className="p-4">
                                    {location.image_url && (
                                        <div className="w-8 h-8 rounded bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center">
                                            <ImageIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                        </div>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onEdit?.(location)}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onDelete?.(location)}
                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredLocations.length === 0 && (
                    <div className="p-12 text-center text-neutral-500 dark:text-neutral-400">
                        <MapPin className="w-12 h-12 mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
                        <p>Нет локаций</p>
                    </div>
                )}
            </div>
        </div>
    );
}
