// API Configuration
const API_BASE_URL = "http://localhost:8080";
let authToken = localStorage.getItem("authToken");
let currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

// DOM Elements
const authSection = document.getElementById("authSection");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const logoutBtn = document.getElementById("logoutBtn");
const currentUserSpan = document.getElementById("currentUser");

// Initialize app
document.addEventListener("DOMContentLoaded", function () {
  if (authToken && currentUser.username) {
    showDashboard();
  } else {
    showAuth();
  }

  setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
  loginForm.addEventListener("submit", handleLogin);
  signupForm.addEventListener("submit", handleSignup);
  logoutBtn.addEventListener("click", handleLogout);

  document
    .getElementById("addProductBtn")
    .addEventListener("click", () => openModal("productModal"));
  document
    .getElementById("newSaleBtn")
    .addEventListener("click", () => openModal("saleModal"));
  document
    .getElementById("productForm")
    .addEventListener("submit", handleProductSubmit);
  document
    .getElementById("saleForm")
    .addEventListener("submit", handleSaleSubmit);
  document
    .getElementById("addSaleItem")
    .addEventListener("click", addSaleItemRow);
  document
    .getElementById("viewExpiringBtn")
    .addEventListener("click", () => loadExpirationAlerts("expiring"));
  document
    .getElementById("viewExpiredBtn")
    .addEventListener("click", () => loadExpirationAlerts("expired"));
}

// Authentication Functions
async function handleLogin(e) {
  e.preventDefault();

  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const data = await response.json();
      authToken = data.token;
      currentUser = {
        id: data.id,
        username: data.username,
        email: data.email,
      };

      localStorage.setItem("authToken", authToken);
      localStorage.setItem("currentUser", JSON.stringify(currentUser));

      showAlert("Connexion réussie!", "success");
      showDashboard();
    } else {
      const error = await response.json();
      showAlert(error.message || "Erreur de connexion", "error");
    }
  } catch (error) {
    showAlert("Erreur de connexion au serveur", "error");
  }
}

async function handleSignup(e) {
  e.preventDefault();

  const username = document.getElementById("signupUsername").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password, role: ["user"] }),
    });

    if (response.ok) {
      showAlert(
        "Inscription réussie! Vous pouvez maintenant vous connecter.",
        "success"
      );
      signupForm.reset();
    } else {
      const error = await response.json();
      showAlert(error.message || "Erreur d'inscription", "error");
    }
  } catch (error) {
    showAlert("Erreur de connexion au serveur", "error");
  }
}

function handleLogout() {
  authToken = null;
  currentUser = {};
  localStorage.removeItem("authToken");
  localStorage.removeItem("currentUser");
  showAuth();
  showAlert("Déconnexion réussie", "success");
}

// UI Functions
function showAuth() {
  authSection.style.display = "block";
  dashboard.classList.remove("active");
}

function showDashboard() {
  authSection.style.display = "none";
  dashboard.classList.add("active");
  currentUserSpan.textContent = currentUser.username;
  loadDashboardData();
}

function showAlert(message, type) {
  const alertContainer = document.getElementById("alertContainer");
  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;
  alert.textContent = message;

  alertContainer.appendChild(alert);

  setTimeout(() => {
    alert.remove();
  }, 5000);
}

// Modal Functions
function openModal(modalId) {
  document.getElementById(modalId).classList.add("active");

  if (modalId === "saleModal") {
    loadProductsForSale();
    addSaleItemRow(); // Add first row
  }
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("active");

  // Reset forms
  if (modalId === "productModal") {
    document.getElementById("productForm").reset();
  } else if (modalId === "saleModal") {
    document.getElementById("saleForm").reset();
    document.getElementById("saleItems").innerHTML = "";
  }
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
    showAlert("Erreur de connexion au serveur", "error");
    return null;
  }
}

// Dashboard Data Loading
async function loadDashboardData() {
  await Promise.all([loadProducts(), loadRecentSales(), loadStats()]);
}

async function loadProducts() {
  const response = await apiRequest("/products");
  if (response && response.ok) {
    const data = await response.json();
    displayProducts(data.content || data);
    updateProductStats(data.content || data);
  }
}

async function loadRecentSales() {
  const response = await apiRequest("/sales/recent?limit=5");
  if (response && response.ok) {
    const sales = await response.json();
    displayRecentSales(sales);
  }
}

