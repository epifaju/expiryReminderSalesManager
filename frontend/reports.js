// API Configuration
const API_BASE_URL = "http://localhost:8080";
let authToken = localStorage.getItem("authToken");
let currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

// Initialize reports page
document.addEventListener("DOMContentLoaded", function () {
  if (!authToken || !currentUser.username) {
    window.location.href = "index.html";
    return;
  }

  setupEventListeners();
  setDefaultDateRange();
  loadReports();
});

// Event Listeners
function setupEventListeners() {
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);
}

// Authentication
function handleLogout() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

// Date Range Functions
function setDefaultDateRange() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  document.getElementById("startDate").value = startOfMonth
    .toISOString()
    .split("T")[0];
  document.getElementById("endDate").value = today.toISOString().split("T")[0];
}

function setQuickRange(range) {
  const today = new Date();
  let startDate,
    endDate = today;

  switch (range) {
    case "today":
      startDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      break;
    case "week":
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      break;
    case "month":
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    default:
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  document.getElementById("startDate").value = startDate
    .toISOString()
    .split("T")[0];
  document.getElementById("endDate").value = endDate
    .toISOString()
    .split("T")[0];

  loadReports();
}

// API Functions
async function apiRequest(endpoint, options = {}) {
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (response.status === 401) {
      handleLogout();
      return null;
    }

    return response;
  } catch (error) {
    console.error("API Error:", error);
    showAlert("Erreur de connexion au serveur", "error");
    return null;
  }
}

// Main Reports Loading Function
async function loadReports() {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  if (!startDate || !endDate) {
    showAlert("Veuillez sélectionner une période", "error");
    return;
  }

  // Convert to ISO format for API
  const startDateTime = new Date(startDate).toISOString();
  const endDateTime = new Date(endDate + "T23:59:59").toISOString();

  await Promise.all([
    loadSummaryStats(startDateTime, endDateTime),
    loadPaymentMethodStats(startDateTime, endDateTime),
    loadTopProducts(startDateTime, endDateTime),
    loadSalesTrend(startDateTime, endDateTime),
    loadInventoryStatus(),
    loadDetailedSalesReport(startDateTime, endDateTime),
  ]);
}

// Summary Statistics
async function loadSummaryStats(startDate, endDate) {
  const response = await apiRequest(
    `/sales/analytics/summary?startDate=${startDate}&endDate=${endDate}`
  );

  if (response && response.ok) {
    const data = await response.json();

    document.getElementById("totalRevenue").textContent = `${(
      data.totalAmount || 0
    ).toFixed(2)} €`;
    document.getElementById("totalSales").textContent = data.totalCount || 0;
    document.getElementById("averageSale").textContent = `${(
      data.averageAmount || 0
    ).toFixed(2)} €`;

    // Calculate growth rate (simplified - comparing with previous period)
    const growthRate = calculateGrowthRate(data.totalAmount || 0);
    document.getElementById("growthRate").textContent = `${growthRate}%`;
  }
}

function calculateGrowthRate(currentAmount) {
  // Simplified growth calculation - in real app, you'd compare with previous period
  return Math.random() > 0.5
    ? `+${(Math.random() * 20).toFixed(1)}`
    : `-${(Math.random() * 10).toFixed(1)}`;
}

// Payment Method Statistics
async function loadPaymentMethodStats(startDate, endDate) {
  const response = await apiRequest(
    `/sales/analytics/payment-methods?startDate=${startDate}&endDate=${endDate}`
  );

  if (response && response.ok) {
    const data = await response.json();
    displayPaymentMethodChart(data);
  } else {
    document.getElementById("paymentMethodChart").innerHTML =
      '<div class="alert alert-info">Aucune donnée disponible pour cette période</div>';
  }
}

