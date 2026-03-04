# GraphViz (DOT) Source Codes

Below are the GraphViz `dot` source codes for the requested diagrams. You can copy these and process them using the `dot` command-line tool or any online GraphViz visualizer (e.g., WebGraphviz, GraphvizOnline) to automatically draw ("drow") the images.

## 1. Use Case Diagram

```dot
digraph UseCase {
    rankdir=LR;
    
    node [shape=box, style=rounded];
    UC1 [label="Process Sale (POS)"];
    UC2 [label="Search Inventory"];
    UC3 [label="Track Attendance"];
    UC4 [label="Manage Inventory (CRUD)"];
    UC5 [label="View Analytics Dashboard"];
    UC6 [label="Run Payroll Calculations"];
    UC7 [label="Manage Roles & Access"];
    UC8 [label="Generate Low Stock Alerts"];
    UC9 [label="Send External Telemetry"];

    node [shape=plaintext];
    Cashier;
    Administrator;
    Daemon [label="Automated Daemon"];

    Cashier -> UC1;
    Cashier -> UC2;
    Cashier -> UC3;

    Administrator -> UC2;
    Administrator -> UC4;
    Administrator -> UC5;
    Administrator -> UC6;
    Administrator -> UC7;

    Daemon -> UC8;
    Daemon -> UC9;
}
```

## 2. Class Diagram

```dot
digraph ClassDiagram {
    node [shape=record];
    
    User [label="{User | + id: UUID\l+ username: String\l+ hashedPassword: String\l+ role: String\l | + login()\l}"];
    Product [label="{Product | + sku: String\l+ name: String\l+ price: Float\l+ stockQuantity: Integer\l+ reorderThreshold: Integer\l | + updateStock()\l}"];
    Supplier [label="{Supplier | + id: UUID\l+ name: String\l+ contact: String\l | }"];
    Sale [label="{Sale | + id: UUID\l+ timestamp: Date\l+ totalAmount: Float\l+ cashierId: UUID\l | + processPayment()\l}"];
    SaleItem [label="{SaleItem | + id: UUID\l+ quantity: Integer\l+ unitPrice: Float\l | }"];
    Attendance [label="{Attendance | + id: UUID\l+ checkIn: Date\l+ checkOut: Date\l | }"];
    Payroll [label="{Payroll | + id: UUID\l+ basePay: Float\l+ overtime: Float\l+ deductions: Float\l+ netPay: Float\l | + calculate()\l}"];
    Loyalty [label="{Loyalty | + customerPhone: String\l+ points: Integer\l | + addPoints()\l+ redeemPoints()\l}"];

    User -> Attendance [label="has logs", arrowhead=vee];
    User -> Payroll [label="receives", arrowhead=vee];
    User -> Sale [label="processes", arrowhead=vee];
    Product -> Supplier [label="supplied by", arrowhead=vee];
    Sale -> SaleItem [label="contains", arrowhead=diamond];
    SaleItem -> Product [label="references", arrowhead=vee];
    Sale -> Loyalty [label="associates with", arrowhead=vee];
}
```

## 3. ER Diagram

