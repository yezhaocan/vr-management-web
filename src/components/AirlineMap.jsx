// @ts-ignore;
import React, { useEffect, useRef } from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
// @ts-ignore;
import { MapPin, Navigation } from 'lucide-react';

export function AirlineMap({
  route,
  className = ''
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  useEffect(() => {
    if (!route?.waypoints || route.waypoints.length === 0) return;

    // 初始化地图
    const initMap = () => {
      // 创建地图容器
      if (!mapRef.current) return;

      // 清除之前的实例
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // 创建简单的SVG地图
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 400 300');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '200');
      svg.style.borderRadius = '8px';
      svg.style.backgroundColor = '#1f2937';
      svg.style.border = '1px solid #374151';

      // 计算航点坐标范围，进行归一化处理
      const lats = route.waypoints.map(wp => wp.lat).filter(lat => lat);
      const lngs = route.waypoints.map(wp => wp.lng).filter(lng => lng);
      if (lats.length === 0 || lngs.length === 0) {
        // 如果没有有效坐标，显示提示
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '200');
        text.setAttribute('y', '150');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#9ca3af');
        text.setAttribute('font-size', '14');
        text.textContent = '暂无有效坐标数据';
        svg.appendChild(text);
        mapRef.current.innerHTML = '';
        mapRef.current.appendChild(svg);
        return;
      }
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      // 计算缩放比例和偏移量
      const latRange = maxLat - minLat || 0.01;
      const lngRange = maxLng - minLng || 0.01;
      const padding = 0.1;
      const scaleX = 360 / (lngRange + padding * 2);
      const scaleY = 270 / (latRange + padding * 2);
      const scale = Math.min(scaleX, scaleY);
      const offsetX = (400 - (lngRange + padding * 2) * scale) / 2;
      const offsetY = (300 - (latRange + padding * 2) * scale) / 2;

      // 绘制连线
      const validWaypoints = route.waypoints.filter(wp => wp.lat && wp.lng);
      if (validWaypoints.length > 1) {
        for (let i = 0; i < validWaypoints.length - 1; i++) {
          const wp1 = validWaypoints[i];
          const wp2 = validWaypoints[i + 1];
          const x1 = offsetX + (wp1.lng - (minLng - padding)) * scale;
          const y1 = 300 - (offsetY + (wp1.lat - (minLat - padding)) * scale);
          const x2 = offsetX + (wp2.lng - (minLng - padding)) * scale;
          const y2 = 300 - (offsetY + (wp2.lat - (minLat - padding)) * scale);
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', x1);
          line.setAttribute('y1', y1);
          line.setAttribute('x2', x2);
          line.setAttribute('y2', y2);
          line.setAttribute('stroke', '#3b82f6');
          line.setAttribute('stroke-width', '2');
          line.setAttribute('stroke-dasharray', '5,5');
          svg.appendChild(line);
        }
      }

      // 绘制航点
      validWaypoints.forEach((waypoint, index) => {
        const x = offsetX + (waypoint.lng - (minLng - padding)) * scale;
        const y = 300 - (offsetY + (waypoint.lat - (minLat - padding)) * scale);

        // 航点圆圈
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', '8');
        circle.setAttribute('fill', '#ef4444');
        circle.setAttribute('stroke', '#ffffff');
        circle.setAttribute('stroke-width', '2');
        svg.appendChild(circle);

        // 航点序号
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y + 3);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#ffffff');
        text.setAttribute('font-size', '10');
        text.setAttribute('font-weight', 'bold');
        text.textContent = (index + 1).toString();
        svg.appendChild(text);

        // 航点名称标签
        if (waypoint.name) {
          const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          label.setAttribute('x', x);
          label.setAttribute('y', y - 15);
          label.setAttribute('text-anchor', 'middle');
          label.setAttribute('fill', '#d1d5db');
          label.setAttribute('font-size', '10');
          label.textContent = waypoint.name;
          svg.appendChild(label);
        }
      });
      mapRef.current.innerHTML = '';
      mapRef.current.appendChild(svg);
      mapInstanceRef.current = svg;
    };
    initMap();
  }, [route]);
  return <Card className={`bg-gray-800/50 border-gray-700 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-300 flex items-center">
          <Navigation className="w-4 h-4 mr-2 text-blue-400" />
          航线地图预览
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={mapRef} className="h-48 flex items-center justify-center bg-gray-900/50 rounded-lg m-4">
          <div className="text-gray-500 text-sm">正在加载地图...</div>
        </div>
        {route?.waypoints && route.waypoints.length > 0 && <div className="px-4 pb-3">
            <div className="text-xs text-gray-400">
              共 {route.waypoints.length} 个航点，已在地图上连线显示
            </div>
          </div>}
      </CardContent>
    </Card>;
}