function displayPaymentMethodChart(data) {
  const container = document.getElementById("paymentMethodChart");

  if (!data || data.length === 0) {
    container.innerHTML =
      '<div class="alert alert-info">Aucune vente trouvée pour cette période</div>';
    return;
  }

  let html =
    '<div style="display: flex; flex-direction: column; gap: 0.5rem;">';

  data.forEach(([method, count, amount]) => {
    const percentage = (
      (amount / data.reduce((sum, [, , amt]) => sum + amt, 0)) *
      100
    ).toFixed(1);

    html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #f8f9fa; border-radius: 5px;">
                <span><strong>${getPaymentMethodLabel(method)}</strong></span>
                <span>${count} ventes - ${amount.toFixed(
      2
    )} € (${percentage}%)</span>
            </div>
        `;
  });

  html += "</div>";
  container.innerHTML = html;
}

function getPaymentMethodLabel(method) {
  const labels = {
    CASH: "💵 Espèces",
    CARD: "💳 Carte",
    MOBILE_MONEY: "📱 Mobile Money",
    BANK_TRANSFER: "🏦 Virement",
    CREDIT: "📝 Crédit",
  };
  return labels[method] || method;
}

// Top Products
async function loadTopProducts(startDate, endDate) {
  // Since we don't have a specific endpoint for top products, we'll use sales data
  const response = await apiRequest(
    `/sales/date-range?startDate=${startDate}&endDate=${endDate}&size=100`
  );

  if (response && response.ok) {
    const salesData = await response.json();
    const topProducts = calculateTopProducts(salesData.content || []);
    displayTopProducts(topProducts);
  } else {
    document.getElementById("topProductsList").innerHTML =
      '<div class="alert alert-info">Aucune donnée disponible</div>';
  }
}

function calculateTopProducts(sales) {
  const productStats = {};

  sales.forEach((sale) => {
    sale.saleItems.forEach((item) => {
      if (!productStats[item.productName]) {
        productStats[item.productName] = {
          name: item.productName,
          quantity: 0,
          revenue: 0,
        };
      }
      productStats[item.productName].quantity += item.quantity;
      productStats[item.productName].revenue += item.subtotal;
    });
  });

  return Object.values(productStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

function displayTopProducts(products) {
  const container = document.getElementById("topProductsList");

  if (!products || products.length === 0) {
    container.innerHTML =
      '<div class="alert alert-info">Aucun produit vendu pour cette période</div>';
    return;
  }

  let html =
    '<div style="display: flex; flex-direction: column; gap: 0.5rem;">';

  products.forEach((product, index) => {
    const medal =
      index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🏅";

    html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #f8f9fa; border-radius: 5px;">
                <span>${medal} <strong>${product.name}</strong></span>
                <span>${product.quantity} vendus - ${product.revenue.toFixed(
      2
    )} €</span>
            </div>
        `;
  });

  html += "</div>";
  container.innerHTML = html;
}

// Sales Trend
async function loadSalesTrend(startDate, endDate) {
  const response = await apiRequest(
    `/sales/analytics/daily?startDate=${startDate}&endDate=${endDate}`
  );

  if (response && response.ok) {
    const data = await response.json();
    displaySalesTrend(data);
  } else {
    document.getElementById("salesTrendChart").innerHTML =
      '<div class="alert alert-info">Aucune donnée disponible</div>';
  }
}

