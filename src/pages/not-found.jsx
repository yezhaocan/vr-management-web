// 404 页面
import React from 'react';
import { useNavigate } from '@/components/router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="text-6xl font-bold text-muted-foreground mb-4">404</div>
          <CardTitle className="text-2xl">页面未找到</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            抱歉，您访问的页面不存在或已被移除。
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => navigate('/dashboard')} className="flex items-center gap-2">
              <Home size={16} />
              返回首页
            </Button>
            <Button variant="outline" onClick={() => window.history.back()} className="flex items-center gap-2">
              <ArrowLeft size={16} />
              返回上页
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}