async function loadStats() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  // Today's sales
  const todayResponse = await apiRequest(
    `/sales/analytics/summary?startDate=${startOfDay.toISOString()}&endDate=${today.toISOString()}`
  );
  if (todayResponse && todayResponse.ok) {
    const todayData = await todayResponse.json();
    document.getElementById("todaySales").textContent =
      todayData.totalCount || 0;
  }

  // Monthly revenue
  const monthResponse = await apiRequest(
    `/sales/analytics/summary?startDate=${startOfMonth.toISOString()}&endDate=${today.toISOString()}`
  );
  if (monthResponse && monthResponse.ok) {
    const monthData = await monthResponse.json();
    document.getElementById("monthlyRevenue").textContent = `${(
      monthData.totalAmount || 0
    ).toFixed(2)} €`;
  }
}

// Product Functions
function displayProducts(products) {
  const productList = document.getElementById("productList");
  productList.innerHTML = "";

  products.forEach((product) => {
    const productItem = document.createElement("div");
    productItem.className = "item";

    const stockStatus =
      product.stockQuantity <= product.minStockLevel ? "⚠️" : "✅";

    productItem.innerHTML = `
            <div class="item-info">
                <div class="item-name">${product.name} ${stockStatus}</div>
                <div class="item-details">
                    Stock: ${product.stockQuantity} | Prix: ${
      product.sellingPrice
    }€
                    ${product.category ? ` | ${product.category}` : ""}
                </div>
            </div>
            <div class="item-actions">
                <button class="btn btn-sm" onclick="editProduct(${
                  product.id
                })">Modifier</button>
                <button class="btn btn-danger btn-sm" onclick="deleteProduct(${
                  product.id
                })">Supprimer</button>
            </div>
        `;

    productList.appendChild(productItem);
  });
}

function updateProductStats(products) {
  document.getElementById("totalProducts").textContent = products.length;

  const lowStockCount = products.filter(
    (p) => p.stockQuantity <= p.minStockLevel
  ).length;
  document.getElementById("lowStock").textContent = lowStockCount;
}

async function handleProductSubmit(e) {
  e.preventDefault();

  const productData = {
    name: document.getElementById("productName").value,
    description: document.getElementById("productDescription").value,
    barcode: document.getElementById("productBarcode").value,
    category: document.getElementById("productCategory").value,
    purchasePrice: parseFloat(
      document.getElementById("productPurchasePrice").value
    ),
    sellingPrice: parseFloat(
      document.getElementById("productSellingPrice").value
    ),
    stockQuantity: parseInt(
      document.getElementById("productStockQuantity").value
    ),
    minStockLevel: parseInt(
      document.getElementById("productMinStockLevel").value
    ),
    unit: document.getElementById("productUnit").value,
  };

  // Add expiry date if provided
  const expiryDate = document.getElementById("productExpiryDate").value;
  if (expiryDate) {
    productData.expiryDate = expiryDate;
  }

  // Add manufacturing date if provided
  const manufacturingDate = document.getElementById(
    "productManufacturingDate"
  ).value;
  if (manufacturingDate) {
    productData.manufacturingDate = manufacturingDate;
  }

  const response = await apiRequest("/products", {
    method: "POST",
    body: JSON.stringify(productData),
  });

  if (response && response.ok) {
    showAlert("Produit ajouté avec succès!", "success");
    closeModal("productModal");
    loadProducts();
    loadExpirationStats(); // Refresh expiration stats
  } else {
    const error = await response.json();
    showAlert(error.error || "Erreur lors de l'ajout du produit", "error");
  }
}

async function deleteProduct(productId) {
  if (confirm("Êtes-vous sûr de vouloir supprimer ce produit?")) {
    const response = await apiRequest(`/products/${productId}`, {
      method: "DELETE",
    });

    if (response && response.ok) {
      showAlert("Produit supprimé avec succès!", "success");
      loadProducts();
    } else {
      showAlert("Erreur lors de la suppression du produit", "error");
    }
  }
}

