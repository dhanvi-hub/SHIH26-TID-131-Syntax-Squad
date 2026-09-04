# System Architecture and Pipelines

This document contains the PlantUML diagrams detailing the architecture, data pipeline, and end-to-end flow of the AI Fraud Detection Application.

## 1. System Architecture

```plantuml
@startuml
!theme plain
skinparam componentStyle uml2

package "Frontend (Next.js App Router)" {
  [Dashboard View]
  [Investigation View (/investigation/[txnId])]
  [UI Components (Radix, Tailwind)]
  [Data Visualizations (Recharts, Maps)]
}

package "Backend Services" {
  [API Gateway]
  [Fraud Detection Service]
  [Transaction Service]
  [User Management Service]
}

database "Data Storage" {
  [Transaction Database]
  [AI Model Storage]
}

[Dashboard View] --> [API Gateway] : REST/GraphQL
[Investigation View (/investigation/[txnId])] --> [API Gateway] : REST/GraphQL

[API Gateway] --> [Fraud Detection Service]
[API Gateway] --> [Transaction Service]
[API Gateway] --> [User Management Service]

[Transaction Service] --> [Transaction Database]
[Fraud Detection Service] --> [AI Model Storage]
[Fraud Detection Service] --> [Transaction Database]
@enduml
```

## 2. Data Processing Pipeline

```plantuml
@startuml
!theme plain
skinparam activityShape octagon

start
:Receive New Transaction;
:Data Validation & Enrichment;
:Feature Extraction;
note right: Extract IP, Location, Amount, Velocity
:Pass to AI Inference Engine;
:Generate Fraud Risk Score;
if (Risk Score > Threshold?) then (yes)
  :Flag Transaction as Suspicious;
  :Trigger Alert to Dashboard;
else (no)
  :Mark as Safe;
endif
:Store Results in Database;
stop
@enduml
```

## 3. End-to-End System Architecture Flow

```plantuml
@startuml
!theme plain
actor "Fraud Analyst" as Analyst
participant "Next.js Frontend" as FE
participant "API Backend" as API
participant "AI Engine" as AI
database "Database" as DB

== Real-time Monitoring ==
API -> FE : Push/Poll New Suspicious Transactions
FE -> Analyst : Display Alerts on Dashboard

== Investigation Workflow ==
Analyst -> FE : Click on Transaction (txnId)
FE -> API : GET /api/transactions/{txnId}
API -> DB : Fetch Transaction Details
DB --> API : Return Details
API --> FE : Return Transaction JSON
FE -> Analyst : Render Investigation Page (Charts, Map)

== Decision Making ==
Analyst -> FE : Submit Decision (e.g., "Block Account")
FE -> API : POST /api/transactions/{txnId}/action
API -> DB : Update Transaction Status
API -> AI : Feedback Loop (Update Model Data)
API --> FE : Success Response
FE -> Analyst : Show Toast Notification (Success)
@enduml
```
