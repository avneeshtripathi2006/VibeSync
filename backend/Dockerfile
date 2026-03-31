# Build stage
FROM maven:3.9.5-eclipse-temurin-21 AS build
WORKDIR /app

# Copy only needed files for Maven to minimize build context
# When Render/CI sets backend folder as build context, these paths are just local.
COPY pom.xml ./
COPY src ./src
COPY mvnw ./
COPY .mvn ./.mvn

RUN chmod +x ./mvnw

# Build backend artifact and delete Maven cache in same layer to reduce size
RUN ./mvnw -B clean package -DskipTests && rm -rf /root/.m2/repository

# Run stage
FROM eclipse-temurin:21-jre
WORKDIR /app

# Expose the port your Spring Boot app runs on
EXPOSE 8080

# Copy executable jar
COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar /app/app.jar

# Run the application
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
