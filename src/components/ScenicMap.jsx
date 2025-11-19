// @ts-ignore;
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore;
import { Card, CardContent, useToast } from '@/components/ui';
// @ts-ignore;
import { MapPin, Navigation, Loader } from 'lucide-react';

// 本地存储键名
const SCENIC_SPOT_STORAGE_KEY = 'scenic_spot_data';
export function ScenicMap({
  onPositionSelect,
  initialPosition,
  disabled = false
}) {
  const {
    toast
  } = useToast();
  const [selectedPosition, setSelectedPosition] = useState(initialPosition);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState({
    latitude: 39.9042,
    longitude: 116.4074
  });
  const [marker, setMarker] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // 天地图API密钥
  const TIAN_DI_TU_KEY = 'eaa119242fd58a04007ad66abc2546f7';

  // 从本地存储获取景区数据
  const getScenicDataFromLocal = () => {
    try {
      const storedData = localStorage.getItem(SCENIC_SPOT_STORAGE_KEY);
      return storedData ? JSON.parse(storedData) : null;
    } catch (error) {
      console.error('从本地存储获取数据失败:', error);
      return null;
    }
  };
  useEffect(() => {
    setSelectedPosition(initialPosition);
  }, [initialPosition]);

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

  // 加载天地图API脚本
  useEffect(() => {
    if (scriptLoaded) return;
    const loadScript = () => {
      return new Promise((resolve, reject) => {
        if (window.T) {
          setScriptLoaded(true);
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = `https://api.tianditu.gov.cn/api?v=4.0&tk=${TIAN_DI_TU_KEY}`;
        script.onload = () => {
          setScriptLoaded(true);
          resolve();
        };
        script.onerror = () => reject(new Error('天地图加载失败'));
        document.head.appendChild(script);
      });
    };
    loadScript().catch(error => {
      toast({
        title: '地图加载失败',
        description: error.message,
        variant: 'destructive'
      });
    });
  }, [scriptLoaded]);

  // 初始化地图
  useEffect(() => {
    if (!mapContainerRef.current || !scriptLoaded || mapLoaded) return;
    try {
      // 获取景区数据作为地图中心点
      const scenicData = getScenicDataFromLocal();
      let mapCenter;
      if (scenicData && scenicData.latitude && scenicData.longitude) {
        mapCenter = new T.LngLat(scenicData.longitude, scenicData.latitude);
      } else if (selectedPosition && selectedPosition.lat && selectedPosition.lng) {
        mapCenter = new T.LngLat(selectedPosition.lng, selectedPosition.lat);
      } else {
        mapCenter = new T.LngLat(userLocation.longitude, userLocation.latitude);
      }
      const mapInstance = new T.Map(mapContainerRef.current);
      mapInstance.centerAndZoom(mapCenter, 12);

      // 添加地图控件
      mapInstance.addControl(new T.Control.Zoom());
      mapInstance.addControl(new T.Control.Scale());
      mapInstance.setMapType(TMAP_NORMAL_MAP);

      // 添加左键点击事件 - 移除坐标拾取成功提示
      const handleMapClick = e => {
        if (disabled) return;
        try {
          const lnglat = e.lnglat;
          const newPosition = {
            lat: parseFloat(lnglat.lat.toFixed(6)),
            lng: parseFloat(lnglat.lng.toFixed(6))
          };
          setSelectedPosition(newPosition);
          onPositionSelect && onPositionSelect(newPosition);

          // 在地图上添加标记
          addMarker(newPosition, mapInstance);
          // 移除坐标拾取成功提示
        } catch (error) {
          console.error('坐标拾取错误:', error);
        }
      };

      // 绑定事件监听器
      mapInstance.addEventListener('click', handleMapClick);

      // 如果已有初始位置，在地图上标记
      if (selectedPosition) {
        addMarker(selectedPosition, mapInstance);
      }
      mapInstanceRef.current = mapInstance;
      setMapLoaded(true);
      // 移除地图加载成功的toast提示
    } catch (error) {
      console.error('地图初始化错误:', error);
      toast({
        title: '地图初始化失败',
        description: error.message,
        variant: 'destructive'
      });
    }

    // 清理函数
    return () => {
      if (mapInstanceRef.current) {
        try {
          // 移除事件监听器
          mapInstanceRef.current.removeEventListener('click', () => {});

          // 清除标记
          if (marker) {
            mapInstanceRef.current.removeOverLay(marker);
          }

          // 销毁地图实例
          mapInstanceRef.current.destroy();
          mapInstanceRef.current = null;
        } catch (error) {
          console.error('清理地图资源失败:', error);
        }
      }
    };
  }, [scriptLoaded, mapLoaded, disabled]);

  // 添加地图标记 - 使用React状态管理
  const addMarker = (position, mapInstance = mapInstanceRef.current) => {
    if (!mapInstance) return;
    try {
      // 清除之前的标记
      if (marker) {
        mapInstance.removeOverLay(marker);
        setMarker(null);
      }

      // 创建新标记
      const newMarker = new T.Marker(new T.LngLat(position.lng, position.lat));
      mapInstance.addOverLay(newMarker);
      setMarker(newMarker);
    } catch (error) {
      console.error('添加标记失败:', error);
    }
  };

  // 处理手动坐标输入
  const handleManualCoordinateChange = (field, value) => {
    if (!mapLoaded) return;
    const newPosition = {
      ...selectedPosition,
      [field]: parseFloat(value) || 0
    };
    setSelectedPosition(newPosition);
    onPositionSelect && onPositionSelect(newPosition);

    // 更新地图标记
    addMarker(newPosition);

    // 移动地图中心到新位置
    if (mapInstanceRef.current) {
      const center = new T.LngLat(newPosition.lng, newPosition.lat);
      mapInstanceRef.current.centerAndZoom(center, 15);
    }
  };
  return <Card className="p-0 border-gray-600">
      <CardContent className="p-0">
        <div ref={mapContainerRef} className="relative w-full h-80 rounded-lg overflow-hidden" style={{
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}>
          {/* 地图加载状态 */}
          {!mapLoaded && <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50 z-10">
              <div className="flex flex-col items-center space-y-2">
                <Loader className="h-8 w-8 text-blue-400 animate-spin" />
                <div className="text-white text-sm font-medium">地图加载中...</div>
              </div>
            </div>}
          
          {/* 地图操作提示 */}
          {!disabled && mapLoaded && <div className="absolute top-4 left-4 bg-black/80 text-white text-sm px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20 z-20">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-red-400" />
                <span>左键点击地图拾取坐标</span>
              </div>
            </div>}
          
          {/* 禁用状态遮罩 */}
          {disabled && mapLoaded && <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm z-30">
              <div className="text-white text-lg font-medium bg-black/60 px-4 py-3 rounded-lg border border-white/20">
                编辑模式下可设置坐标
              </div>
            </div>}
        </div>
        
        {/* 坐标信息显示和手动输入 */}
        <div className="mt-4 p-4 bg-gray-800/80 rounded-lg border border-gray-600">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 font-medium">纬度:</span>
              <input type="number" step="0.000001" value={selectedPosition ? selectedPosition.lat : ''} onChange={e => handleManualCoordinateChange('lat', e.target.value)} disabled={disabled || !mapLoaded} placeholder="39.9042" className="text-white font-mono bg-gray-700/50 px-3 py-2 rounded border border-gray-600 flex-1 min-w-0 disabled:opacity-50 disabled:cursor-not-allowed" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 font-medium">经度:</span>
              <input type="number" step="0.000001" value={selectedPosition ? selectedPosition.lng : ''} onChange={e => handleManualCoordinateChange('lng', e.target.value)} disabled={disabled || !mapLoaded} placeholder="116.4074" className="text-white font-mono bg-gray-700/50 px-3 py-2 rounded border border-gray-600 flex-1 min-w-0 disabled:opacity-50 disabled:cursor-not-allowed" />
            </div>
          </div>
          
          {selectedPosition && <div className="mt-3 pt-3 border-t border-gray-600">
              <div className="text-xs text-gray-400 flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span>坐标已选择：纬度 {selectedPosition.lat.toFixed(6)}，经度 {selectedPosition.lng.toFixed(6)}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                支持手动输入坐标或点击地图拾取
              </div>
            </div>}
        </div>
      </CardContent>
    </Card>;
}