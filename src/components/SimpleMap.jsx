// @ts-ignore;
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore;
import { MapPin, Trash2 } from 'lucide-react';

// Leaflet CSS 和 JS
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
export function SimpleMap({
  center = [39.9042, 116.4074],
  onLocationSelect,
  currentLocation,
  waypoints = [],
  className = "h-64",
  onClearConnections
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null);
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

  // 坐标精度验证函数 - 确保8位小数精度
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

    // 返回8位小数精度
    return parseFloat(num.toFixed(8));
  };

  // 绘制航点连线
  const drawWaypointConnections = (mapInstance, waypoints) => {
    if (!mapInstance || !waypoints || waypoints.length < 2) {
      return;
    }

    // 清除之前的连线
    if (polylineRef.current) {
      mapInstance.removeLayer(polylineRef.current);
    }

    // 创建航点坐标数组
    const latLngs = waypoints.map(wp => window.L.latLng(wp.lat, wp.lng));

    // 创建连线
    polylineRef.current = window.L.polyline(latLngs, {
      color: '#3b82f6',
      weight: 2,
      opacity: 0.8,
      lineJoin: 'round',
      dashArray: null,
      className: 'route-connection-line'
    }).addTo(mapInstance);

    // 添加点击事件高亮
    polylineRef.current.on('click', e => {
      // 高亮显示连线
      polylineRef.current.setStyle({
        color: '#f59e0b',
        weight: 3,
        opacity: 1
      });

      // 3秒后恢复原样
      setTimeout(() => {
        polylineRef.current.setStyle({
          color: '#3b82f6',
          weight: 2,
          opacity: 0.8
        });
      }, 3000);
    });
  };

  // 清除所有连线
  const clearConnections = () => {
    if (mapInstanceRef.current && polylineRef.current) {
      mapInstanceRef.current.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }
  };

  // 添加航点标记
  const addWaypointMarkers = (mapInstance, waypoints) => {
    if (!mapInstance || !waypoints) return;

    // 清除之前的标记
    if (markerRef.current) {
      mapInstance.removeLayer(markerRef.current);
    }

    // 为每个航点添加标记
    waypoints.forEach((waypoint, index) => {
      const marker = window.L.marker([waypoint.lat, waypoint.lng], {
        icon: window.L.divIcon({
          className: 'waypoint-marker',
          html: `
            <div style="
              background: ${index === 0 ? '#10b981' : index === waypoints.length - 1 ? '#ef4444' : '#3b82f6'};
              width: 24px;
              height: 24px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 10px;
            ">
              ${index + 1}
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      }).addTo(mapInstance);

      // 添加点击事件
      marker.on('click', () => {
        // 可以在这里添加航点点击事件处理
        console.log(`点击航点 ${index + 1}:`, waypoint);
      });
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
      window.L.tileLayer('https://t0.tianditu.gov.cn/DataServer?T=img_w/&x={x}&y={y}&l={z}&style=dark&tk=eaa119242fd58a04007ad66abc2546f7', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
      }).addTo(mapInstance);

      // 添加缩放控件
      window.L.control.zoom({
        position: 'topright'
      }).addTo(mapInstance);

      // 地图点击事件 - 确保8位小数精度
      const handleMapClick = e => {
        try {
          const location = {
            lat: validateCoordinate(e.latlng.lat.toFixed(8), '纬度'),
            lng: validateCoordinate(e.latlng.lng.toFixed(8), '经度')
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

      // 绘制航点连线
      if (waypoints && waypoints.length >= 2) {
        drawWaypointConnections(mapInstance, waypoints);
        addWaypointMarkers(mapInstance, waypoints);
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
          html: '<div style="background: #8b5cf6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
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
        polylineRef.current = null;
      } catch (error) {
        console.error('清理地图资源失败:', error);
      }
    }
    setMapLoaded(false);
  };

  // 监听航点变化，实时更新连线
  useEffect(() => {
    if (mapInstanceRef.current && waypoints && waypoints.length >= 2) {
      drawWaypointConnections(mapInstanceRef.current, waypoints);
      addWaypointMarkers(mapInstanceRef.current, waypoints);
    } else if (mapInstanceRef.current && polylineRef.current) {
      // 如果航点少于2个，清除连线
      clearConnections();
    }
  }, [waypoints]);

  // 监听清除连线事件
  useEffect(() => {
    if (onClearConnections) {
      clearConnections();
    }
  }, [onClearConnections]);
  useEffect(() => {
    setTimeout(() => initializeMap(), 300);
    return () => cleanupMap();
  }, []);
  return <div className={`w-full ${className} bg-gray-800 rounded-lg border border-gray-600 overflow-hidden`}>
      <div className="bg-blue-900/20 border-b border-blue-500/30 p-3">
        <div className="flex justify-between items-center">
          <p className="text-blue-300 text-sm">
            <strong>操作说明：</strong>左键点击地图拾取坐标（精度：8位小数）
          </p>
          {waypoints && waypoints.length >= 2 && <button onClick={clearConnections} className="flex items-center space-x-1 text-red-400 hover:text-red-300 text-sm bg-red-900/20 px-2 py-1 rounded">
              <Trash2 className="h-3 w-3" />
              <span>清除连线</span>
            </button>}
        </div>
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