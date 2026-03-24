# Build stage
FROM maven:3.9.5-eclipse-temurin-25 AS build
WORKDIR /app

# Copy backend context contents (use if Docker context is backend directory)
COPY . .

# Ensure mvnw is executable (for hosts that may lose +x attrs)
RUN chmod +x ./mvnw

# Build backend artifact
RUN ./mvnw clean package -DskipTests

# Run stage
FROM eclipse-temurin:25-jre
WORKDIR /app

# Expose the port your Spring Boot app runs on
EXPOSE 8080

# Copy the jar from build stage
COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar /app/app.jar

# Run the application
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
