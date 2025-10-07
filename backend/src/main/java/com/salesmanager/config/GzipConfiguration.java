package com.salesmanager.config;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.CommonsRequestLoggingFilter;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.zip.GZIPInputStream;

/**
 * Configuration pour la décompression automatique des payloads gzip
 * 
 * Gère les requêtes avec header Content-Encoding: gzip
 * Décompresse automatiquement le body avant traitement
 * 
 * @author Sales Manager Team
 * @version 1.0
 */
@Configuration
public class GzipConfiguration {

    /**
     * Filtre pour décompresser les requêtes gzip
     */
    @Bean
    public FilterRegistrationBean<GzipRequestFilter> gzipFilter() {
        FilterRegistrationBean<GzipRequestFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new GzipRequestFilter());
        registration.addUrlPatterns("/api/*");
        registration.setName("gzipRequestFilter");
        registration.setOrder(1);
        return registration;
    }

    /**
     * Filtre personnalisé pour décompression gzip
     */
    public static class GzipRequestFilter implements Filter {

        @Override
        public void init(FilterConfig filterConfig) throws ServletException {
            System.out.println("[GZIP_FILTER] Initialisé");
        }

        @Override
        public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
                throws IOException, ServletException {

            HttpServletRequest httpRequest = (HttpServletRequest) request;
            String contentEncoding = httpRequest.getHeader("Content-Encoding");

            // Si le contenu est gzip, décompresser
            if (contentEncoding != null && contentEncoding.contains("gzip")) {
                System.out.println("[GZIP_FILTER] Décompression du payload gzip...");

                try {
                    GzipHttpServletRequestWrapper wrappedRequest = new GzipHttpServletRequestWrapper(httpRequest);
                    chain.doFilter(wrappedRequest, response);
                } catch (Exception e) {
                    System.err.println("[GZIP_FILTER] Erreur décompression: " + e.getMessage());
                    throw new ServletException("Erreur lors de la décompression du payload gzip", e);
                }
            } else {
                // Pas de compression, passer la requête normale
                chain.doFilter(request, response);
            }
        }

        @Override
        public void destroy() {
            System.out.println("[GZIP_FILTER] Détruit");
        }
    }

    /**
     * Wrapper de requête pour gérer la décompression gzip
     */
    public static class GzipHttpServletRequestWrapper extends HttpServletRequestWrapper {

        private byte[] decompressedBody;

        public GzipHttpServletRequestWrapper(HttpServletRequest request) throws IOException {
            super(request);

            try {
                // Lire le body compressé
                GZIPInputStream gzipStream = new GZIPInputStream(request.getInputStream());
                ByteArrayInputStream decompressedStream = new ByteArrayInputStream(
                        gzipStream.readAllBytes());

                decompressedBody = decompressedStream.readAllBytes();

                System.out.println("[GZIP_FILTER] Payload décompressé: " + decompressedBody.length + " bytes");

            } catch (IOException e) {
                System.err.println("[GZIP_FILTER] Erreur lors de la décompression: " + e.getMessage());
                throw e;
            }
        }

        @Override
        public BufferedReader getReader() throws IOException {
            return new BufferedReader(
                    new InputStreamReader(new ByteArrayInputStream(decompressedBody)));
        }

        @Override
        public jakarta.servlet.ServletInputStream getInputStream() throws IOException {
            final ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(decompressedBody);

            return new jakarta.servlet.ServletInputStream() {
                @Override
                public int read() throws IOException {
                    return byteArrayInputStream.read();
                }

                @Override
                public boolean isFinished() {
                    return byteArrayInputStream.available() == 0;
                }

                @Override
                public boolean isReady() {
                    return true;
                }

                @Override
                public void setReadListener(jakarta.servlet.ReadListener readListener) {
                    // Not implemented
                }
            };
        }
    }
}
