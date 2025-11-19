// @ts-ignore;
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore;
import { MapPin } from 'lucide-react';

const TIAN_DI_TU_KEY = 'eaa119242fd58a04007ad66abc2546f7';
export function SimpleMap({
  center = [39.9042, 116.4074],
  onLocationSelect,
  currentLocation,
  className = "h-64"
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(currentLocation || {
    lat: center[0],
    lng: center[1]
  });

  // 检查天地图API是否已加载
  const isTianDiTuLoaded = () => typeof window.T !== 'undefined' && window.T !== null;

  // 加载天地图API
  const loadTianDiTuAPI = () => {
    return new Promise((resolve, reject) => {
      if (isTianDiTuLoaded()) {
        resolve();
        return;
      }
      if (window._tdtLoading) {
        const checkInterval = setInterval(() => {
          if (isTianDiTuLoaded()) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        return;
      }
      window._tdtLoading = true;
      const script = document.createElement('script');
      script.src = `https://api.tianditu.gov.cn/api?v=4.0&tk=${TIAN_DI_TU_KEY}`;
      script.onload = () => {
        const checkAPI = setInterval(() => {
          if (isTianDiTuLoaded()) {
            clearInterval(checkAPI);
            window._tdtLoading = false;
            resolve();
          }
        }, 100);
        setTimeout(() => {
          clearInterval(checkAPI);
          window._tdtLoading = false;
          reject(new Error('天地图API加载超时'));
        }, 10000);
      };
      script.onerror = () => {
        window._tdtLoading = false;
        reject(new Error('天地图API加载失败'));
      };
      document.head.appendChild(script);
    });
  };

  // 初始化地图
  const initializeMap = async () => {
    if (!mapContainerRef.current || mapLoaded) return;
    try {
      if (!mapContainerRef.current || mapContainerRef.current.offsetWidth === 0) {
        setTimeout(() => initializeMap(), 100);
        return;
      }
      await loadTianDiTuAPI();
      if (!mapContainerRef.current) {
        throw new Error('地图容器不存在');
      }
      const mapCenter = new T.LngLat(center[1], center[0]);
      const mapInstance = new T.Map(mapContainerRef.current);
      mapInstance.centerAndZoom(mapCenter, 12);
      mapInstance.addControl(new T.Control.Zoom());
      mapInstance.addControl(new T.Control.MapType());

      // 地图点击事件
      const handleMapClick = e => {
        try {
          const lngLat = e.lnglat;
          const location = {
            lat: lngLat.lat,
            lng: lngLat.lng
          };
          setSelectedLocation(location);
          onLocationSelect && onLocationSelect(location);
          addMarker(lngLat, mapInstance);
        } catch (error) {
          console.error('坐标拾取错误:', error);
        }
      };
      mapInstance.addEventListener('click', handleMapClick);
      mapInstanceRef.current = mapInstance;
      setMapLoaded(true);

      // 如果已有坐标，添加标记
      if (currentLocation && currentLocation.lat && currentLocation.lng) {
        const lngLat = new T.LngLat(currentLocation.lng, currentLocation.lat);
        addMarker(lngLat, mapInstance);
      }
    } catch (error) {
      console.error('地图初始化失败:', error);
    }
  };

  // 添加地图标记
  const addMarker = (lngLat, mapInstance = mapInstanceRef.current) => {
    if (!mapInstance) return;
    try {
      if (mapInstance._markers) {
        mapInstance._markers.forEach(marker => mapInstance.removeOverLay(marker));
      }
      const marker = new T.Marker(lngLat);
      mapInstance.addOverLay(marker);
      if (!mapInstance._markers) mapInstance._markers = [];
      mapInstance._markers.push(marker);
    } catch (error) {
      console.error('添加标记失败:', error);
    }
  };

  // 清理地图资源
  const cleanupMap = () => {
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
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
          <strong>操作说明：</strong>左键点击地图拾取坐标
        </p>
      </div>
      
      <div ref={mapContainerRef} className="w-full h-full bg-gray-800">
        {!mapLoaded && <div className="w-full h-full flex items-center justify-center text-gray-500">
            地图加载中...
          </div>}
      </div>

      {selectedLocation && <div className="bg-blue-900/20 border-t border-blue-500/30 p-3">
          <div className="flex items-center space-x-2 text-blue-400 text-sm">
            <MapPin className="h-4 w-4" />
            <span>当前坐标：纬度 {selectedLocation.lat.toFixed(6)}，经度 {selectedLocation.lng.toFixed(6)}</span>
          </div>
        </div>}
    </div>;
}