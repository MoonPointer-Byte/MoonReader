import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'; // 引入类型
import { message } from 'antd';
import { useAuthStore } from '../store/authStore';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => { // 加上类型注解
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error) // 加上类型注解
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => { // 加上类型注解
    const res = response.data;
    if (res.code === 200) {
      return res.data;
    }
    message.error(res.msg || '系统未知错误');
    if (res.code === 401) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== '/login') {
         window.location.href = '/login';
      }
    }
    return Promise.reject(new Error(res.msg || 'Error'));
  },
  (error: any) => { // 这里可以用 any，因为 error 类型不确定
    const msg = error.response?.data?.msg || error.message || '网络请求失败';
    message.error(msg);
    return Promise.reject(error);
  }
);

export default request;