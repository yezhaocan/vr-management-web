// @ts-ignore;
import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore;
import { Button } from '@/components/ui';
// @ts-ignore;
import { MapPin, Navigation, ZoomIn, ZoomOut, LocateFixed, X, Search, RefreshCw } from 'lucide-react';

const TIAN_DI_TU_KEY = 'eaa119242fd58a04007ad66abc2546f7';

// 获取景区中心点（从scenic_spot数据源获取）
const getScenicCenter = async $w => {
  try {
    // 尝试从数据库获取最新的景区数据
    const result = await $w.cloud.callDataSource({
      dataSourceName: 'scenic_spot',
      methodName: 'wedaGetRecordsV2',
      params: {
        select: {
          $master: true
        },
        filter: {
          where: {}
        },
        pageSize: 1,
        pageNumber: 1,
        orderBy: [{
          createdAt: 'desc'
        }],
        getCount: true
      }
    });
    if (result.records && result.records.length > 0) {
      const scenicSpot = result.records[0];
      if (scenicSpot.latitude && scenicSpot.longitude) {
        return [scenicSpot.latitude, scenicSpot.longitude];
      }
    }

    // 如果没有景区数据，尝试从本地存储获取
    try {
      const storedData = localStorage.getItem('scenic_spot_data');
      if (storedData) {
        const scenicData = JSON.parse(storedData);
        if (scenicData.latitude && scenicData.longitude) {
          return [scenicData.latitude, scenicData.longitude];
        }
      }
    } catch (error) {
      console.warn('从本地存储获取景区数据失败:', error);
    }
  } catch (error) {
    console.error('获取景区中心点失败:', error);
  }

  // 默认使用北京天安门作为中心点
  return [39.9042, 116.4074];
};

// 检查天地图API是否加载
const checkTiandituLoaded = () => {
  return typeof window !== 'undefined' && typeof window.T !== 'undefined';
};

