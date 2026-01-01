package com.moonpointer.xs.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    // 1. 生成一个符合安全标准的密钥 (注意：实际生产中这串字符串应该非常长，或者写在配置文件里)
    // 这里演示使用硬编码的 Base64 密钥，长度至少要 32 字节 (256位)
    private static final String SECRET_STRING = "c2VsZWN0bmFtZXMwMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM=";
    private static final Key KEY = Keys.hmacShaKeyFor(Decoders.BASE64.decode(SECRET_STRING));

    private static final long EXPIRE_TIME = 7 * 24 * 60 * 60 * 1000L; // 7天

    public String createToken(Long userId, String username, String role) {
        return Jwts.builder()
                .setSubject(username)
                .claim("userId", userId)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRE_TIME))
                // 新版写法: signWith(Key key, SignatureAlgorithm alg) 或 signWith(Key)
                .signWith(KEY, SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser() // 使用 parserBuilder
                .setSigningKey(KEY) // 设置密钥
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}