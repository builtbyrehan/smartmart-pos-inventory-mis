-- POS & Inventory Control Management Information System
-- MySQL 8.0+ database initialization script
--
-- IMPORTANT: This setup script recreates the POS_IMIS database.
-- Run it only during initial setup or when you intentionally want to reset demo data.

DROP DATABASE IF EXISTS POS_IMIS;
CREATE DATABASE POS_IMIS
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_ai_ci;
USE POS_IMIS;

SET SQL_MODE = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- ============================================================
-- 1. NORMALIZED TRANSACTION DATABASE (3NF)
-- ============================================================

CREATE TABLE Categories (
    CategoryID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    CategoryName VARCHAR(100) NOT NULL,
    CONSTRAINT UQ_Categories_Name UNIQUE (CategoryName)
) ENGINE = InnoDB;

CREATE TABLE Users (
    UserID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) NOT NULL,
    PasswordHash CHAR(64) NOT NULL,
    FullName VARCHAR(100) NOT NULL,
    Role ENUM(
        'Admin',
        'Cashier',
        'Manager',
        'Inventory Officer',
        'Purchase Officer',
        'Sales Executive'
    ) NOT NULL,
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT UQ_Users_Username UNIQUE (Username)
) ENGINE = InnoDB;

CREATE TABLE Suppliers (
    SupplierID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    SupplierName VARCHAR(100) NOT NULL,
    ContactPerson VARCHAR(100),
    Phone VARCHAR(20) NOT NULL,
    Email VARCHAR(100),
    Address VARCHAR(255),
    CONSTRAINT UQ_Suppliers_Name UNIQUE (SupplierName),
    CONSTRAINT UQ_Suppliers_Email UNIQUE (Email)
) ENGINE = InnoDB;

CREATE TABLE Customers (
    CustomerID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    CustomerName VARCHAR(100) NOT NULL,
    Phone VARCHAR(20) NOT NULL,
    Email VARCHAR(100),
    Address VARCHAR(255),
    CONSTRAINT UQ_Customers_Email UNIQUE (Email)
) ENGINE = InnoDB;

CREATE TABLE Products (
    ProductID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ProductName VARCHAR(100) NOT NULL,
    CategoryID INT UNSIGNED NOT NULL,
    SupplierID INT UNSIGNED NOT NULL,
    Barcode VARCHAR(50) NOT NULL,
    PurchasePrice DECIMAL(12,2) NOT NULL,
    SellingPrice DECIMAL(12,2) NOT NULL,
    StockQuantity INT UNSIGNED NOT NULL DEFAULT 0,
    ReorderLevel INT UNSIGNED NOT NULL DEFAULT 10,
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT UQ_Products_Barcode UNIQUE (Barcode),
    CONSTRAINT CK_Products_PurchasePrice CHECK (PurchasePrice >= 0),
    CONSTRAINT CK_Products_SellingPrice CHECK (SellingPrice >= 0),
    CONSTRAINT FK_Products_Categories
        FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_Products_Suppliers
        FOREIGN KEY (SupplierID) REFERENCES Suppliers(SupplierID)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX IX_Products_Category (CategoryID),
    INDEX IX_Products_Supplier (SupplierID),
    INDEX IX_Products_Name (ProductName)
) ENGINE = InnoDB;

CREATE TABLE Purchases (
    PurchaseID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    SupplierID INT UNSIGNED NOT NULL,
    PurchaseDate DATE NOT NULL,
    InvoiceNumber VARCHAR(50) NOT NULL,
    TotalAmount DECIMAL(12,2) NOT NULL,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT UQ_Purchases_Invoice UNIQUE (InvoiceNumber),
    CONSTRAINT CK_Purchases_Total CHECK (TotalAmount >= 0),
    CONSTRAINT FK_Purchases_Suppliers
        FOREIGN KEY (SupplierID) REFERENCES Suppliers(SupplierID)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX IX_Purchases_Supplier (SupplierID),
    INDEX IX_Purchases_Date (PurchaseDate)
) ENGINE = InnoDB;

