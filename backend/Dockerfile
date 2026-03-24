# Build stage
FROM maven:3.9.5-eclipse-temurin-21 AS build
WORKDIR /app

# Copy only backend project source and wrapper
COPY backend ./backend

# Ensure mvnw is executable (for hosts that may lose +x attrs)
RUN chmod +x ./backend/mvnw

# Build backend artifact
WORKDIR /app/backend
RUN ./mvnw clean package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre
WORKDIR /app

# Expose the port your Spring Boot app runs on
EXPOSE 8080

# Copy the jar from build stage
COPY --from=build /app/backend/target/backend-0.0.1-SNAPSHOT.jar /app/app.jar

# Run the application
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
