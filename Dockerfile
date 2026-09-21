# syntax=docker/dockerfile:1

# Étage 1 : build du fat jar, sans Maven ni JDK sur la machine hôte
FROM bellsoft/liberica-openjdk-debian:25 AS build
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
COPY src src
RUN --mount=type=cache,target=/root/.m2 ./mvnw -B package -DskipTests

# Étage 2 : on éclate le fat jar en couches
FROM bellsoft/liberica-openjre-debian:25-cds AS extract
WORKDIR /builder
COPY --from=build /app/target/split-*.jar application.jar
RUN java -Djarmode=tools -jar application.jar extract --layers --destination extracted

# Étage 3 : l'image finale, une couche par famille de fichiers
FROM bellsoft/liberica-openjre-debian:25-cds
WORKDIR /application
COPY --from=extract /builder/extracted/dependencies/ ./
COPY --from=extract /builder/extracted/spring-boot-loader/ ./
COPY --from=extract /builder/extracted/snapshot-dependencies/ ./
COPY --from=extract /builder/extracted/application/ ./
RUN useradd --system --no-create-home spring
USER spring
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "application.jar"]
