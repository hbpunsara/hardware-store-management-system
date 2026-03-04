# UML & System Diagrams for the Hardware Store Management System

Below are the Mermaid.js UML codes for the diagrams explicitly outlined in your Interim Report. You can copy these code blocks into any Markdown viewer that supports Mermaid (like GitHub, Notion, or Obsidian) or use the [Mermaid Live Editor](https://mermaid.live/) to generate the images.

---

## 1. Use Case Diagram

```mermaid
actor Cashier
actor Administrator
actor "Automated Daemon" as System

package "Hardware Store Management System" {
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

Cashier --> UC1
Cashier --> UC2
Cashier --> UC3

Administrator --> UC2
Administrator --> UC4
Administrator --> UC5
Administrator --> UC6
Administrator --> UC7

System --> UC8
System --> UC9
```

---

## 2. Class Diagram

```mermaid
classDiagram
    class User {
        +UUID id
        +String username
        +String hashedPassword
        +String role
        +login()
    }
    class Product {
        +String sku
        +String name
        +Float price
        +Integer stockQuantity
        +Integer reorderThreshold
        +updateStock()
    }
    class Supplier {
        +UUID id
        +String name
        +String contact
    }
    class Sale {
        +UUID id
        +Date timestamp
        +Float totalAmount
        +UUID cashierId
        +processPayment()
    }
    class SaleItem {
        +UUID id
        +Integer quantity
        +Float unitPrice
    }
    class Attendance {
        +UUID id
        +Date checkIn
        +Date checkOut
    }
    class Payroll {
        +UUID id
        +Float basePay
        +Float overtime
        +Float deductions
        +Float netPay
        +calculate()
    }
    class Loyalty {
        +String customerPhone
        +Integer points
        +addPoints()
        +redeemPoints()
    }

    User "1" -- "*" Attendance : has logs
    User "1" -- "*" Payroll : receives
    User "1" -- "*" Sale : processes 
    Product "*" -- "1" Supplier : supplied by
    Sale "1" -- "*" SaleItem : contains
    SaleItem "*" -- "1" Product : references
    Sale "*" -- "0..1" Loyalty : associates with
```

---

## 3. ER Diagram

```mermaid
erDiagram
    USERS {
        uuid id PK
        string username
        string hashed_password
        enum role
    }
    PRODUCTS {
        string sku PK
        string name
        float price
        int stock_quantity
        int reorder_threshold
        uuid supplier_id FK
    }
    SUPPLIERS {
        uuid id PK
        string name
        string contact_info
    }
    SALES {
        uuid id PK
        timestamp created_at
        float total_amount
        uuid cashier_id FK
    }
    SALES_ITEMS {
        uuid id PK
        uuid sale_id FK
        string product_sku FK
        int quantity
        float unit_price
    }
    ATTENDANCES {
        uuid id PK
        uuid user_id FK
        timestamp check_in
        timestamp check_out
    }
    PAYROLLS {
        uuid id PK
        uuid user_id FK
        float base_pay
        float overtime
        float deductions
        float net_pay
    }
    LOYALTIES {
        string customer_phone PK
        int points
    }

    USERS ||--o{ ATTENDANCES : "logs"
    USERS ||--o{ PAYROLLS : "receives"
    USERS ||--o{ SALES : "processes"
    SUPPLIERS ||--o{ PRODUCTS : "supplies"
    SALES ||--|{ SALES_ITEMS : "contains"
    PRODUCTS ||--o{ SALES_ITEMS : "sold_in"
    LOYALTIES ||--o{ SALES : "earns_points_on"
```

---

## 4. High-Level Architecture Diagram

```mermaid
graph TD
    subgraph Client Tier
        UI[React.js Frontend / Electron Display]
    end

    subgraph Application Logic Tier
        API[Node.js + Express REST API]
        ORM[Drizzle ORM Engine]
        Validator[Zod Payload Validator]
        ML[Python Flask ML Microservice]
        
        API --> ORM
        API --> Validator
    end

    subgraph Persistence Layer
        DB[(Cloud PostgreSQL / Local SQLite)]
    end

    UI -- HTTP/REST Traffic --> API
    ORM -- Sanitized SQL Queries --> DB
    ML -- Read-Only Analytical Queries --> DB
```

---

## 5. Networking Diagram

```mermaid
graph TD
    User[(Hardware Store Staff)]
    Internet((Internet Pipeline))
    
    subgraph Cloud / Local Deployment Environment
        LB[Reverse Proxy / API Gateway\ne.g., Nginx]
        
        subgraph Presentation Subnet
            CDN[Static Assets Host\nFrontend Bundles]
        end
        
        subgraph Execution Subnet
            NodeServer[Node.js Backend Server\nListener: Port 5000]
            PyServer[Python Machine Learning Service\nListener: Port 5001]
        end
        
        subgraph Database Subnet
            PrimaryDB[(Primary Neon PostgreSQL DB)]
        end
    end
    
    User -->|TLS 1.3 encrypted| Internet
    Internet --> LB
    
    LB -->|Route: /| CDN
    LB -->|Route: /api/*| NodeServer
    LB -->|Route: /ml/*| PyServer
    
    NodeServer -->|TCP: Port 5432| PrimaryDB
    PyServer -->|TCP: Port 5432| PrimaryDB
```
