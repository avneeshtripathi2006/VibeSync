package com.vibesync.backend;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        final String requestTokenHeader = request.getHeader("Authorization");

        String username = null;
        String jwtToken = null;

        // JWT Token is in the form "Bearer token". Remove Bearer word and get only the Token
        if (requestTokenHeader != null && requestTokenHeader.startsWith("Bearer ")) {
            jwtToken = requestTokenHeader.substring(7);
            try {
                username = jwtUtil.extractEmail(jwtToken);
            } catch (ExpiredJwtException e) {
                logger.warn("JWT Token has expired");
            } catch (SignatureException e) {
                logger.warn("JWT signature does not match");
            } catch (MalformedJwtException e) {
                logger.warn("Invalid JWT token");
            } catch (Exception e) {
                logger.warn("Unable to get JWT Token");
            }
        } else {
            String tokenFromParam = request.getParameter("token");
            if (tokenFromParam != null && !tokenFromParam.isBlank()) {
                if (tokenFromParam.startsWith("Bearer ")) {
                    jwtToken = tokenFromParam.substring(7);
                } else {
                    jwtToken = tokenFromParam;
                }
                try {
                    username = jwtUtil.extractEmail(jwtToken);
                } catch (ExpiredJwtException e) {
                    logger.warn("JWT Token has expired");
                } catch (SignatureException e) {
                    logger.warn("JWT signature does not match");
                } catch (MalformedJwtException e) {
                    logger.warn("Invalid JWT token");
                } catch (Exception e) {
                    logger.warn("Unable to get JWT Token");
                }
            } else {
                logger.warn("JWT Token does not begin with Bearer String");
            }
        }

        // Once we get the token validate it.
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

            // if token is valid configure Spring Security to manually set authentication
            if (jwtUtil.validateToken(jwtToken, userDetails)) {

                UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                usernamePasswordAuthenticationToken
                        .setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                // After setting the Authentication in the context, we specify
                // that the current user is authenticated. So it passes the Spring Security Configurations successfully.
                SecurityContextHolder.getContext().setAuthentication(usernamePasswordAuthenticationToken);
            }
        }
        filterChain.doFilter(request, response);
    }
}