// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Input, Card, CardContent, CardDescription, CardHeader, CardTitle, Alert, AlertDescription, useToast } from '@/components/ui';
// @ts-ignore;
import { Eye, EyeOff, User, Lock, Mail, Phone } from 'lucide-react';

export default function LoginPage(props) {
  const {
    $w,
    style,
    currentUser
  } = props;
  console.log(`🚀 ~ LoginPage ~ currentUser-> `, currentUser)
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
      console.log(`🚀 ~ checkLoginStatus ~ tcb-> `, tcb)
      const auth = tcb.auth();
      
      // 开发环境：自动登录
      if (import.meta.env.DEV) {
        console.log('🔧 开发环境：使用自动登录');
        await auth.signIn({
          username: 'administrator',
          password: 'Nucleus!123'
        });
      }
      
      if (!auth.currentUser) return;
      console.log(`🚀 检查 ~ checkLoginStatus ~ auth-> `, auth)
      const loginState = auth.hasLoginState();
      console.log(`🚀 检查 ~ checkLoginStatus ~ loginState-> `, loginState)
      
      if (loginState && loginState.user?.name !== 'anonymous') {
        // 已登录，跳转到dashboard
        $w.utils.redirectTo({
          pageId: 'dashboard',
          params: {}
        });
      } else if (import.meta.env.PROD) {
        // 生产环境：跳转到默认登录页
        console.log('🚀 生产环境：跳转到默认登录页');
        auth.toDefaultLoginPage({
          redirect_uri: 'https://vr-manage.genew.com/',
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

      let loginResult;
      
      // 根据环境选择登录方式
      if (import.meta.env.DEV) {
        // 开发环境：使用 signIn 方法登录
        console.log('🔧 开发环境：使用 signIn 登录');
        loginResult = await auth.signIn({
          username: formData.username.trim(),
          password: formData.password
        });
      } else {
        // 生产环境：跳转到默认登录页
        console.log('🚀 生产环境：跳转到默认登录页');
        auth.toDefaultLoginPage({
          redirect_uri: 'https://vr-manage.genew.com/',
        });
        return; // 跳转后不继续执行
      }

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
  return <div></div>
}