// 加载天地图API
const loadTiandituAPI = () => {
  return new Promise((resolve, reject) => {
    if (checkTiandituLoaded()) {
      resolve();
      return;
    }

    // 检查是否已经在加载中
    if (window.tiandituLoading) {
      const checkInterval = setInterval(() => {
        if (checkTiandituLoaded()) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      return;
    }
    window.tiandituLoading = true;
    const script = document.createElement('script');
    script.src = `https://api.tianditu.gov.cn/api?v=4.0&tk=${TIAN_DI_TU_KEY}`;
    script.async = true;
    script.onload = () => {
      window.tiandituLoading = false;
      // 等待API完全初始化
      setTimeout(() => {
        if (checkTiandituLoaded()) {
          resolve();
        } else {
          reject(new Error('天地图API加载超时'));
        }
      }, 500);
    };
    script.onerror = () => {
      window.tiandituLoading = false;
      reject(new Error('天地图API加载失败'));
    };
    document.head.appendChild(script);
  });
};
export function TiandituMap({
  center,
  zoom = 11,
  waypoints = [],
  onLocationSelect,
  onWaypointClick,
  showControls = true,
  className = "h-96",
  readonly = false,
  enableClick = true,
  $w
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const [currentCenter, setCurrentCenter] = useState(center);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [scenicCenter, setScenicCenter] = useState([39.9042, 116.4074]);

  // 获取景区中心点
  useEffect(() => {
    const fetchScenicCenter = async () => {
      try {
        const centerPoint = await getScenicCenter($w);
        setScenicCenter(centerPoint);

        // 如果没有传入center参数，使用景区中心点
        if (!center) {
          setCurrentCenter(centerPoint);
        }
      } catch (error) {
        console.error('获取景区中心点失败:', error);
      }
    };
    fetchScenicCenter();
  }, [$w, center]);

  // 初始化天地图
  useEffect(() => {
    const initializeMap = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        // 等待天地图API加载
        await loadTiandituAPI();
        if (mapRef.current && checkTiandituLoaded()) {
          initMap();
          setIsMapLoaded(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('天地图初始化失败:', error);
        setLoadError(error.message);
        setIsLoading(false);

        // 自动重试机制（最多重试3次）
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000);
        }
      }
    };
    if (scenicCenter) {
      initializeMap();
    }

    // 清理函数
    return () => {
      try {
        if (mapInstance.current && checkTiandituLoaded()) {
          clearMap();
          mapInstance.current = null;
        }
      } catch (error) {
        console.error('清理地图时出错:', error);
      }
    };
  }, [retryCount, scenicCenter]);

  // 重试加载
  const handleRetry = () => {
    setRetryCount(0);
    setLoadError(null);
    setIsLoading(true);
  };

  // 初始化地图
  const initMap = () => {
    try {
      if (!mapRef.current || !checkTiandituLoaded()) return;

      // 创建地图实例
      mapInstance.current = new window.T.Map(mapRef.current, {
        projection: 'EPSG:4326'
      });

      // 设置中心点和缩放级别 - 使用景区中心点
      const centerPoint = new window.T.LngLat(currentCenter[1], currentCenter[0]);
      mapInstance.current.centerAndZoom(centerPoint, currentZoom);

      // 添加矢量底图（使用https协议）
      const vecLayer = new window.T.TileLayer(`https://t0.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${TIAN_DI_TU_KEY}`, {
        minZoom: 4,
        maxZoom: 18
      });
      mapInstance.current.addLayer(vecLayer);

      // 添加注记图层（使用https协议）
      const cvaLayer = new window.T.TileLayer(`https://t0.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${TIAN_DI_TU_KEY}`, {
        minZoom: 4,
        maxZoom: 18
      });
      mapInstance.current.addLayer(cvaLayer);

      // 添加点击事件
      if (!readonly && enableClick && onLocationSelect) {
        mapInstance.current.addEventListener('click', e => {
          const location = {
            lat: e.latlng.lat,
            lng: e.latlng.lng
          };
          onLocationSelect(location);
        });
      }

      // 添加控件
      if (showControls) {
        // 缩放控件
        const zoomControl = new window.T.Control.Zoom();
        mapInstance.current.addControl(zoomControl);

        // 比例尺
        const scaleControl = new window.T.Control.Scale();
        mapInstance.current.addControl(scaleControl);
      }
    } catch (error) {
      console.error('地图初始化失败:', error);
      setLoadError('地图初始化失败: ' + error.message);
    }
  };

  // 清除地图内容
  const clearMap = () => {
    try {
      if (!mapInstance.current || !checkTiandituLoaded()) return;

      // 清除所有标记
      markersRef.current.forEach(marker => {
        if (marker && mapInstance.current) {
          mapInstance.current.removeLayer(marker);
        }
      });
      markersRef.current = [];

      // 清除连线
      if (polylineRef.current && mapInstance.current) {
        mapInstance.current.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }
    } catch (error) {
      console.error('清除地图内容失败:', error);
    }
  };

  // 更新标记和连线
  useEffect(() => {
    if (!mapInstance.current || !isMapLoaded || !checkTiandituLoaded()) return;

    // 清除旧内容
    clearMap();

    // 添加新标记
    if (waypoints && waypoints.length > 0) {
      waypoints.forEach((waypoint, index) => {
        try {
          const marker = new window.T.Marker(new window.T.LngLat(waypoint.lng, waypoint.lat), {
            title: waypoint.name || `航点${index + 1}`,
            icon: new window.T.Icon({
              iconUrl: createCustomIcon(index + 1),
              iconSize: new window.T.Point(30, 40),
              iconAnchor: new window.T.Point(15, 40)
            })
          });

          // 添加点击事件
          if (onWaypointClick) {
            marker.addEventListener('click', () => {
              onWaypointClick(index, waypoint);
            });
          }
          mapInstance.current.addLayer(marker);
          markersRef.current.push(marker);
        } catch (error) {
          console.error(`添加标记 ${index} 失败:`, error);
        }
      });

      // 添加连线
      if (waypoints.length > 1) {
        try {
          const points = waypoints.map(wp => new window.T.LngLat(wp.lng, wp.lat));
          polylineRef.current = new window.T.Polyline(points, {
            color: '#06b6d4',
            weight: 3,
            opacity: 0.8,
            lineStyle: 'solid'
          });
          mapInstance.current.addLayer(polylineRef.current);

          // 调整视野
          const bounds = new window.T.LngLatBounds();
          waypoints.forEach(wp => bounds.extend(new window.T.LngLat(wp.lng, wp.lat)));
          mapInstance.current.fitBounds(bounds, {
            padding: [50, 50]
          });
        } catch (error) {
          console.error('添加连线失败:', error);
        }
      }
    }
  }, [waypoints, isMapLoaded, onWaypointClick]);

  // 创建自定义图标
  const createCustomIcon = number => {
    const svg = `
      <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad${number}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#06b6d4;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
          </linearGradient>
        </defs>
        <path d="M15 0C6.716 0 0 6.716 0 15c0 8.284 15 25 15 25s15-16.716 15-25C30 6.716 23.284 0 15 0z" fill="url(#grad${number})"/>
        <circle cx="15" cy="15" r="8" fill="#ffffff"/>
        <text x="15" y="19" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e293b">${number}</text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  // 手动控制缩放
  const handleZoomIn = () => {
    if (mapInstance.current && checkTiandituLoaded()) {
      mapInstance.current.zoomIn();
      setCurrentZoom(mapInstance.current.getZoom());
    }
  };
  const handleZoomOut = () => {
    if (mapInstance.current && checkTiandituLoaded()) {
      mapInstance.current.zoomOut();
      setCurrentZoom(mapInstance.current.getZoom());
    }
  };

  // 重置到景区中心
  const handleLocate = () => {
    if (mapInstance.current && checkTiandituLoaded()) {
      const centerPoint = new window.T.LngLat(scenicCenter[1], scenicCenter[0]);
      mapInstance.current.centerAndZoom(centerPoint, zoom);
      setCurrentCenter(scenicCenter);
      setCurrentZoom(zoom);
    }
  };

  // 渲染加载状态
  const renderLoadingState = () => {
    if (loadError) {
      return <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 rounded-xl">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-white" />
            </div>
            <p className="text-red-400 font-medium mb-2">地图加载失败</p>
            <p className="text-sm text-slate-300 mb-4">{loadError}</p>
            <Button onClick={handleRetry} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              重新加载
            </Button>
          </div>
        </div>;
    }
    if (isLoading) {
      return <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 rounded-xl">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <p className="text-cyan-400 font-medium mb-2">天地图加载中...</p>
            <p className="text-sm text-slate-300">正在初始化地图服务</p>
            {retryCount > 0 && <p className="text-xs text-slate-400 mt-1">重试次数: {retryCount}/3</p>}
          </div>
        </div>;
    }
    return null;
  };
  return <div className="relative w-full">
      {/* 地图容器 */}
      <div ref={mapRef} className={`w-full ${className} rounded-xl border border-slate-700 bg-slate-900`} style={{
      minHeight: '400px'
    }} />
      
      {/* 加载状态或错误状态 */}
      {renderLoadingState()}

      {/* 地图控制面板 */}
      {isMapLoaded && !isLoading && !loadError && showControls && <div className="absolute top-4 right-4 space-y-2">
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-2 space-y-1">
            <Button size="sm" variant="ghost" onClick={handleZoomIn} className="w-8 h-8 p-0 text-cyan-400 hover:text-cyan-300 hover:bg-slate-700" title="放大">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleZoomOut} className="w-8 h-8 p-0 text-cyan-400 hover:text-cyan-300 hover:bg-slate-700" title="缩小">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleLocate} className="w-8 h-8 p-0 text-cyan-400 hover:text-cyan-300 hover:bg-slate-700" title="定位到景区">
              <LocateFixed className="w-4 h-4" />
            </Button>
          </div>
        </div>}

      {/* 航点信息面板 */}
      {isMapLoaded && !isLoading && !loadError && waypoints.length > 0 && <div className="absolute bottom-4 left-4 bg-slate-800/80 backdrop-blur-sm rounded-lg p-3 border border-slate-700">
          <div className="text-sm">
            <p className="text-cyan-400 font-medium mb-1">航点信息</p>
            <p className="text-slate-300">总数: {waypoints.length}</p>
            {!readonly && <p className="text-slate-400 text-xs mt-1">点击地图添加航点</p>}
          </div>
        </div>}

      {/* 坐标显示 */}
      {isMapLoaded && !isLoading && !loadError && <div className="absolute bottom-4 right-4 bg-slate-800/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs">
          <p className="text-slate-400">
            中心: {currentCenter[0].toFixed(4)}, {currentCenter[1].toFixed(4)}
          </p>
          <p className="text-slate-400">
            缩放: {currentZoom}
          </p>
          <p className="text-cyan-400 text-xs">
            景区中心: {scenicCenter[0].toFixed(4)}, {scenicCenter[1].toFixed(4)}
          </p>
        </div>}
    </div>;
}

// 简化版地图组件（用于弹窗）
export function TiandituMapLite({
  center,
  onLocationSelect,
  className = "h-64",
  $w
}) {
  const [showMap, setShowMap] = useState(false);
  const [scenicCenter, setScenicCenter] = useState([39.9042, 116.4074]);
  useEffect(() => {
    const fetchScenicCenter = async () => {
      const centerPoint = await getScenicCenter($w);
      setScenicCenter(centerPoint);
    };
    fetchScenicCenter();
  }, [$w]);
  const handleLocationSelect = location => {
    onLocationSelect(location);
    setShowMap(false);
  };
  return <div className="space-y-2">
      <div className={`w-full ${className} bg-slate-800 rounded-lg border border-slate-600 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors`} onClick={() => setShowMap(true)}>
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <p className="text-slate-300 font-medium">天地图集成</p>
          <p className="text-sm text-slate-400">点击打开地图</p>
        </div>
      </div>

      {/* 地图弹窗 */}
      {showMap && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 max-w-4xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-cyan-400">地图拾取坐标</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowMap(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <TiandituMap center={center || scenicCenter} onLocationSelect={handleLocationSelect} className="h-96" showControls={true} $w={$w} />
          </div>
        </div>}
    </div>;
}

// 地图拾取弹窗组件
export function MapPickerModal({
  isOpen,
  onClose,
  onLocationSelect,
  currentLocation,
  center,
  $w
}) {
  const [selectedLocation, setSelectedLocation] = useState(currentLocation || center);
  const [scenicCenter, setScenicCenter] = useState([39.9042, 116.4074]);
  useEffect(() => {
    const fetchScenicCenter = async () => {
      const centerPoint = await getScenicCenter($w);
      setScenicCenter(centerPoint);
    };
    fetchScenicCenter();
  }, [$w]);
  const handleLocationSelect = location => {
    setSelectedLocation(location);
    onLocationSelect(location);
    onClose();
  };
  if (!isOpen) return null;
  return <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 max-w-4xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-cyan-400">地图拾取坐标</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="mb-4">
          <p className="text-sm text-slate-300">
            当前选择: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
          </p>
        </div>
        <TiandituMap center={center || scenicCenter} onLocationSelect={handleLocationSelect} className="h-96" showControls={true} $w={$w} />
      </div>
    </div>;
}

// 导出默认组件
export default TiandituMap;