CREATE TABLE Purchase_Details (
    PurchaseDetailID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    PurchaseID INT UNSIGNED NOT NULL,
    ProductID INT UNSIGNED NOT NULL,
    Quantity INT UNSIGNED NOT NULL,
    PurchasePrice DECIMAL(12,2) NOT NULL,
    CONSTRAINT CK_PurchaseDetails_Quantity CHECK (Quantity > 0),
    CONSTRAINT CK_PurchaseDetails_Price CHECK (PurchasePrice >= 0),
    CONSTRAINT FK_PurchaseDetails_Purchases
        FOREIGN KEY (PurchaseID) REFERENCES Purchases(PurchaseID)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_PurchaseDetails_Products
        FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT UQ_PurchaseDetails_Item UNIQUE (PurchaseID, ProductID),
    INDEX IX_PurchaseDetails_Product (ProductID)
) ENGINE = InnoDB;

CREATE TABLE Sales (
    SaleID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    CustomerID INT UNSIGNED NOT NULL,
    UserID INT UNSIGNED NOT NULL,
    SaleDate DATE NOT NULL,
    InvoiceNumber VARCHAR(50) NOT NULL,
    TotalAmount DECIMAL(12,2) NOT NULL,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT UQ_Sales_Invoice UNIQUE (InvoiceNumber),
    CONSTRAINT CK_Sales_Total CHECK (TotalAmount >= 0),
    CONSTRAINT FK_Sales_Customers
        FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_Sales_Users
        FOREIGN KEY (UserID) REFERENCES Users(UserID)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX IX_Sales_Customer (CustomerID),
    INDEX IX_Sales_User (UserID),
    INDEX IX_Sales_Date (SaleDate)
) ENGINE = InnoDB;

CREATE TABLE Sales_Details (
    SaleDetailID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    SaleID INT UNSIGNED NOT NULL,
    ProductID INT UNSIGNED NOT NULL,
    Quantity INT UNSIGNED NOT NULL,
    SellingPrice DECIMAL(12,2) NOT NULL,
    CONSTRAINT CK_SalesDetails_Quantity CHECK (Quantity > 0),
    CONSTRAINT CK_SalesDetails_Price CHECK (SellingPrice >= 0),
    CONSTRAINT FK_SalesDetails_Sales
        FOREIGN KEY (SaleID) REFERENCES Sales(SaleID)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_SalesDetails_Products
        FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT UQ_SalesDetails_Item UNIQUE (SaleID, ProductID),
    INDEX IX_SalesDetails_Product (ProductID)
) ENGINE = InnoDB;

-- ============================================================
-- 2. VERIFIED SAMPLE DATA
-- Passwords are stored as SHA-256 hashes, not plain text.
-- Demo credentials are documented separately in the application README.
-- ============================================================

INSERT INTO Categories (CategoryID, CategoryName) VALUES
(1, 'Dairy'),
(2, 'Bakery'),
(3, 'Beverages'),
(4, 'Snacks'),
(5, 'Grocery'),
(6, 'Frozen Foods'),
(7, 'Personal Care'),
(8, 'Household Items'),
(9, 'Stationery'),
(10, 'Fruits & Vegetables');

INSERT INTO Users (UserID, Username, PasswordHash, FullName, Role) VALUES
(1, 'admin', SHA2('admin123', 256), 'System Administrator', 'Admin'),
(2, 'cashier1', SHA2('cash123', 256), 'Ali Khan', 'Cashier'),
(3, 'manager1', SHA2('manager123', 256), 'Sara Ahmed', 'Manager'),
(4, 'ahmed', SHA2('Ahmed@123', 256), 'Ahmed Raza', 'Cashier'),
(5, 'fatima', SHA2('Fatima@123', 256), 'Fatima Noor', 'Cashier'),
(6, 'usman', SHA2('Usman@123', 256), 'Usman Tariq', 'Inventory Officer'),
(7, 'ayesha', SHA2('Ayesha@123', 256), 'Ayesha Khan', 'Purchase Officer'),
(8, 'bilal', SHA2('Bilal@123', 256), 'Bilal Ahmed', 'Sales Executive'),
(9, 'hassan', SHA2('Hassan@123', 256), 'Hassan Ali', 'Manager'),
(10, 'sara', SHA2('Sara@123', 256), 'Sara Iqbal', 'Cashier');

