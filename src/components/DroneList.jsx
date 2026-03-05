// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, useToast } from '@/components/ui';
// @ts-ignore;
import { Drone, Battery } from 'lucide-react';

export function DroneList({
  $w,
  onDroneSelect
}) {
  const {
    toast
  } = useToast();
  const [drones, setDrones] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    loadDrones();
  }, []);
  const loadDrones = async () => {
    try {
      setLoading(true);
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'drone',
        methodName: 'wedaGetRecordsV2',
        params: {
          select: {
            $master: true
          },
          filter: {
            where: {} // 查询所有无人机，移除景区过滤
          },
          pageSize: 100,
          pageNumber: 1,
          orderBy: [{
            name: 'asc'
          }]
        }
      });
      setDrones(result.records || []);
    } catch (error) {
      console.error('无人机查询错误:', error);
      toast({
        title: '无人机列表加载失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const getBatteryColor = battery => {
    if (battery >= 70) return 'text-green-400';
    if (battery >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };
  if (loading) {
    return <div className="flex justify-center items-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-300">加载中...</span>
      </div>;
  }
  return <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">可用无人机</h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">{drones.length} 台设备</span>
          <button onClick={loadDrones} className="text-xs text-blue-400 hover:text-blue-300 underline">
            刷新
          </button>
        </div>
      </div>
      
      {drones.length === 0 ? <div className="text-center py-4 text-gray-500">
          <Drone className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">暂无可用无人机</p>
          <p className="text-xs mt-1">请先添加无人机设备</p>
        </div> : <div className="space-y-2">
          {drones.map(drone => <Card key={drone._id} className="bg-gray-800/50 border-gray-700 hover:border-blue-500/30 transition-all duration-200 cursor-pointer" onClick={() => onDroneSelect && onDroneSelect(drone)}>
              <CardContent className="p-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-full flex items-center justify-center border border-blue-500/30">
                      <Drone className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{drone.sn || '未知序列号'}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <span>型号: {drone.model || '未知型号'}</span>
                        <span>•</span>
                        <Battery className={`h-3 w-3 ${getBatteryColor(drone.battery)}`} />
                        <span className={getBatteryColor(drone.battery)}>{drone.battery || 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>)}
        </div>}
    </div>;
}