// Sale Functions
function displayRecentSales(sales) {
  const saleList = document.getElementById("recentSales");
  saleList.innerHTML = "";

  if (sales.length === 0) {
    saleList.innerHTML = '<div class="item">Aucune vente récente</div>';
    return;
  }

  sales.forEach((sale) => {
    const saleItem = document.createElement("div");
    saleItem.className = "item";

    const saleDate = new Date(sale.saleDate).toLocaleDateString("fr-FR");

    saleItem.innerHTML = `
            <div class="item-info">
                <div class="item-name">${sale.saleNumber}</div>
                <div class="item-details">
                    ${saleDate} | ${sale.finalAmount}€ | ${sale.paymentMethod}
                    ${sale.customerName ? ` | ${sale.customerName}` : ""}
                </div>
            </div>
            <div class="item-actions">
                <button class="btn btn-sm" onclick="viewSale(${
                  sale.id
                })">Voir</button>
            </div>
        `;

    saleList.appendChild(saleItem);
  });
}

let availableProducts = [];

async function loadProductsForSale() {
  const response = await apiRequest("/products");
  if (response && response.ok) {
    const data = await response.json();
    availableProducts = data.content || data;
  }
}

function addSaleItemRow() {
  const saleItems = document.getElementById("saleItems");
  const itemRow = document.createElement("div");
  itemRow.className = "sale-item-row";
  itemRow.style.cssText =
    "display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center;";

  itemRow.innerHTML = `
        <select class="product-select" style="flex: 2;" required>
            <option value="">Sélectionner un produit</option>
            ${availableProducts
              .map(
                (p) =>
                  `<option value="${p.id}" data-price="${p.sellingPrice}" data-stock="${p.stockQuantity}">
                    ${p.name} (Stock: ${p.stockQuantity}) - ${p.sellingPrice}€
                </option>`
              )
              .join("")}
        </select>
        <input type="number" class="quantity-input" placeholder="Qté" min="1" style="flex: 1;" required>
        <input type="number" class="price-input" placeholder="Prix" step="0.01" style="flex: 1;" required>
        <button type="button" class="btn btn-danger btn-sm" onclick="removeSaleItemRow(this)">×</button>
    `;

  // Add event listener for product selection
  const productSelect = itemRow.querySelector(".product-select");
  const priceInput = itemRow.querySelector(".price-input");

  productSelect.addEventListener("change", function () {
    const selectedOption = this.options[this.selectedIndex];
    if (selectedOption.value) {
      priceInput.value = selectedOption.dataset.price;
    }
  });

  saleItems.appendChild(itemRow);
}

function removeSaleItemRow(button) {
  button.parentElement.remove();
}

async function handleSaleSubmit(e) {
  e.preventDefault();

  const saleItems = [];
  const itemRows = document.querySelectorAll(".sale-item-row");

  for (const row of itemRows) {
    const productId = row.querySelector(".product-select").value;
    const quantity = parseInt(row.querySelector(".quantity-input").value);
    const unitPrice = parseFloat(row.querySelector(".price-input").value);

    if (productId && quantity && unitPrice) {
      saleItems.push({
        productId: parseInt(productId),
        quantity: quantity,
        unitPrice: unitPrice,
        discount: 0,
      });
    }
  }

  if (saleItems.length === 0) {
    showAlert("Veuillez ajouter au moins un article à la vente", "error");
    return;
  }

  const saleData = {
    saleDate: new Date().toISOString(),
    customerName: document.getElementById("customerName").value,
    customerPhone: document.getElementById("customerPhone").value,
    paymentMethod: document.getElementById("paymentMethod").value,
    discountAmount:
      parseFloat(document.getElementById("saleDiscount").value) || 0,
    taxAmount: parseFloat(document.getElementById("saleTax").value) || 0,
    saleItems: saleItems,
  };

  const response = await apiRequest("/sales", {
    method: "POST",
    body: JSON.stringify(saleData),
  });

  if (response && response.ok) {
    const sale = await response.json();
    showAlert(`Vente créée avec succès! Numéro: ${sale.saleNumber}`, "success");
    closeModal("saleModal");
    loadRecentSales();
    loadProducts(); // Refresh to update stock
    loadStats(); // Refresh stats
  } else {
    const error = await response.json();
    showAlert(error.error || "Erreur lors de la création de la vente", "error");
  }
}

async function viewSale(saleId) {
  const response = await apiRequest(`/sales/${saleId}`);
  if (response && response.ok) {
    const sale = await response.json();

    let saleDetails = `
            Vente: ${sale.saleNumber}
            Date: ${new Date(sale.saleDate).toLocaleDateString("fr-FR")}
            Client: ${sale.customerName || "N/A"}
            Téléphone: ${sale.customerPhone || "N/A"}
            Paiement: ${sale.paymentMethod}
            
            Articles:
        `;

    sale.saleItems.forEach((item) => {
      saleDetails += `\n- ${item.productName}: ${item.quantity} x ${item.unitPrice}€ = ${item.subtotal}€`;
    });

    saleDetails += `\n\nTotal: ${sale.totalAmount}€`;
    saleDetails += `\nRemise: ${sale.discountAmount}€`;
    saleDetails += `\nTaxe: ${sale.taxAmount}€`;
    saleDetails += `\nMontant final: ${sale.finalAmount}€`;

    alert(saleDetails);
  }
}