```dot
digraph ERDiagram {
    rankdir=LR;
    
    // Default styles
    node [shape=box];
    edge [dir=none];

    // Strong Entities
    User [label="USER"];
    Product [label="PRODUCT"];
    Supplier [label="SUPPLIER"];
    Sale [label="SALE"];
    Loyalty [label="LOYALTY"];

    // Weak Entities (double border)
    node [shape=box, peripheries=2];
    Attendance [label="ATTENDANCE"];
    Payroll [label="PAYROLL"];
    SaleItem [label="SALE_ITEM"];

    // Relationships (diamond)
    node [shape=diamond, peripheries=1];
    Processes [label="Processes"];
    Supplies [label="Supplies"];
    References [label="References"];
    Earns [label="Earns"];

    // Identifying Relationships (double diamond)
    node [shape=diamond, peripheries=2];
    Logs [label="Logs"];
    Receives [label="Receives"];
    Contains [label="Contains"];

    // Attributes (ellipse)
    node [shape=ellipse, peripheries=1];
    
    // USER Attributes
    UserId [label=<<U>id</U>>];
    Username [label="username"];
    Role [label="role"];
    UserId -> User;
    Username -> User;
    Role -> User;

    // PRODUCT Attributes
    ProdSku [label=<<U>sku</U>>];
    ProdName [label="name"];
    ProdPrice [label="price"];
    ProdStock [label="stock_quantity"];
    ProdSku -> Product;
    ProdName -> Product;
    ProdPrice -> Product;
    ProdStock -> Product;

    // SUPPLIER Attributes
    SuppId [label=<<U>id</U>>];
    SuppName [label="name"];
    SuppId -> Supplier;
    SuppName -> Supplier;

    // SALE Attributes
    SaleId [label=<<U>id</U>>];
    SaleDate [label="created_at"];
    SaleId -> Sale;
    SaleDate -> Sale;

    // LOYALTY Attributes
    LoyaltyPhone [label=<<U>customer_phone</U>>];
    LoyaltyPoints [label="points"];
    LoyaltyPhone -> Loyalty;
    LoyaltyPoints -> Loyalty;

    // ATTENDANCE Attributes
    AttCheckIn [label="check_in"];
    AttCheckIn -> Attendance;

    // PAYROLL Attributes
    PayNet [label="net_pay"];
    PayNet -> Payroll;

    // SALE_ITEM Attributes
    ItemQty [label="quantity"];
    ItemQty -> SaleItem;

    // Connecting Entities and Relationships with Participation/Cardinality
    // 1 to N: User (1) to Sale (N)
    User -> Processes [label="1"];
    Processes -> Sale [label="N"];

    // 1 to N: Supplier (1) to Product (N)
    Supplier -> Supplies [label="1"];
    Supplies -> Product [label="N"];

    // 1 to N (Weak): User (1) to Attendance (N) (Total participation indicated by thick line)
    User -> Logs [label="1"];
    Logs -> Attendance [label="N", penwidth=2];

    // 1 to N (Weak): User (1) to Payroll (N)
    User -> Receives [label="1"];
    Receives -> Payroll [label="N", penwidth=2];

    // 1 to N (Weak): Sale (1) to SaleItem (N)
    Sale -> Contains [label="1"];
    Contains -> SaleItem [label="N", penwidth=2];

    // M to 1: SaleItem (M) to Product (1)
    SaleItem -> References [label="M"];
    References -> Product [label="1"];

    // 1 to N: Loyalty (1) to Sale (N)
    Loyalty -> Earns [label="1"];
    Earns -> Sale [label="N"];
}
```

## 4. High-Level Architecture Diagram

```dot
digraph Architecture {
    rankdir=TB;
    node [shape=box, style=filled, fillcolor=lightblue];

    subgraph cluster_Client {
        label = "Client Tier";
        style=dashed;
        UI [label="React.js Frontend\n/ Electron Display"];
    }

    subgraph cluster_AppLogic {
        label = "Application Logic Tier";
        style=dashed;
        API [label="Node.js + Express\nREST API"];
        ORM [label="Drizzle ORM Engine"];
        Validator [label="Zod Payload\nValidator"];
        ML [label="Python Flask\nML Microservice"];
    }

    subgraph cluster_Persistence {
        label = "Persistence Layer";
        style=dashed;
        DB [label="Cloud PostgreSQL\n/ Local SQLite", shape=cylinder, fillcolor=lightyellow];
    }

    UI -> API [label="HTTP/REST Traffic"];
    API -> ORM;
    API -> Validator;
    ORM -> DB [label="Sanitized SQL Queries"];
    ML -> DB [label="Read-Only Analytical Queries"];
}
```

## 5. Networking Diagram

```dot
digraph Networking {
    rankdir=LR;
    
    node [shape=box];
    
    User [label="Hardware Store Staff", shape=ellipse];
    Internet [label="Internet Pipeline", shape=cloud];
    
    subgraph cluster_Environment {
        label = "Cloud / Local Deployment Environment";
        style = rounded;
        
        LB [label="Reverse Proxy / API Gateway\n(e.g., Nginx)"];
        
        subgraph cluster_Presentation {
            label = "Presentation Subnet";
            style = dotted;
            CDN [label="Static Assets Host\n(Frontend Bundles)", fillcolor=white];
        }
        
        subgraph cluster_Execution {
            label = "Execution Subnet";
            style = dotted;
            NodeServer [label="Node.js Backend Server\n(Listener: Port 5000)"];
            PyServer [label="Python ML Service\n(Listener: Port 5001)"];
        }
        
        subgraph cluster_Database {
            label = "Database Subnet";
            style = dotted;
            PrimaryDB [label="Primary Neon PostgreSQL DB", shape=cylinder, fillcolor=lightyellow, style=filled];
        }
    }
    
    User -> Internet [label="TLS 1.3 encrypted"];
    Internet -> LB;
    
    LB -> CDN [label="Route: /"];
    LB -> NodeServer [label="Route: /api/*"];
    LB -> PyServer [label="Route: /ml/*"];
    
    NodeServer -> PrimaryDB [label="TCP: Port 5432"];
    PyServer -> PrimaryDB [label="TCP: Port 5432"];
}
```
