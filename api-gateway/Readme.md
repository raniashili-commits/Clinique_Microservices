# Clinique Microservices

Application de gestion de clinique basée sur une architecture microservices.

## Architecture

- **API Gateway** (port 3000) — REST + GraphQL
- **MS Patients** (port 50051) — gRPC + SQLite
- **MS Rendez-vous** (port 50052) — gRPC + SQLite + Kafka Producer
- **MS Notifications** (port 50053) — gRPC + RxDB + Kafka Consumer
- **Kafka Broker** (port 9092) — Communication asynchrone

## Technologies

- Node.js, Express, Apollo Server
- gRPC + Protobuf
- GraphQL
- Kafka (KafkaJS)
- SQLite3, RxDB

## Topics Kafka

| Topic | Producteur | Consommateur | Déclencheur |
|-------|-----------|--------------|-------------|
| rdv.created | MS Rendez-vous | MS Notifications | Création d'un rendez-vous |

## Endpoints REST

### Patients
| Méthode | URL | Description |
|---------|-----|-------------|
| GET | /patients | Liste tous les patients |
| GET | /patients/:id | Récupère un patient |
| POST | /patients | Crée un patient |
| PUT | /patients/:id | Modifie un patient |
| DELETE | /patients/:id | Supprime un patient |

### Rendez-vous
| Méthode | URL | Description |
|---------|-----|-------------|
| GET | /rendezvous | Liste tous les rendez-vous |
| GET | /rendezvous/:id | Récupère un rendez-vous |
| POST | /rendezvous | Crée un rendez-vous |
| PUT | /rendezvous/:id | Modifie un rendez-vous |
| DELETE | /rendezvous/:id | Supprime un rendez-vous |

### Notifications
| Méthode | URL | Description |
|---------|-----|-------------|
| GET | /notifications/:patientId | Notifications d'un patient |

## Installation

### Prérequis
- Node.js
- Java 17+
- Kafka 4.2

### Démarrage

1. Démarrer Kafka :
cd C:\kafka_2.13-4.2.0
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
.\bin\windows\kafka-server-start.bat config\server.properties

2. Démarrer les microservices :
cd ms-patients && node index.js
cd ms-rendezvous && node index.js
cd ms-notifications && node index.js
cd api-gateway && node index.js

## Schéma GraphQL

type Patient, Rendezvous, Notification
Queries : patient, patients, rendezvous, allRendezvous, notifications
Mutations : createPatient, updatePatient, deletePatient, createRendezvous, updateRendezvous, deleteRendezvous

## Bases de données

| Microservice | Base | Type |
|-------------|------|------|
| MS Patients | patients.sqlite | SQLite3 (SQL) |
| MS Rendez-vous | rendezvous.sqlite | SQLite3 (SQL) |
| MS Notifications | notifications.json | RxDB (NoSQL) |