// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import {
  Button,
  Input,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
  useToast,
} from '@/components/ui';
// @ts-ignore;
import { Eye, EyeOff, User, Lock, Mail, Phone } from 'lucide-react';

export default function LoginPage(props) {
  const { $w, style, currentUser } = props;
  console.log(`🚀 ~ LoginPage ~ currentUser-> `, currentUser);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  // 检查是否已登录
  useEffect(() => {
    checkLoginStatus();
  }, []);
  const checkLoginStatus = async () => {
    try {
      const tcb = await $w.cloud.getCloudInstance();
      console.log(`🚀 ~ checkLoginStatus ~ tcb-> `, tcb);
      const auth = tcb.auth();
      await auth.signIn({
        username: 'administrator',
        password: 'Nucleus!123',
      });
      if (!auth.currentUser) return;
      console.log(`🚀 检查 ~ checkLoginStatus ~ auth-> `, auth);
      const loginState = auth.hasLoginState();
      console.log(`🚀 检查 ~ checkLoginStatus ~ loginState-> `, loginState);
      if (loginState && loginState.user?.name !== 'anonymous') {
        // 已登录，跳转到dashboard
        $w.utils.redirectTo({
          pageId: 'dashboard',
          params: {},
        });
      } else {
        // 生产环境：跳转到默认登录页
        auth.toDefaultLoginPage({
          redirect_uri: 'https://vr-manage.genew.com/',
        });
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
    }
  };

  return <div></div>;
}
