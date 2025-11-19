// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Input, Card, CardContent, CardDescription, CardHeader, CardTitle, Alert, AlertDescription, useToast } from '@/components/ui';
// @ts-ignore;
import { Eye, EyeOff, User, Lock, Mail, Phone } from 'lucide-react';

export default function LoginPage(props) {
  const {
    $w,
    style
  } = props;
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  // 检查是否已登录
  useEffect(() => {
    checkLoginStatus();
  }, []);
  const checkLoginStatus = async () => {
    try {
      const tcb = await $w.cloud.getCloudInstance();
      const auth = tcb.auth();
      console.log(`🚀 检查 ~ checkLoginStatus ~ auth-> `, auth)
      const loginState = auth.hasLoginState();
      console.log(`🚀 检查 ~ checkLoginStatus ~ loginState-> `, loginState && loginState.user.name !== 'anonymous')
      if (loginState && loginState.user?.name?.toLocaleLowerCase() !== 'anonymous') {
        // 已登录，跳转到dashboard
        $w.utils.redirectTo({
          pageId: 'dashboard',
          params: {}
        });
      } else {
        $w.utils.redirectTo({
          pageId: 'login',
          params: {}
        });
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
    }
  };
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };
  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = '请输入用户名/手机号/邮箱';
    }
    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 6) {
      newErrors.password = '密码长度至少6位';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleLogin = async e => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    try {
      const tcb = await $w.cloud.getCloudInstance();
      const auth = tcb.auth();

      // 使用 signIn 方法登录
      const loginResult = await auth.signIn({
        username: formData.username.trim(),
        password: formData.password
      });
      console.log(`🚀 ~ handleLogin ~ loginResult-> `, loginResult)
      if (loginResult) {
        toast({
          title: '登录成功',
          description: '欢迎回来！',
          duration: 2000
        });

        // 跳转到dashboard
        setTimeout(() => {
          $w.utils.redirectTo({
            pageId: 'dashboard',
            params: {}
          });
        }, 1000);
      }
    } catch (error) {
      console.error('登录失败:', error);
      let errorMessage = '登录失败，请重试';
      if (error.code === 'INVALID_PASSWORD') {
        errorMessage = '密码错误，请重新输入';
      } else if (error.code === 'USER_NOT_FOUND') {
        errorMessage = '用户不存在，请检查用户名';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = '网络错误，请检查网络连接';
      }
      toast({
        title: '登录失败',
        description: errorMessage,
        variant: 'destructive',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };
  const handleKeyPress = e => {
    if (e.key === 'Enter') {
      handleLogin(e);
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <style>{`
        .login-card {
          backdrop-filter: blur(10px);
          background: rgba(17, 24, 39, 0.8);
          border: 1px solid rgba(75, 85, 99, 0.3);
        }
        .input-focus:focus {
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
        }
        .gradient-button {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          transition: all 0.3s ease;
        }
        .gradient-button:hover {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        .gradient-button:active {
          transform: translateY(0);
        }
      `}</style>
      
      <Card className="login-card w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">欢迎登录</CardTitle>
          <CardDescription className="text-gray-400">
            请输入您的登录信息
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">用户名/手机号/邮箱</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input type="text" placeholder="请输入用户名、手机号或邮箱" value={formData.username} onChange={e => handleInputChange('username', e.target.value)} onKeyPress={handleKeyPress} className={`pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 input-focus ${errors.username ? 'border-red-500' : 'border-gray-600'}`} />
              </div>
              {errors.username && <p className="text-sm text-red-400">{errors.username}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input type={showPassword ? 'text' : 'password'} placeholder="请输入密码" value={formData.password} onChange={e => handleInputChange('password', e.target.value)} onKeyPress={handleKeyPress} className={`pl-10 pr-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 input-focus ${errors.password ? 'border-red-500' : 'border-gray-600'}`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-400">{errors.password}</p>}
            </div>

            <Button type="submit" disabled={loading} className="w-full gradient-button text-white font-medium">
              {loading ? <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>登录中...</span>
                </div> : '登录'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              忘记密码？请联系管理员
            </p>
          </div>
        </CardContent>
      </Card>
    </div>;
}