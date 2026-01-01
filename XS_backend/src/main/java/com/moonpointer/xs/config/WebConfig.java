package com.moonpointer.xs.config;

import com.moonpointer.xs.interceptor.AuthInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final AuthInterceptor authInterceptor;

    @Value("${app.upload-path:./avatar/}")
    private String uploadPath;

    @Value("${app.chat-path:./chatavatar/}")
    private String chatavatarPath;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/api/**") // 拦截所有接口
                .excludePathPatterns(
                        "/api/auth/login",
                        "/api/auth/register",
                        "/api/novel/list" // 假设已公开
                        ,"/files/**"
                );
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 将 /files/** 映射到本地磁盘目录
        registry.addResourceHandler("/files/**")
                .addResourceLocations("file:"+uploadPath)
                .addResourceLocations("file:"+chatavatarPath);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")                  // 对所有路径生效
                .allowedOriginPatterns("*")         // 允许所有来源 (例如 localhost:5173)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // 允许的方法
                .allowedHeaders("*")                // 允许所有请求头
                .allowCredentials(true)             // 允许携带凭证(Token/Cookie)
                .maxAge(3600);                      // 预检请求缓存 1 小时
    }

}