INSERT INTO Suppliers
(SupplierID, SupplierName, ContactPerson, Phone, Email, Address) VALUES
(1, 'Nestle Pakistan', 'Ahmed Ali', '03001234567', 'sales@nestle.com', 'Lahore'),
(2, 'PepsiCo Pakistan', 'Bilal Khan', '03111234567', 'contact@pepsico.com', 'Karachi'),
(3, 'Shan Foods', 'Sara Ahmed', '03221234567', 'info@shanfoods.com', 'Karachi'),
(4, 'Unilever Pakistan', 'Usman Tariq', '03331234567', 'support@unilever.com', 'Lahore'),
(5, 'National Foods', 'Ayesha Malik', '03441234567', 'sales@nationalfoods.com', 'Karachi'),
(6, 'Engro Foods', 'Usman Tariq', '03011111111', 'sales@engro.com', 'Lahore'),
(7, 'Mitchells', 'Ahmed Bilal', '03022222222', 'contact@mitchells.com', 'Faisalabad'),
(8, 'Haleeb Foods', 'Ali Raza', '03033333333', 'support@haleebfoods.com', 'Lahore'),
(9, 'Tapal Tea', 'Hassan Khan', '03044444444', 'info@tapal.com', 'Karachi'),
(10, 'Coca-Cola Pakistan', 'Sajid Iqbal', '03055555555', 'sales@cokepk.com', 'Karachi');

INSERT INTO Customers
(CustomerID, CustomerName, Phone, Email, Address) VALUES
(1, 'Ali Hassan', '03001234567', 'ali@gmail.com', 'Lahore'),
(2, 'Sara Ahmed', '03111234567', 'sara@gmail.com', 'Karachi'),
(3, 'Ahmed Raza', '03221234567', 'ahmed@gmail.com', 'Islamabad'),
(4, 'Fatima Noor', '03331234567', 'fatima@gmail.com', 'Sialkot'),
(5, 'Usman Tariq', '03441234567', 'usman@gmail.com', 'Faisalabad'),
(6, 'Muhammad Abdullah', '03061111111', 'abdullah@gmail.com', 'Lahore'),
(7, 'Zainab Noor', '03072222222', 'zainab@gmail.com', 'Islamabad'),
(8, 'Hassan Ali', '03083333333', 'hassan@gmail.com', 'Rawalpindi'),
(9, 'Ayesha Khan', '03094444444', 'ayesha@gmail.com', 'Multan'),
(10, 'Bilal Ahmed', '03105555555', 'bilal@gmail.com', 'Peshawar');

INSERT INTO Products
(ProductID, ProductName, CategoryID, SupplierID, Barcode, PurchasePrice,
 SellingPrice, StockQuantity, ReorderLevel) VALUES
(1, 'Milk 1L', 1, 1, '890100001', 180.00, 220.00, 8, 10),
(2, 'Bread Loaf', 2, 5, '890100002', 80.00, 100.00, 6, 10),
(3, 'Pepsi 1.5L', 3, 2, '890100003', 150.00, 180.00, 70, 15),
(4, 'Potato Chips', 4, 4, '890100004', 60.00, 90.00, 9, 10),
(5, 'Rice 5kg', 5, 3, '890100005', 900.00, 1050.00, 20, 5),
(6, 'Butter 500g', 1, 6, '890100006', 320.00, 380.00, 45, 10),
(7, 'Cake Rusk', 2, 7, '890100007', 140.00, 180.00, 35, 10),
(8, '7UP 1.5L', 3, 10, '890100008', 155.00, 190.00, 60, 15),
(9, 'Biscuits Pack', 4, 8, '890100009', 70.00, 100.00, 50, 10),
(10, 'Sugar 1kg', 5, 9, '890100010', 170.00, 210.00, 30, 10),
(11, 'Frozen Nuggets', 6, 4, '890100011', 450.00, 550.00, 12, 8),
(12, 'Shampoo 400ml', 7, 4, '890100012', 520.00, 650.00, 18, 5),
(13, 'Detergent 1kg', 8, 4, '890100013', 400.00, 480.00, 25, 8),
(14, 'Notebook A4', 9, 7, '890100014', 120.00, 160.00, 100, 20),
(15, 'Apples 1kg', 10, 7, '890100015', 220.00, 280.00, 7, 10);

INSERT INTO Purchases
(PurchaseID, SupplierID, PurchaseDate, InvoiceNumber, TotalAmount) VALUES
(1, 1, '2026-07-01', 'PUR-1001', 34000.00),
(2, 5, '2026-07-02', 'PUR-1002', 9600.00),
(3, 2, '2026-07-03', 'PUR-1003', 12000.00),
(4, 4, '2026-07-04', 'PUR-1004', 46400.00),
(5, 3, '2026-07-05', 'PUR-1005', 36000.00),
(6, 6, '2026-07-06', 'PUR-1006', 6400.00),
(7, 7, '2026-07-08', 'PUR-1007', 34200.00),
(8, 10, '2026-07-10', 'PUR-1008', 18600.00),
(9, 8, '2026-07-12', 'PUR-1009', 7000.00),
(10, 9, '2026-07-15', 'PUR-1010', 15300.00);

