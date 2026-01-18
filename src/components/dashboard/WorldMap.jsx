import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Check, Heart, Star, LocateFixed, ZoomIn, ZoomOut, Layers, Loader2 } from "lucide-react";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { toast } from "sonner";

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createCustomIcon = (type) => {
    const colors = {
        visited: '#22c55e',
        wishlist: '#f43f5e',
        default: '#f59e0b'
    };

    return L.divIcon({
        className: 'custom-marker',
        html: `
            <div style="
                width: 32px;
                height: 32px;
                background: ${colors[type] || colors.default};
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            ">
                <div style="transform: rotate(45deg); color: white; font-size: 14px;">
                    ${type === 'visited' ? '✓' : type === 'wishlist' ? '♥' : '★'}
                </div>
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

const typeLabels = {
    cafe: "Кафе",
    bar: "Бар",
    restaurant: "Ресторан",
    market: "Рынок",
    shop: "Магазин",
    bakery: "Пекарня",
    winery: "Винодельня"
};

// Map controls component
function MapControls() {
    const map = useMap();
    const [userLocation, setUserLocation] = useState(null);
    const [locating, setLocating] = useState(false);

    const handleZoomIn = () => {
        map.zoomIn();
    };

    const handleZoomOut = () => {
        map.zoomOut();
    };

    const handleLocate = () => {
        if (!navigator.geolocation) {
            toast.error('Геолокация не поддерживается вашим браузером');
            return;
        }

        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation([latitude, longitude]);
                map.flyTo([latitude, longitude], 13, { duration: 1 });
                setLocating(false);
                toast.success('Местоположение определено');
            },
            (error) => {
                console.error('Error getting location:', error);
                setLocating(false);

                if (error.code === 1) {
                    toast.error('Доступ к геолокации запрещён. Разрешите доступ в настройках браузера и перезагрузите страницу.', {
                        duration: 5000
                    });
                } else if (error.code === 2) {
                    toast.error('Местоположение недоступно. Проверьте настройки GPS на устройстве.', {
                        duration: 5000
                    });
                } else if (error.code === 3) {
                    toast.error('Превышено время ожидания геолокации. Попробуйте снова.', {
                        duration: 5000
                    });
                } else {
                    toast.error('Не удалось определить местоположение.', {
                        duration: 5000
                    });
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    return (
        <>
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                <Button
                    onClick={handleZoomIn}
                    size="icon"
                    className="w-10 h-10 bg-white hover:bg-neutral-50 text-neutral-700 shadow-lg border border-neutral-200 rounded-xl"
                >
                    <ZoomIn className="w-5 h-5" />
                </Button>
                <Button
                    onClick={handleZoomOut}
                    size="icon"
                    className="w-10 h-10 bg-white hover:bg-neutral-50 text-neutral-700 shadow-lg border border-neutral-200 rounded-xl"
                >
                    <ZoomOut className="w-5 h-5" />
                </Button>
                <Button
                    onClick={handleLocate}
                    size="icon"
                    disabled={locating}
                    className="w-10 h-10 bg-white hover:bg-neutral-50 text-neutral-700 shadow-lg border border-neutral-200 rounded-xl disabled:opacity-50"
                    title="Показать моё местоположение"
                >
                    {locating ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <LocateFixed className="w-5 h-5" />
                    )}
                </Button>
            </div>
            {userLocation && (
                <Marker position={userLocation} icon={L.divIcon({
                    className: 'user-location-marker',
                    html: `<div style="width: 20px; height: 20px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                })} />
            )}
        </>
    );
}

export default function WorldMap({ locations, savedLocations, onLocationClick }) {
    const [mapReady, setMapReady] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);

    useEffect(() => {
        setMapReady(true);
    }, []);

    const getSavedStatus = (locationId) => {
        const saved = savedLocations.find(s => s.location_id === locationId);
        return saved?.list_type || null;
    };

    const validLocations = locations.filter(loc => loc.latitude && loc.longitude);

    // Calculate center based on locations
    const center = validLocations.length > 0
        ? [
            validLocations.reduce((sum, loc) => sum + loc.latitude, 0) / validLocations.length,
            validLocations.reduce((sum, loc) => sum + loc.longitude, 0) / validLocations.length
        ]
        : [48.8566, 2.3522];

    if (!mapReady) {
        return (
            <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                <div className="text-neutral-400">Загрузка карты...</div>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative touch-none">
            <MapContainer
                center={center}
                zoom={validLocations.length > 0 ? 6 : 3}
                className="w-full h-full"
                style={{ background: '#f5f5f4' }}
                zoomControl={false}
                scrollWheelZoom={true}
                dragging={true}
                touchZoom={true}
                doubleClickZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                <MapControls />

                <MarkerClusterGroup
                    chunkedLoading
                    spiderfyOnMaxZoom={true}
                    showCoverageOnHover={false}
                    zoomToBoundsOnClick={true}
                    maxClusterRadius={60}
                    iconCreateFunction={(cluster) => {
                        const count = cluster.getChildCount();
                        let size = 'small';
                        if (count > 10) size = 'medium';
                        if (count > 20) size = 'large';

                        const sizeMap = {
                            small: 'w-10 h-10 text-sm',
                            medium: 'w-12 h-12 text-base',
                            large: 'w-14 h-14 text-lg'
                        };

                        return L.divIcon({
                            html: `<div class="${sizeMap[size]} bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-4 border-white">${count}</div>`,
                            className: 'custom-cluster-icon',
                            iconSize: L.point(size === 'large' ? 56 : size === 'medium' ? 48 : 40, size === 'large' ? 56 : size === 'medium' ? 48 : 40)
                        });
                    }}
                >
                    {validLocations.map((location) => {
                        const savedStatus = getSavedStatus(location.id);

                        return (
                            <Marker
                                key={location.id}
                                position={[location.latitude, location.longitude]}
                                icon={createCustomIcon(savedStatus)}
                            >
                                <Popup maxWidth={280} closeButton={false}>
                                    <div
                                        className="p-3 cursor-pointer hover:bg-neutral-50 transition-colors rounded-lg"
                                        onClick={() => {
                                            setSelectedLocation(location);
                                            onLocationClick && onLocationClick(location);
                                        }}
                                    >
                                        <h3 className="font-semibold text-neutral-900 text-base mb-1">{location.name}</h3>
                                        <p className="text-sm text-neutral-600 mb-2 flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {location.city}, {location.country}
                                        </p>
                                        <div className="flex items-center gap-2 flex-wrap mb-3">
                                            <Badge variant="secondary" className="text-xs">
                                                {typeLabels[location.type] || location.type}
                                            </Badge>
                                            {savedStatus === 'visited' && (
                                                <Badge className="bg-green-500 text-white text-xs">
                                                    <Check className="w-3 h-3 mr-1" />
                                                    Посещено
                                                </Badge>
                                            )}
                                            {savedStatus === 'wishlist' && (
                                                <Badge className="bg-rose-500 text-white text-xs">
                                                    <Heart className="w-3 h-3 mr-1" />
                                                    Wish-list
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-xs text-blue-600 font-medium">
                                            Нажмите для подробностей →
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MarkerClusterGroup>
            </MapContainer>

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-neutral-200 p-3">
                <div className="text-xs font-semibold text-neutral-700 mb-2">Легенда</div>
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
                        <span className="text-xs text-neutral-600">Не посещено</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-rose-500 rounded-full"></div>
                        <span className="text-xs text-neutral-600">В Wish-list</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-neutral-600">Посещено</span>
                    </div>
                </div>
            </div>
        </div>
    );
}