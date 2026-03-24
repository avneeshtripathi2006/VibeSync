# Build stage
FROM maven:3.9.5-eclipse-temurin-21 AS build
WORKDIR /app

# Copy whole repository context (can be optimized to copy only backend files)
COPY . .

# Ensure mvnw is executable (for hosts that may lose +x attrs)
RUN chmod +x ./mvnw

# Build backend artifact
RUN ./mvnw -f backend/pom.xml clean package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre
WORKDIR /app

# Expose the port your Spring Boot app runs on
EXPOSE 8080

# Copy the jar from build stage
COPY --from=build /app/backend/target/backend-0.0.1-SNAPSHOT.jar /app/app.jar

# Run the application
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
