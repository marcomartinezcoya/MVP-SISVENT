export interface Product {
    id: string;
    name: string;
    sku: string;
    category: string;
    stock: number;
    stockPercentage: number;
    price: number;
    status: 'En Stock' | 'Bajo Stock' | 'Agotado';
    imageUrl: string;
}

export const mockProducts: Product[] = [
    {
        id: "1",
        name: "Smartwatch Series X",
        sku: "NEX-8429-EL",
        category: "Electrónica",
        stock: 850,
        stockPercentage: 85,
        price: 249.00,
        status: 'En Stock',
        imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBm5X-F9YjpQznIKdY9-M3F16lWrbumTYPHX-ifyOeQAL_DJase0N9OIddjwjTNCV_pz2TBu2p2vGBMaQtPiDR-YAp-giD6jz0HBbT9Ogl21JxWSaetf5lrZslVUwBC5O9q55AVzJcK3Agm_ypW4fZ3i4PdXk5Gz4eZmvhuApWMurTHCfYMmovWPuBDjJBdR5MfIjK3CMRwgkGasG9p5lX4zfncDpgV3bPpQE4jQhoZpEumsdxuZkPRmrH3hkpZTu3BC2a324r878cx"
    },
    {
        id: "2",
        name: "Monitor UltraWide 34\"",
        sku: "NEX-1102-HW",
        category: "Hardware Pro",
        stock: 12,
        stockPercentage: 12,
        price: 599.99,
        status: 'Bajo Stock',
        imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuC1KIx3pzvMXwCEAJpITkM8ox3o6zOsLv6KbMPCtzhW3Vrj1L5Kb4aQNBKGu50oq6BIaYkum8IP9znFD5PED2dOs7dHitBQFq3yQKWTdOUABDWbTG1BnDQeHpRRPmBMEe0cuTrxIceonHbl_LKj9Sq7GOuAhFaz1v8BEVYcHIEHf9AhcU62b9jy3stDpcSu5GG3UjBHzUY61EATZLbeXYWGEyHRqMypeLbj4c1UEh6ovBhRw8cWHm29znkTmJ5N09y4e7pPFr8VlnaK"
    },
    {
        id: "3",
        name: "Teclado Mecánico RGB",
        sku: "NEX-7731-EL",
        category: "Electrónica",
        stock: 0,
        stockPercentage: 0,
        price: 129.50,
        status: 'Agotado',
        imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBJpBMius5c4DRJUrAD19bgD0AJ50SqbpZ4dRPcmxKxEfk97PWqDcYGMaNMzRZgfufb8U2e_IIXICjQ1TJIgoBNCfmc_hSpLSiY7zqSCDyz_4gUZykjgCdLocEw2En9MBBtoqdFgUlxu4EdMN2KSN9eZvWeJ_BLL9aU_gu-DidgSpy2G7ydEgZ3m29x-Kk561-279OOMCbExfUP7IxU1_E7MJ9YCH7o33-4qbx4_OZ-xFSAwMyVO5RGJe60Xl847Q-y08s2DN7N9L3-"
    },
    {
        id: "4",
        name: "Auriculares Studio Pro",
        sku: "NEX-4412-EL",
        category: "Electrónica",
        stock: 342,
        stockPercentage: 45,
        price: 349.00,
        status: 'En Stock',
        imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLo_dn3EkHe0pJ4BeWumlGEN9_O0aW-kUuEhiYeMGvwS40Qv6Y9eyp2YsnI7rU6WBnVc4HWoSktCIVBLIE1pB4XMS8Fj4WeUxhFBCQYtGrumzf7glxhwtxNNCYeQRzf8AMPrPqRT2G2rY7ypHTYi1k4jkGTkoX-FiUcYptz2q6zZccQaKOHjJjDm4vF5TW_G5QjI7grsDHVqzrvQ0p7trsRQcL_xEYutJDH48mEntCwrkTDVpBDL0oU2htfaqLuWGf3XPvsOOa5qgR"
    }
];

export const mockStats = {
    totalSKUs: "1,284",
    totalValue: "$425.8k",
    criticalAlerts: 8,
    lowStockItems: 42
};