// Expiration Functions
async function loadExpirationStats() {
  // Load expiring products (7 days warning)
  const expiringResponse = await apiRequest(
    "/products/alerts/expiring?warningDays=7"
  );
  if (expiringResponse && expiringResponse.ok) {
    const expiringProducts = await expiringResponse.json();
    document.getElementById("expiringProducts").textContent =
      expiringProducts.length;
  }

  // Load expired products
  const expiredResponse = await apiRequest("/products/alerts/expired");
  if (expiredResponse && expiredResponse.ok) {
    const expiredProducts = await expiredResponse.json();
    document.getElementById("expiredProducts").textContent =
      expiredProducts.length;
  }
}

async function loadExpirationAlerts(type) {
  const alertsContainer = document.getElementById("expirationAlerts");
  alertsContainer.innerHTML = '<div class="item">Chargement...</div>';

  let endpoint = "";
  if (type === "expiring") {
    endpoint = "/products/alerts/expiring?warningDays=7";
  } else if (type === "expired") {
    endpoint = "/products/alerts/expired";
  }

  const response = await apiRequest(endpoint);
  if (response && response.ok) {
    const products = await response.json();
    displayExpirationAlerts(products, type);
  } else {
    alertsContainer.innerHTML =
      '<div class="item">Erreur lors du chargement</div>';
  }
}

function displayExpirationAlerts(products, type) {
  const alertsContainer = document.getElementById("expirationAlerts");
  alertsContainer.innerHTML = "";

  if (products.length === 0) {
    const message =
      type === "expiring"
        ? "Aucun produit expirant dans les 7 prochains jours"
        : "Aucun produit expiré";
    alertsContainer.innerHTML = `<div class="item">${message}</div>`;
    return;
  }

  products.forEach((product) => {
    const alertItem = document.createElement("div");
    alertItem.className = "item";

    let statusIcon = "";
    let expiryInfo = "";

    if (product.expiryDate) {
      const expiryDate = new Date(product.expiryDate);
      const today = new Date();
      const daysUntilExpiry = Math.ceil(
        (expiryDate - today) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry < 0) {
        statusIcon = "❌";
        expiryInfo = `Expiré depuis ${Math.abs(daysUntilExpiry)} jour(s)`;
      } else if (daysUntilExpiry <= 7) {
        statusIcon = "⚠️";
        expiryInfo = `Expire dans ${daysUntilExpiry} jour(s)`;
      } else {
        statusIcon = "⏰";
        expiryInfo = `Expire le ${expiryDate.toLocaleDateString("fr-FR")}`;
      }
    } else {
      statusIcon = "ℹ️";
      expiryInfo = "Date d'expiration non définie";
    }

    alertItem.innerHTML = `
      <div class="item-info">
        <div class="item-name">${product.name} ${statusIcon}</div>
        <div class="item-details">
          ${expiryInfo} | Stock: ${product.stockQuantity} | Prix: ${
      product.sellingPrice
    }€
          ${product.category ? ` | ${product.category}` : ""}
        </div>
      </div>
      <div class="item-actions">
        <button class="btn btn-sm" onclick="editProduct(${
          product.id
        })">Modifier</button>
        <button class="btn btn-danger btn-sm" onclick="deleteProduct(${
          product.id
        })">Supprimer</button>
      </div>
    `;

    alertsContainer.appendChild(alertItem);
  });
}

// Update loadDashboardData to include expiration stats
async function loadDashboardData() {
  await Promise.all([
    loadProducts(),
    loadRecentSales(),
    loadStats(),
    loadExpirationStats(),
  ]);
}

// Global functions for onclick handlers
window.openModal = openModal;
window.closeModal = closeModal;
window.editProduct = function (id) {
  showAlert("Fonction de modification en cours de développement", "info");
};
window.deleteProduct = deleteProduct;
window.removeSaleItemRow = removeSaleItemRow;
window.viewSale = viewSale;
window.loadExpirationAlerts = loadExpirationAlerts;