INSERT INTO Purchase_Details
(PurchaseDetailID, PurchaseID, ProductID, Quantity, PurchasePrice) VALUES
(1, 1, 1, 100, 180.00),
(2, 1, 6, 50, 320.00),
(3, 2, 2, 120, 80.00),
(4, 3, 3, 80, 150.00),
(5, 4, 4, 100, 60.00),
(6, 4, 11, 40, 450.00),
(7, 4, 12, 20, 520.00),
(8, 4, 13, 30, 400.00),
(9, 5, 5, 40, 900.00),
(10, 6, 6, 20, 320.00),
(11, 7, 7, 80, 140.00),
(12, 7, 14, 100, 120.00),
(13, 7, 15, 50, 220.00),
(14, 8, 8, 120, 155.00),
(15, 9, 9, 100, 70.00),
(16, 10, 10, 90, 170.00);

INSERT INTO Sales
(SaleID, CustomerID, UserID, SaleDate, InvoiceNumber, TotalAmount) VALUES
(1, 1, 2, '2026-07-02', 'SAL-1001', 540.00),
(2, 2, 4, '2026-07-03', 'SAL-1002', 630.00),
(3, 3, 5, '2026-07-04', 'SAL-1003', 1050.00),
(4, 4, 2, '2026-07-05', 'SAL-1004', 960.00),
(5, 5, 4, '2026-07-06', 'SAL-1005', 940.00),
(6, 6, 5, '2026-07-07', 'SAL-1006', 1130.00),
(7, 7, 2, '2026-07-08', 'SAL-1007', 1060.00),
(8, 8, 4, '2026-07-09', 'SAL-1008', 1640.00),
(9, 9, 5, '2026-07-10', 'SAL-1009', 1780.00),
(10, 10, 2, '2026-07-11', 'SAL-1010', 1360.00),
(11, 1, 4, '2026-07-12', 'SAL-1011', 1220.00),
(12, 2, 5, '2026-07-13', 'SAL-1012', 2520.00),
(13, 3, 2, '2026-07-14', 'SAL-1013', 1040.00),
(14, 4, 4, '2026-07-15', 'SAL-1014', 1200.00),
(15, 5, 5, '2026-07-16', 'SAL-1015', 2120.00);

INSERT INTO Sales_Details
(SaleDetailID, SaleID, ProductID, Quantity, SellingPrice) VALUES
(1, 1, 1, 2, 220.00),
(2, 1, 2, 1, 100.00),
(3, 2, 3, 2, 180.00),
(4, 2, 4, 3, 90.00),
(5, 3, 5, 1, 1050.00),
(6, 4, 6, 2, 380.00),
(7, 4, 2, 2, 100.00),
(8, 5, 7, 3, 180.00),
(9, 5, 9, 4, 100.00),
(10, 6, 8, 5, 190.00),
(11, 6, 4, 2, 90.00),
(12, 7, 10, 4, 210.00),
(13, 7, 1, 1, 220.00),
(14, 8, 11, 2, 550.00),
(15, 8, 3, 3, 180.00),
(16, 9, 12, 2, 650.00),
(17, 9, 13, 1, 480.00),
(18, 10, 14, 5, 160.00),
(19, 10, 15, 2, 280.00),
(20, 11, 1, 3, 220.00),
(21, 11, 3, 2, 180.00),
(22, 11, 2, 2, 100.00),
(23, 12, 5, 2, 1050.00),
(24, 12, 10, 2, 210.00),
(25, 13, 6, 1, 380.00),
(26, 13, 7, 2, 180.00),
(27, 13, 9, 3, 100.00),
(28, 14, 11, 1, 550.00),
(29, 14, 12, 1, 650.00),
(30, 15, 15, 3, 280.00),
(31, 15, 13, 2, 480.00),
(32, 15, 14, 2, 160.00);

-- ============================================================
-- 3. DSS / MANAGEMENT VIEWS
-- ============================================================

