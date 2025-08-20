package com.salesmanager.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Configuration
public class JacksonConfig {

    private static final String DATE_TIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'";
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern(DATE_TIME_FORMAT);

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        JavaTimeModule javaTimeModule = new JavaTimeModule();
        
        // Custom deserializer for LocalDateTime to handle ISO strings with timezone
        javaTimeModule.addDeserializer(LocalDateTime.class, new LocalDateTimeDeserializer(DATE_TIME_FORMATTER) {
            @Override
            public LocalDateTime deserialize(com.fasterxml.jackson.core.JsonParser parser, 
                                           com.fasterxml.jackson.databind.DeserializationContext context) 
                                           throws java.io.IOException {
                String dateString = parser.getText();
                try {
                    // Handle ISO string with Z timezone
                    if (dateString.endsWith("Z")) {
                        return LocalDateTime.parse(dateString.substring(0, dateString.length() - 1));
                    }
                    // Handle ISO string without timezone
                    return LocalDateTime.parse(dateString);
                } catch (Exception e) {
                    // Fallback to default parsing
                    return super.deserialize(parser, context);
                }
            }
        });
        
        javaTimeModule.addSerializer(LocalDateTime.class, new LocalDateTimeSerializer(DATE_TIME_FORMATTER));

        return Jackson2ObjectMapperBuilder.json()
                .modules(javaTimeModule)
                .build();
    }
}
