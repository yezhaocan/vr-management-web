// @ts-ignore;
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore;
import { MapPin } from 'lucide-react';

// Leaflet CSS 和 JS
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
export function SimpleMap({
  center = [39.9042, 116.4074],
  onLocationSelect,
  currentLocation,
  className = "h-64"
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(currentLocation || {
    lat: center[0],
    lng: center[1]
  });

  // 检查 Leaflet 是否已加载
  const isLeafletLoaded = () => typeof window !== 'undefined' && window.L;

  // 加载 Leaflet CSS
  const loadLeafletCSS = () => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
        resolve();
        return;
      }
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error('Leaflet CSS 加载失败'));
      document.head.appendChild(link);
    });
  };

  // 加载 Leaflet JS
  const loadLeafletJS = () => {
    return new Promise((resolve, reject) => {
      if (isLeafletLoaded()) {
        resolve();
        return;
      }
      if (window._leafletLoading) {
        const checkInterval = setInterval(() => {
          if (isLeafletLoaded()) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        return;
      }
      window._leafletLoading = true;
      const script = document.createElement('script');
      script.src = LEAFLET_JS;
      script.onload = () => {
        window._leafletLoading = false;
        resolve();
      };
      script.onerror = () => {
        window._leafletLoading = false;
        reject(new Error('Leaflet JS 加载失败'));
      };
      document.head.appendChild(script);
    });
  };

  // 初始化地图
  const initializeMap = async () => {
    if (!mapContainerRef.current || mapLoaded) return;
    try {
      // 加载 Leaflet 资源
      await Promise.all([loadLeafletCSS(), loadLeafletJS()]);
      if (!mapContainerRef.current) {
        throw new Error('地图容器不存在');
      }

      // 创建地图实例
      const mapInstance = window.L.map(mapContainerRef.current, {
        center: center,
        zoom: 12,
        zoomControl: false
      });

      // 添加 OpenStreetMap 瓦片图层
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
      }).addTo(mapInstance);

      // 添加缩放控件
      window.L.control.zoom({
        position: 'topright'
      }).addTo(mapInstance);

      // 地图点击事件
      const handleMapClick = e => {
        try {
          const location = {
            lat: parseFloat(e.latlng.lat.toFixed(8)),
            lng: parseFloat(e.latlng.lng.toFixed(8))
          };
          setSelectedLocation(location);
          onLocationSelect && onLocationSelect(location);
          addMarker(e.latlng, mapInstance);
        } catch (error) {
          console.error('坐标拾取错误:', error);
        }
      };
      mapInstance.on('click', handleMapClick);
      mapInstanceRef.current = mapInstance;
      setMapLoaded(true);

      // 如果已有坐标，添加标记
      if (currentLocation && currentLocation.lat && currentLocation.lng) {
        const latLng = window.L.latLng(currentLocation.lat, currentLocation.lng);
        addMarker(latLng, mapInstance);
      }
    } catch (error) {
      console.error('地图初始化失败:', error);
    }
  };

  // 添加地图标记
  const addMarker = (latLng, mapInstance = mapInstanceRef.current) => {
    if (!mapInstance) return;
    try {
      // 清除之前的标记
      if (markerRef.current) {
        mapInstance.removeLayer(markerRef.current);
      }

      // 创建新标记
      markerRef.current = window.L.marker(latLng, {
        icon: window.L.divIcon({
          className: 'custom-marker',
          html: '<div style="background: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }).addTo(mapInstance);

      // 将地图中心移动到标记位置
      mapInstance.setView(latLng, mapInstance.getZoom());
    } catch (error) {
      console.error('添加标记失败:', error);
    }
  };

  // 清理地图资源
  const cleanupMap = () => {
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      } catch (error) {
        console.error('清理地图资源失败:', error);
      }
    }
    setMapLoaded(false);
  };
  useEffect(() => {
    setTimeout(() => initializeMap(), 300);
    return () => cleanupMap();
  }, []);
  return <div className={`w-full ${className} bg-gray-800 rounded-lg border border-gray-600 overflow-hidden`}>
      <div className="bg-blue-900/20 border-b border-blue-500/30 p-3">
        <p className="text-blue-300 text-sm">
          <strong>操作说明：</strong>左键点击地图拾取坐标（精度：8位小数）
        </p>
      </div>
      
      <div ref={mapContainerRef} className="w-full h-full bg-gray-800" style={{
      minHeight: '256px'
    }}>
        {!mapLoaded && <div className="w-full h-full flex items-center justify-center text-gray-500">
            地图加载中...
          </div>}
      </div>

      {selectedLocation && <div className="bg-blue-900/20 border-t border-blue-500/30 p-3">
          <div className="flex items-center space-x-2 text-blue-400 text-sm">
            <MapPin className="h-4 w-4" />
            <span>当前坐标：纬度 {selectedLocation.lat.toFixed(8)}，经度 {selectedLocation.lng.toFixed(8)}</span>
          </div>
        </div>}
    </div>;
}