CREATE VIEW vw_Low_Inventory_Alert AS
SELECT
    p.ProductID,
    p.ProductName,
    c.CategoryName,
    p.StockQuantity,
    p.ReorderLevel,
    GREATEST(p.ReorderLevel - p.StockQuantity, 0) AS ShortageQuantity,
    s.SupplierName,
    s.Phone AS SupplierPhone,
    CASE
        WHEN p.StockQuantity = 0 THEN 'OUT OF STOCK'
        WHEN p.StockQuantity <= p.ReorderLevel THEN 'REORDER NOW'
        ELSE 'SUFFICIENT'
    END AS AlertStatus
FROM Products p
JOIN Categories c ON c.CategoryID = p.CategoryID
JOIN Suppliers s ON s.SupplierID = p.SupplierID
WHERE p.IsActive = TRUE
  AND p.StockQuantity <= p.ReorderLevel;

CREATE VIEW vw_Top_10_Profitable_Products AS
SELECT
    p.ProductID,
    p.ProductName,
    SUM(sd.Quantity) AS UnitsSold,
    ROUND(SUM(sd.Quantity * sd.SellingPrice), 2) AS SalesRevenue,
    ROUND(SUM(sd.Quantity * p.PurchasePrice), 2) AS TotalCost,
    ROUND(SUM(sd.Quantity * (sd.SellingPrice - p.PurchasePrice)), 2) AS TotalProfit,
    ROUND(
        100 * SUM(sd.Quantity * (sd.SellingPrice - p.PurchasePrice)) /
        NULLIF(SUM(sd.Quantity * sd.SellingPrice), 0),
        2
    ) AS ProfitMarginPercent
FROM Sales_Details sd
JOIN Products p ON p.ProductID = sd.ProductID
GROUP BY p.ProductID, p.ProductName
ORDER BY TotalProfit DESC
LIMIT 10;

CREATE VIEW vw_Monthly_Sales_Summary AS
SELECT
    DATE_FORMAT(s.SaleDate, '%Y-%m') AS SalesMonth,
    COUNT(DISTINCT s.SaleID) AS TotalInvoices,
    SUM(sd.Quantity) AS UnitsSold,
    ROUND(SUM(sd.Quantity * sd.SellingPrice), 2) AS TotalSales,
    ROUND(SUM(sd.Quantity * (sd.SellingPrice - p.PurchasePrice)), 2)
        AS GrossProfit,
    ROUND(
        SUM(sd.Quantity * sd.SellingPrice) / COUNT(DISTINCT s.SaleID),
        2
    ) AS AverageInvoiceValue
FROM Sales s
JOIN Sales_Details sd ON sd.SaleID = s.SaleID
JOIN Products p ON p.ProductID = sd.ProductID
GROUP BY DATE_FORMAT(s.SaleDate, '%Y-%m');

CREATE VIEW vw_Inventory_Valuation AS
SELECT
    p.ProductID,
    p.ProductName,
    c.CategoryName,
    p.PurchasePrice,
    p.SellingPrice,
    p.StockQuantity,
    ROUND(p.PurchasePrice * p.StockQuantity, 2) AS InventoryCostValue,
    ROUND(p.SellingPrice * p.StockQuantity, 2) AS PotentialSalesValue,
    ROUND((p.SellingPrice - p.PurchasePrice) * p.StockQuantity, 2)
        AS PotentialGrossProfit
FROM Products p
JOIN Categories c ON c.CategoryID = p.CategoryID;

CREATE VIEW vw_Profit_By_Category AS
SELECT
    c.CategoryName,
    SUM(sd.Quantity) AS UnitsSold,
    ROUND(SUM(sd.Quantity * sd.SellingPrice), 2) AS SalesRevenue,
    ROUND(SUM(sd.Quantity * (sd.SellingPrice - p.PurchasePrice)), 2)
        AS TotalProfit,
    ROUND(
        100 * SUM(sd.Quantity * (sd.SellingPrice - p.PurchasePrice)) /
        NULLIF(SUM(sd.Quantity * sd.SellingPrice), 0),
        2
    ) AS ProfitMarginPercent
FROM Categories c
JOIN Products p ON p.CategoryID = c.CategoryID
JOIN Sales_Details sd ON sd.ProductID = p.ProductID
GROUP BY c.CategoryID, c.CategoryName;

