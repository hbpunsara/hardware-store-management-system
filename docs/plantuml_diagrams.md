# PlantUML Source Codes

Below are the PlantUML source codes for your system diagrams. You can copy these and drop them into any PlantUML viewer, text editor extension, or university diagram tool that accepts standard `.puml` format. 

## 1. Use Case Diagram

```plantuml
@startuml
left to right direction
actor "Cashier" as c
actor "Administrator" as a
actor "Automated Daemon" as sys

package "Cloud-Based Hardware Store Management System" {
  usecase "Process Sale (POS)" as UC1
  usecase "Search Inventory" as UC2
  usecase "Track Attendance" as UC3
  usecase "Manage Inventory (CRUD)" as UC4
  usecase "View Analytics Dashboard" as UC5
  usecase "Run Payroll Calculations" as UC6
  usecase "Manage Roles & Access" as UC7
  usecase "Generate Low Stock Alerts" as UC8
  usecase "Send External Telemetry" as UC9
}

c --> UC1
c --> UC2
c --> UC3

a --> UC2
a --> UC4
a --> UC5
a --> UC6
a --> UC7

sys --> UC8
sys --> UC9
@enduml
```

## 2. Class Diagram

```plantuml
@startuml
class User {
  + UUID id
  + String username
  + String hashedPassword
  + String role
  + login()
}
class Product {
  + String sku
  + String name
  + Float price
  + Integer stockQuantity
  + Integer reorderThreshold
  + updateStock()
}
class Supplier {
  + UUID id
  + String name
  + String contact
}
class Sale {
  + UUID id
  + Date timestamp
  + Float totalAmount
  + UUID cashierId
  + processPayment()
}
class SaleItem {
  + UUID id
  + Integer quantity
  + Float unitPrice
}
class Attendance {
  + UUID id
  + Date checkIn
  + Date checkOut
}
class Payroll {
  + UUID id
  + Float basePay
  + Float overtime
  + Float deductions
  + Float netPay
  + calculate()
}
class Loyalty {
  + String customerPhone
  + Integer points
  + addPoints()
  + redeemPoints()
}

User "1" -- "*" Attendance : has logs >
User "1" -- "*" Payroll : receives >
User "1" -- "*" Sale : processes >
Product "*" -- "1" Supplier : supplied by >
Sale "1" *-- "*" SaleItem : contains >
SaleItem "*" -- "1" Product : references >
Sale "*" -- "0..1" Loyalty : associates with >
@enduml
```

## 3. ER Diagram

```plantuml
@startuml
entity USERS {
  * id : uuid <<PK>>
  --
  username : string
  hashed_password : string
  role : enum
}
entity PRODUCTS {
  * sku : string <<PK>>
  --
  name : string
  price : float
  stock_quantity : int
  reorder_threshold : int
  supplier_id : uuid <<FK>>
}
entity SUPPLIERS {
  * id : uuid <<PK>>
  --
  name : string
  contact_info : string
}
entity SALES {
  * id : uuid <<PK>>
  --
  created_at : timestamp
  total_amount : float
  cashier_id : uuid <<FK>>
}
entity SALES_ITEMS {
  * id : uuid <<PK>>
  --
  sale_id : uuid <<FK>>
  product_sku : string <<FK>>
  quantity : int
  unit_price : float
}
entity ATTENDANCES {
  * id : uuid <<PK>>
  --
  user_id : uuid <<FK>>
  check_in : timestamp
  check_out : timestamp
}
entity PAYROLLS {
  * id : uuid <<PK>>
  --
  user_id : uuid <<FK>>
  base_pay : float
  overtime : float
  deductions : float
  net_pay : float
}
entity LOYALTIES {
  * customer_phone : string <<PK>>
  --
  points : int
}

USERS ||--o{ ATTENDANCES
USERS ||--o{ PAYROLLS
USERS ||--o{ SALES
SUPPLIERS ||--o{ PRODUCTS
SALES ||--|{ SALES_ITEMS
PRODUCTS ||--o{ SALES_ITEMS
LOYALTIES ||--o{ SALES
@enduml
```

## 4. High-Level Architecture Diagram

```plantuml
@startuml
node "Client Tier" {
  [React.js Frontend / Electron Display] as UI
}

node "Application Logic Tier" {
  [Node.js + Express REST API] as API
  [Drizzle ORM Engine] as ORM
  [Zod Payload Validator] as Validator
  [Python Flask ML Microservice] as ML
}

database "Persistence Layer" {
  [Cloud PostgreSQL / Local SQLite] as DB
}

UI .down.> API : HTTP/REST Traffic
API --> ORM
API --> Validator
ORM .down.> DB : Sanitized SQL Queries
ML .down.> DB : Read-Only Analytical Queries
@enduml
```

## 5. Networking Diagram

```plantuml
@startuml
actor "Hardware Store Staff" as User
cloud "Internet Pipeline" as Internet

package "Cloud / Local Deployment Environment" {
  node "Reverse Proxy / API Gateway\ne.g., Nginx" as LB
  
  node "Presentation Subnet" {
    [Static Assets Host\nFrontend Bundles] as CDN
  }
  
  node "Execution Subnet" {
    [Node.js Backend Server\nListener: Port 5000] as NodeServer
    [Python Machine Learning Service\nListener: Port 5001] as PyServer
  }
  
  database "Database Subnet" {
    [Primary Neon PostgreSQL DB] as PrimaryDB
  }
}

User --> Internet : TLS 1.3 encrypted
Internet --> LB

LB --> CDN : Route: /
LB --> NodeServer : Route: /api/*
LB --> PyServer : Route: /ml/*

NodeServer --> PrimaryDB : TCP: Port 5432
PyServer --> PrimaryDB : TCP: Port 5432
@enduml
```