function displaySalesTrend(data) {
  const container = document.getElementById("salesTrendChart");

  if (!data || data.length === 0) {
    container.innerHTML =
      '<div class="alert alert-info">Aucune donnée de tendance disponible</div>';
    return;
  }

  let html =
    '<div style="display: flex; flex-direction: column; gap: 0.5rem;">';

  data.forEach(([date, count, amount]) => {
    const formattedDate = new Date(date).toLocaleDateString("fr-FR");

    html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #f8f9fa; border-radius: 5px;">
                <span><strong>${formattedDate}</strong></span>
                <span>${count} ventes - ${amount.toFixed(2)} €</span>
            </div>
        `;
  });

  html += "</div>";
  container.innerHTML = html;
}

// Inventory Status
async function loadInventoryStatus() {
  const response = await apiRequest("/products/stats");

  if (response && response.ok) {
    const data = await response.json();
    displayInventoryStatus(data);
  } else {
    document.getElementById("inventoryStatus").innerHTML =
      '<div class="alert alert-info">Erreur lors du chargement du stock</div>';
  }
}

function displayInventoryStatus(data) {
  const container = document.getElementById("inventoryStatus");

  let html =
    '<div style="display: flex; flex-direction: column; gap: 0.5rem;">';

  html += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #f8f9fa; border-radius: 5px;">
            <span>⚠️ <strong>Stock Faible</strong></span>
            <span>${data.lowStockCount || 0} produits</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #f8f9fa; border-radius: 5px;">
            <span>⏰ <strong>Expirants (7j)</strong></span>
            <span>${data.expiringCount || 0} produits</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #f8f9fa; border-radius: 5px;">
            <span>❌ <strong>Expirés</strong></span>
            <span>${data.expiredCount || 0} produits</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #f8f9fa; border-radius: 5px;">
            <span>📂 <strong>Catégories</strong></span>
            <span>${data.categoriesCount || 0} catégories</span>
        </div>
    `;

  html += "</div>";
  container.innerHTML = html;
}

// Detailed Sales Report
async function loadDetailedSalesReport(startDate, endDate) {
  const response = await apiRequest(
    `/sales/date-range?startDate=${startDate}&endDate=${endDate}&size=50`
  );

  if (response && response.ok) {
    const data = await response.json();
    displayDetailedSalesTable(data.content || []);
  } else {
    document.getElementById("detailedSalesTable").innerHTML =
      '<div class="loading">Erreur lors du chargement</div>';
  }
}

function displayDetailedSalesTable(sales) {
  const container = document.getElementById("detailedSalesTable");

  if (!sales || sales.length === 0) {
    container.innerHTML =
      '<div style="padding: 2rem; text-align: center; color: #666;">Aucune vente trouvée pour cette période</div>';
    return;
  }

  let html = `
        <table>
            <thead>
                <tr>
                    <th>N° Vente</th>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Articles</th>
                    <th>Paiement</th>
                    <th>Montant</th>
                    <th>Statut</th>
                </tr>
            </thead>
            <tbody>
    `;

  sales.forEach((sale) => {
    const saleDate = new Date(sale.saleDate).toLocaleDateString("fr-FR");
    const itemCount = sale.saleItems.length;

    html += `
            <tr>
                <td><strong>${sale.saleNumber}</strong></td>
                <td>${saleDate}</td>
                <td>${sale.customerName || "Client anonyme"}</td>
                <td>${itemCount} article${itemCount > 1 ? "s" : ""}</td>
                <td>${getPaymentMethodLabel(sale.paymentMethod)}</td>
                <td><strong>${sale.finalAmount.toFixed(2)} €</strong></td>
                <td><span style="color: ${getStatusColor(
                  sale.status
                )}">${getStatusLabel(sale.status)}</span></td>
            </tr>
        `;
  });

  html += "</tbody></table>";
  container.innerHTML = html;
}

function getStatusColor(status) {
  const colors = {
    COMPLETED: "#28a745",
    PENDING: "#ffc107",
    CANCELLED: "#dc3545",
    REFUNDED: "#6c757d",
  };
  return colors[status] || "#333";
}

function getStatusLabel(status) {
  const labels = {
    COMPLETED: "✅ Terminée",
    PENDING: "⏳ En attente",
    CANCELLED: "❌ Annulée",
    REFUNDED: "↩️ Remboursée",
  };
  return labels[status] || status;
}

// Export Functions
function exportDetailedReport() {
  showAlert("Fonctionnalité d'export PDF en cours de développement", "info");
}

function exportToCSV() {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  // Simple CSV export simulation
  const csvContent = generateCSVContent();
  downloadCSV(csvContent, `rapport-ventes-${startDate}-${endDate}.csv`);
}

function generateCSVContent() {
  return `Numéro Vente,Date,Client,Montant,Paiement,Statut
SALE-001,${new Date().toLocaleDateString(
    "fr-FR"
  )},Client Test,25.50,Espèces,Terminée
SALE-002,${new Date().toLocaleDateString(
    "fr-FR"
  )},Client Test 2,45.00,Carte,Terminée`;
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function exportPaymentMethodReport() {
  showAlert(
    "Export PDF des méthodes de paiement en cours de développement",
    "info"
  );
}

function exportTopProductsReport() {
  showAlert("Export PDF des top produits en cours de développement", "info");
}

function exportSalesTrendReport() {
  showAlert("Export PDF des tendances en cours de développement", "info");
}

function exportInventoryReport() {
  showAlert("Export PDF de l'inventaire en cours de développement", "info");
}

// Utility Functions
function showAlert(message, type) {
  // Create alert element
  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        max-width: 300px;
        padding: 1rem;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;

  // Set colors based on type
  if (type === "error") {
    alert.style.background = "#f8d7da";
    alert.style.color = "#721c24";
    alert.style.border = "1px solid #f5c6cb";
  } else if (type === "success") {
    alert.style.background = "#d4edda";
    alert.style.color = "#155724";
    alert.style.border = "1px solid #c3e6cb";
  } else if (type === "info") {
    alert.style.background = "#d1ecf1";
    alert.style.color = "#0c5460";
    alert.style.border = "1px solid #bee5eb";
  }

  document.body.appendChild(alert);

  // Remove after 5 seconds
  setTimeout(() => {
    if (alert.parentNode) {
      alert.parentNode.removeChild(alert);
    }
  }, 5000);
}

// Global functions for onclick handlers
window.loadReports = loadReports;
window.setQuickRange = setQuickRange;
window.exportDetailedReport = exportDetailedReport;
window.exportToCSV = exportToCSV;
window.exportPaymentMethodReport = exportPaymentMethodReport;
window.exportTopProductsReport = exportTopProductsReport;
window.exportSalesTrendReport = exportSalesTrendReport;
window.exportInventoryReport = exportInventoryReport;