CREATE VIEW vw_Customer_Purchase_Analysis AS
SELECT
    c.CustomerID,
    c.CustomerName,
    COUNT(s.SaleID) AS TotalPurchases,
    COALESCE(ROUND(SUM(s.TotalAmount), 2), 0.00) AS TotalSpent,
    COALESCE(ROUND(AVG(s.TotalAmount), 2), 0.00) AS AveragePurchase,
    CASE
        WHEN COALESCE(SUM(s.TotalAmount), 0) >= 3000 THEN 'VIP'
        WHEN COUNT(s.SaleID) >= 2 THEN 'Active'
        ELSE 'Regular'
    END AS CustomerSegment
FROM Customers c
LEFT JOIN Sales s ON s.CustomerID = c.CustomerID
GROUP BY c.CustomerID, c.CustomerName;

CREATE VIEW vw_Sales_Invoice_Detail AS
SELECT
    s.SaleID,
    s.InvoiceNumber,
    s.SaleDate,
    c.CustomerName,
    u.FullName AS Cashier,
    p.ProductName,
    sd.Quantity,
    sd.SellingPrice,
    ROUND(sd.Quantity * sd.SellingPrice, 2) AS LineTotal
FROM Sales s
JOIN Customers c ON c.CustomerID = s.CustomerID
JOIN Users u ON u.UserID = s.UserID
JOIN Sales_Details sd ON sd.SaleID = s.SaleID
JOIN Products p ON p.ProductID = sd.ProductID;

CREATE VIEW vw_Dashboard_Summary AS
SELECT
    (SELECT ROUND(SUM(TotalAmount), 2) FROM Sales) AS TotalSalesRevenue,
    (
        SELECT ROUND(
            SUM(sd.Quantity * (sd.SellingPrice - p.PurchasePrice)), 2
        )
        FROM Sales_Details sd
        JOIN Products p ON p.ProductID = sd.ProductID
    ) AS GrossProfit,
    (
        SELECT ROUND(SUM(PurchasePrice * StockQuantity), 2)
        FROM Products
    ) AS InventoryCostValue,
    (
        SELECT ROUND(SUM(SellingPrice * StockQuantity), 2)
        FROM Products
    ) AS PotentialRetailValue,
    (
        SELECT COUNT(*) FROM Products
        WHERE StockQuantity <= ReorderLevel
    ) AS LowStockItems,
    (SELECT COUNT(*) FROM Products) AS TotalProducts,
    (SELECT COUNT(*) FROM Sales) AS SalesInvoices,
    (SELECT COUNT(*) FROM Customers) AS RegisteredCustomers;

-- ============================================================
-- 4. IMPORT VERIFICATION
-- Expected: revenue 19190.00, gross profit 3665.00,
-- four low-stock products, zero header/detail mismatches.
-- ============================================================

SELECT 'Categories' AS TableName, COUNT(*) AS RecordCount FROM Categories
UNION ALL SELECT 'Users', COUNT(*) FROM Users
UNION ALL SELECT 'Suppliers', COUNT(*) FROM Suppliers
UNION ALL SELECT 'Customers', COUNT(*) FROM Customers
UNION ALL SELECT 'Products', COUNT(*) FROM Products
UNION ALL SELECT 'Purchases', COUNT(*) FROM Purchases
UNION ALL SELECT 'Purchase_Details', COUNT(*) FROM Purchase_Details
UNION ALL SELECT 'Sales', COUNT(*) FROM Sales
UNION ALL SELECT 'Sales_Details', COUNT(*) FROM Sales_Details;

SELECT * FROM vw_Dashboard_Summary;
SELECT * FROM vw_Low_Inventory_Alert ORDER BY StockQuantity, ProductName;
SELECT * FROM vw_Top_10_Profitable_Products;
SELECT * FROM vw_Monthly_Sales_Summary ORDER BY SalesMonth;

SELECT COUNT(*) AS SalesTotalMismatches
FROM Sales s
JOIN (
    SELECT SaleID, SUM(Quantity * SellingPrice) AS DetailTotal
    FROM Sales_Details
    GROUP BY SaleID
) x ON x.SaleID = s.SaleID
WHERE ABS(s.TotalAmount - x.DetailTotal) > 0.001;

SELECT COUNT(*) AS PurchaseTotalMismatches
FROM Purchases p
JOIN (
    SELECT PurchaseID, SUM(Quantity * PurchasePrice) AS DetailTotal
    FROM Purchase_Details
    GROUP BY PurchaseID
) x ON x.PurchaseID = p.PurchaseID
WHERE ABS(p.TotalAmount - x.DetailTotal) > 0.001;
