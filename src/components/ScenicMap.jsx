// @ts-ignore;
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore;
import { Card, CardContent, useToast } from '@/components/ui';
// @ts-ignore;
import { MapPin, Navigation, Loader, Edit3 } from 'lucide-react';

// Leaflet CSS 和 JS
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
export function ScenicMap({
  onPositionSelect,
  initialPosition,
  disabled = false,
  className = "h-80"
}) {
  const {
    toast
  } = useToast();
  const [selectedPosition, setSelectedPosition] = useState(initialPosition || null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const initializingRef = useRef(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [userLocation, setUserLocation] = useState({
    latitude: 39.9042,
    longitude: 116.4074
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

  // 坐标精度验证函数 - 确保6位小数精度
  const validateCoordinate = (value, type) => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      throw new Error(`无效的${type}坐标值`);
    }

    // 验证坐标范围
    if (type === '纬度' && (num < -90 || num > 90)) {
      throw new Error('纬度范围应在-90到90之间');
    }
    if (type === '经度' && (num < -180 || num > 180)) {
      throw new Error('经度范围应在-180到180之间');
    }

    // 返回6位小数精度
    return parseFloat(num.toFixed(6));
  };

  // 获取用户地理位置
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      }, error => {
        console.warn('获取用户位置失败:', error);
      });
    }
  }, []);

  // 初始化地图
  const initializeMap = async () => {
    if (!mapContainerRef.current) return;
    if (initializingRef.current) return;
    if (mapInstanceRef.current) return;
    if (mapContainerRef.current && mapContainerRef.current._leaflet_id) return;
    initializingRef.current = true;
    try {
      // 加载 Leaflet 资源
      await Promise.all([loadLeafletCSS(), loadLeafletJS()]);
      if (!mapContainerRef.current) {
        throw new Error('地图容器不存在');
      }

      // 确定地图中心点
      let mapCenter;
      if (selectedPosition && selectedPosition.lat && selectedPosition.lng) {
        mapCenter = [selectedPosition.lat, selectedPosition.lng];
      } else {
        mapCenter = [userLocation.latitude, userLocation.longitude];
      }

      // 创建地图实例
      const mapInstance = window.L.map(mapContainerRef.current, {
        center: mapCenter,
        zoom: 12,
        zoomControl: false
      });

      // 添加天地图瓦片图层
      window.L.tileLayer('https://t0.tianditu.gov.cn/DataServer?T=img_w/&x={x}&y={y}&l={z}&style=dark&tk=eaa119242fd58a04007ad66abc2546f7', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
      }).addTo(mapInstance);

      // 添加缩放控件
      window.L.control.zoom({
        position: 'topright'
      }).addTo(mapInstance);

      // 地图点击事件 - 更新唯一标记位置
      const handleMapClick = e => {
        if (disabled) return;
        try {
          const location = {
            lat: validateCoordinate(e.latlng.lat.toFixed(6), '纬度'),
            lng: validateCoordinate(e.latlng.lng.toFixed(6), '经度')
          };
          setSelectedPosition(location);
          onPositionSelect && onPositionSelect(location);
          updateMarker(e.latlng, mapInstance);
        } catch (error) {
          console.error('坐标拾取错误:', error);
          toast({
            title: '坐标拾取失败',
            description: error.message,
            variant: 'destructive'
          });
        }
      };
      mapInstance.on('click', handleMapClick);
      mapInstanceRef.current = mapInstance;

      // 如果已有初始位置，添加标记
      if (selectedPosition && selectedPosition.lat && selectedPosition.lng) {
        const latLng = window.L.latLng(selectedPosition.lat, selectedPosition.lng);
        addMarker(latLng, mapInstance);
      }
      setMapLoaded(true);
      setMapError(null);
    } catch (error) {
      console.error('地图初始化失败:', error);
      toast({
        title: '地图初始化失败',
        description: error.message,
        variant: 'destructive'
      });
      setMapError(error);
    } finally {
      initializingRef.current = false;
    }
  };

  // 添加/更新地图标记
  const addMarker = (latLng, mapInstance = mapInstanceRef.current) => {
    if (!mapInstance) return;
    try {
      // 清除之前的标记
      if (markerRef.current) {
        mapInstance.removeLayer(markerRef.current);
        markerRef.current = null;
      }

      // 创建自定义标记图标 - 使用主色的互补色 (Orange: #ff8718)
      const customIcon = window.L.divIcon({
        className: 'scenic-marker',
        html: `
          <div style="
            background: #ff8718;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
          ">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      // 创建新标记
      markerRef.current = window.L.marker(latLng, {
        icon: customIcon,
        draggable: !disabled
      }).addTo(mapInstance);

      // 标记拖动事件
      markerRef.current.on('dragend', e => {
        if (disabled) return;
        const marker = e.target;
        const position = marker.getLatLng();
        const location = {
          lat: validateCoordinate(position.lat.toFixed(6), '纬度'),
          lng: validateCoordinate(position.lng.toFixed(6), '经度')
        };
        setSelectedPosition(location);
        onPositionSelect && onPositionSelect(location);
      });

      // 将地图中心移动到标记位置
      mapInstance.setView(latLng, mapInstance.getZoom());
    } catch (error) {
      console.error('添加标记失败:', error);
    }
  };

  // 更新标记位置
  const updateMarker = (latLng, mapInstance = mapInstanceRef.current) => {
    if (!mapInstance) return;
    addMarker(latLng, mapInstance);
  };

  // 处理手动坐标输入
  const handleManualCoordinateChange = (field, value) => {
    if (!mapLoaded || disabled) return;
    try {
      const newValue = validateCoordinate(value, field === 'lat' ? '纬度' : '经度');
      const newPosition = {
        ...selectedPosition,
        [field]: newValue
      };

      // 确保两个坐标都存在
      if (!newPosition.lat || !newPosition.lng) {
        return;
      }
      setSelectedPosition(newPosition);
      onPositionSelect && onPositionSelect(newPosition);

      // 更新地图标记
      const latLng = window.L.latLng(newPosition.lat, newPosition.lng);
      updateMarker(latLng);

      // 移动地图中心到新位置
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView(latLng, 15);
      }
    } catch (error) {
      toast({
        title: '坐标输入错误',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // 清理地图资源
  const cleanupMap = () => {
    if (mapInstanceRef.current) {
      try {
        // 清除标记
        if (markerRef.current) {
          mapInstanceRef.current.removeLayer(markerRef.current);
          markerRef.current = null;
        }

        // 移除地图实例
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      } catch (error) {
        console.error('清理地图资源失败:', error);
      }
    }
    if (mapContainerRef.current && mapContainerRef.current._leaflet_id) {
      try {
        delete mapContainerRef.current._leaflet_id;
      } catch {}
    }
    initializingRef.current = false;
    setMapLoaded(false);
    setMapError(null);
  };

  // 监听初始位置变化
  useEffect(() => {
    if (initialPosition && (!selectedPosition || initialPosition.lat !== selectedPosition.lat || initialPosition.lng !== selectedPosition.lng)) {
      setSelectedPosition(initialPosition);
      if (mapInstanceRef.current && initialPosition.lat && initialPosition.lng) {
        const latLng = window.L.latLng(initialPosition.lat, initialPosition.lng);
        updateMarker(latLng);
        mapInstanceRef.current.setView(latLng, 15);
      }
    }
  }, [initialPosition]);

  // 初始化地图
  useEffect(() => {
    setTimeout(() => initializeMap(), 0);
    return () => cleanupMap();
  }, []);

  return (
    <>
      <style>{`
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
          margin-top: 16px !important;
          margin-right: 16px !important;
        }
        .leaflet-control-zoom a {
          background-color: hsl(var(--card)) !important;
          color: hsl(var(--foreground)) !important;
          border-bottom: 1px solid hsl(var(--border)) !important;
          width: 32px !important;
          height: 32px !important;
          line-height: 32px !important;
          font-size: 14px !important;
          transition: all 0.2s ease;
        }
        .leaflet-control-zoom a:first-child {
          border-top-left-radius: 8px !important;
          border-top-right-radius: 8px !important;
        }
        .leaflet-control-zoom a:last-child {
          border-bottom-left-radius: 8px !important;
          border-bottom-right-radius: 8px !important;
          border-bottom: none !important;
        }
        .leaflet-control-zoom a:hover {
          background-color: hsl(var(--accent)) !important;
          color: hsl(var(--accent-foreground)) !important;
        }
        .leaflet-container {
          font-family: inherit !important;
          z-index: 1;
        }
      `}</style>
      <div ref={mapContainerRef} className={`relative w-full h-full ${className} bg-muted/20`} style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        width: '100%',
        height: '100%',
        position: 'relative',
        zIndex: 1
      }}>
        {/* 地图加载状态 */}
        {!mapLoaded && !mapError && <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-[1000]">
            <div className="flex flex-col items-center space-y-2">
              <Loader className="h-8 w-8 text-primary animate-spin" />
              <div className="text-foreground text-sm font-medium">地图加载中...</div>
            </div>
          </div>}
        {mapError && <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 z-[1100]">
            <div className="text-destructive-foreground text-sm font-medium bg-destructive px-4 py-2 rounded border border-destructive-foreground/20">
              地图初始化失败
            </div>
          </div>}
        
        {/* 禁用状态遮罩 */}
        {disabled && mapLoaded && <div className="absolute inset-0 bg-background/40 flex items-center justify-center backdrop-blur-sm z-[1100]">
            <div className="text-foreground text-lg font-medium bg-background/90 px-4 py-3 rounded-lg border border-border shadow-sm">
              编辑模式下可设置坐标
            </div>
          </div>}
      </div>
    </>
  );
}
