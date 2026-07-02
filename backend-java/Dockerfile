# Stage 1: Build the application
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy the pom.xml file to download dependencies first (caching)
COPY pom.xml .
# Note: You can uncomment the line below to cache dependencies and speed up builds
# RUN mvn dependency:go-offline

# Copy the rest of the source code
COPY src ./src

# Package the application (skip tests to speed up the build)
RUN mvn clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copy the generated JAR file from the build stage
COPY --from=build /app/target/shop-1.0.0.jar app.jar

# Expose the port the app runs on
EXPOSE 8080

# Start the application
ENTRYPOINT ["java", "-jar", "app.jar"]
