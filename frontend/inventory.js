// API Configuration
const API_BASE_URL = "http://localhost:8080";
let authToken = localStorage.getItem("authToken");
let currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

// Global variables
let currentPage = 0;
let pageSize = 20;
let totalPages = 0;
let currentProducts = [];
let currentFilters = {
  search: "",
  category: "",
  status: "",
  sortBy: "name",
};

// Initialize inventory page
document.addEventListener("DOMContentLoaded", function () {
  if (!authToken || !currentUser.username) {
    window.location.href = "index.html";
    return;
  }

  setupEventListeners();
  loadInventory();
  loadCategories();
});

// Event Listeners
function setupEventListeners() {
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);
  document
    .getElementById("searchInput")
    .addEventListener("input", debounce(handleSearch, 300));
  document
    .getElementById("categoryFilter")
    .addEventListener("change", handleFilterChange);
  document
    .getElementById("statusFilter")
    .addEventListener("change", handleFilterChange);
  document
    .getElementById("sortBy")
    .addEventListener("change", handleFilterChange);
  document
    .getElementById("productForm")
    .addEventListener("submit", handleProductSubmit);
  document
    .getElementById("stockForm")
    .addEventListener("submit", handleStockAdjustment);
}

// Authentication
function handleLogout() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
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

// Main Inventory Loading
async function loadInventory() {
  showLoading();

  try {
    await Promise.all([loadProducts(), loadInventoryStats()]);
  } catch (error) {
    console.error("Error loading inventory:", error);
    showAlert("Erreur lors du chargement de l'inventaire", "error");
  }
}

async function loadProducts() {
  const params = new URLSearchParams({
    page: currentPage,
    size: pageSize,
    sortBy: currentFilters.sortBy,
    sortDir: "asc",
  });

  if (currentFilters.search) {
    params.append("q", currentFilters.search);
  }

  if (currentFilters.category) {
    params.append("category", currentFilters.category);
  }

  const endpoint = currentFilters.search
    ? `/products/search?${params}`
    : `/products?${params}`;

  const response = await apiRequest(endpoint);

  if (response && response.ok) {
    const data = await response.json();
    currentProducts = data.content || data;
    totalPages = data.totalPages || 1;

    displayProducts(currentProducts);
    updatePagination();
  } else {
    showAlert("Erreur lors du chargement des produits", "error");
  }
}

async function loadInventoryStats() {
  const response = await apiRequest("/products/stats");

  if (response && response.ok) {
    const stats = await response.json();
    updateStatsDisplay(stats);
  }
}

async function loadCategories() {
  const response = await apiRequest("/products/categories");

  if (response && response.ok) {
    const categories = await response.json();
    updateCategoryFilter(categories);
  }
}

// Display Functions
function displayProducts(products) {
  const container = document.getElementById("tableContainer");

  if (!products || products.length === 0) {
    container.innerHTML = '<div class="loading">Aucun produit trouvé</div>';
    return;
  }

  // Filter products based on status filter
  const filteredProducts = filterProductsByStatus(products);

  let html = `
        <table>
            <thead>
                <tr>
                    <th>Image</th>
                    <th>Produit</th>
                    <th>Catégorie</th>
                    <th>Code-barres</th>
                    <th>Stock</th>
                    <th>Prix</th>
                    <th>Statut</th>
                    <th>Expiration</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

  filteredProducts.forEach((product) => {
    const status = getProductStatus(product);
    const expiryInfo = getExpiryInfo(product);

    html += `
            <tr>
                <td>
                    <div class="product-image">📦</div>
                </td>
                <td>
                    <div>
                        <strong>${product.name}</strong>
                        ${
                          product.description
                            ? `<br><small style="color: #666;">${product.description}</small>`
                            : ""
                        }
                    </div>
                </td>
                <td>${product.category || "-"}</td>
                <td>${product.barcode || "-"}</td>
                <td>
                    <strong>${product.stockQuantity}</strong> ${
      product.unit || "pcs"
    }
                    <br><small style="color: #666;">Min: ${
                      product.minStockLevel || 0
                    }</small>
                </td>
                <td>
                    <div>Achat: ${product.purchasePrice.toFixed(2)} €</div>
                    <div><strong>Vente: ${product.sellingPrice.toFixed(
                      2
                    )} €</strong></div>
                </td>
                <td>
                    <span class="status-badge ${status.class}">${
      status.label
    }</span>
                </td>
                <td>${expiryInfo}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="editProduct(${
                          product.id
                        })" title="Modifier">✏️</button>
                        <button class="btn btn-sm btn-warning" onclick="adjustStock(${
                          product.id
                        })" title="Ajuster stock">📊</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProduct(${
                          product.id
                        })" title="Supprimer">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
  });

  html += "</tbody></table>";
  container.innerHTML = html;
}

function filterProductsByStatus(products) {
  if (!currentFilters.status) return products;

  return products.filter((product) => {
    const status = getProductStatus(product);
    return status.type === currentFilters.status;
  });
}

function getProductStatus(product) {
  const today = new Date();
  const expiryDate = product.expiryDate ? new Date(product.expiryDate) : null;

  // Check if expired
  if (expiryDate && expiryDate < today) {
    return { type: "expired", class: "status-expired", label: "❌ Expiré" };
  }

  // Check if expiring soon (7 days)
  if (expiryDate) {
    const daysUntilExpiry = Math.ceil(
      (expiryDate - today) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
      return {
        type: "expiring",
        class: "status-expiring",
        label: "⏰ Expire bientôt",
      };
    }
  }

  // Check stock levels
  if (product.stockQuantity === 0) {
    return {
      type: "out-of-stock",
      class: "status-out-of-stock",
      label: "❌ Rupture",
    };
  }

  if (product.stockQuantity <= product.minStockLevel) {
    return {
      type: "low-stock",
      class: "status-low-stock",
      label: "⚠️ Stock faible",
    };
  }

  return { type: "in-stock", class: "status-in-stock", label: "✅ En stock" };
}

function getExpiryInfo(product) {
  if (!product.expiryDate) return "-";

  const expiryDate = new Date(product.expiryDate);
  const today = new Date();
  const daysUntilExpiry = Math.ceil(
    (expiryDate - today) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry < 0) {
    return `<span style="color: #dc3545;">Expiré depuis ${Math.abs(
      daysUntilExpiry
    )} jour(s)</span>`;
  } else if (daysUntilExpiry <= 7) {
    return `<span style="color: #ffc107;">Dans ${daysUntilExpiry} jour(s)</span>`;
  } else {
    return expiryDate.toLocaleDateString("fr-FR");
  }
}

function updateStatsDisplay(stats) {
  document.getElementById("totalProducts").textContent = currentProducts.length;
  document.getElementById("lowStockCount").textContent =
    stats.lowStockCount || 0;
  document.getElementById("expiringCount").textContent =
    stats.expiringCount || 0;
  document.getElementById("categoriesCount").textContent =
    stats.categoriesCount || 0;

  // Calculate additional stats
  const outOfStockCount = currentProducts.filter(
    (p) => p.stockQuantity === 0
  ).length;
  document.getElementById("outOfStockCount").textContent = outOfStockCount;

  const stockValue = currentProducts.reduce((total, product) => {
    return total + product.stockQuantity * product.purchasePrice;
  }, 0);
  document.getElementById("stockValue").textContent = `${stockValue.toFixed(
    2
  )} €`;
}

function updateCategoryFilter(categories) {
  const select = document.getElementById("categoryFilter");
  const currentValue = select.value;

  select.innerHTML = '<option value="">Toutes catégories</option>';

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });

  select.value = currentValue;
}

function updatePagination() {
  const container = document.getElementById("pagination");

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = `
        <button ${currentPage === 0 ? "disabled" : ""} onclick="changePage(${
    currentPage - 1
  })">‹ Précédent</button>
    `;

  // Show page numbers
  const startPage = Math.max(0, currentPage - 2);
  const endPage = Math.min(totalPages - 1, currentPage + 2);

  for (let i = startPage; i <= endPage; i++) {
    html += `
            <button class="${
              i === currentPage ? "active" : ""
            }" onclick="changePage(${i})">
                ${i + 1}
            </button>
        `;
  }

  html += `
        <button ${
          currentPage === totalPages - 1 ? "disabled" : ""
        } onclick="changePage(${currentPage + 1})">Suivant ›</button>
    `;

  container.innerHTML = html;
}

// Event Handlers
function handleSearch(event) {
  currentFilters.search = event.target.value;
  currentPage = 0;
  loadProducts();
}

function handleFilterChange(event) {
  const filterId = event.target.id;

  if (filterId === "categoryFilter") {
    currentFilters.category = event.target.value;
  } else if (filterId === "statusFilter") {
    currentFilters.status = event.target.value;
  } else if (filterId === "sortBy") {
    currentFilters.sortBy = event.target.value;
  }

  currentPage = 0;

  if (filterId === "statusFilter") {
    // For status filter, we filter on frontend
    displayProducts(currentProducts);
  } else {
    // For other filters, reload from backend
    loadProducts();
  }
}

function changePage(page) {
  if (page >= 0 && page < totalPages) {
    currentPage = page;
    loadProducts();
  }
}

// Product Management
async function handleProductSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const isEdit = form.dataset.isEdit === "true";
  const productId = form.dataset.productId;

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

  // Add dates if provided
  const expiryDate = document.getElementById("productExpiryDate").value;
  if (expiryDate) {
    productData.expiryDate = expiryDate;
  }

  const manufacturingDate = document.getElementById(
    "productManufacturingDate"
  ).value;
  if (manufacturingDate) {
    productData.manufacturingDate = manufacturingDate;
  }

  const endpoint = isEdit ? `/products/${productId}` : "/products";
  const method = isEdit ? "PUT" : "POST";

  const response = await apiRequest(endpoint, {
    method: method,
    body: JSON.stringify(productData),
  });

  if (response && response.ok) {
    const successMessage = isEdit
      ? "Produit modifié avec succès!"
      : "Produit ajouté avec succès!";
    showAlert(successMessage, "success");
    closeModal("productModal");
    resetProductForm();
    loadInventory();
  } else {
    const error = await response.json();
    showAlert(
      error.error || "Erreur lors de la sauvegarde du produit",
      "error"
    );
  }
}

async function editProduct(productId) {
  const response = await apiRequest(`/products/${productId}`);

  if (response && response.ok) {
    const product = await response.json();

    // Fill form with product data
    document.getElementById("productName").value = product.name || "";
    document.getElementById("productDescription").value =
      product.description || "";
    document.getElementById("productBarcode").value = product.barcode || "";
    document.getElementById("productCategory").value = product.category || "";
    document.getElementById("productPurchasePrice").value =
      product.purchasePrice || "";
    document.getElementById("productSellingPrice").value =
      product.sellingPrice || "";
    document.getElementById("productStockQuantity").value =
      product.stockQuantity || "";
    document.getElementById("productMinStockLevel").value =
      product.minStockLevel || "";
    document.getElementById("productUnit").value = product.unit || "";

    if (product.expiryDate) {
      document.getElementById("productExpiryDate").value = product.expiryDate;
    }
    if (product.manufacturingDate) {
      document.getElementById("productManufacturingDate").value =
        product.manufacturingDate;
    }

    // Set form as edit mode
    document.getElementById("productModalTitle").textContent =
      "Modifier le Produit";
    document.getElementById("productForm").dataset.productId = productId;
    document.getElementById("productForm").dataset.isEdit = "true";

    openModal("productModal");
  } else {
    showAlert("Erreur lors du chargement du produit", "error");
  }
}

async function deleteProduct(productId) {
  if (confirm("Êtes-vous sûr de vouloir supprimer ce produit?")) {
    const response = await apiRequest(`/products/${productId}`, {
      method: "DELETE",
    });

    if (response && response.ok) {
      showAlert("Produit supprimé avec succès!", "success");
      loadInventory();
    } else {
      showAlert("Erreur lors de la suppression du produit", "error");
    }
  }
}

// Stock Management
function adjustStock(productId) {
  const product = currentProducts.find((p) => p.id === productId);
  if (!product) return;

  document.getElementById("stockProductName").value = product.name;
  document.getElementById("currentStock").value = product.stockQuantity;
  document.getElementById("stockAdjustment").value = "";
  document.getElementById("adjustmentReason").value = "restock";

  document.getElementById("stockForm").dataset.productId = productId;
  openModal("stockModal");
}

async function handleStockAdjustment(event) {
  event.preventDefault();

  const productId = document.getElementById("stockForm").dataset.productId;
  const currentStock = parseInt(document.getElementById("currentStock").value);
  const adjustment = parseInt(document.getElementById("stockAdjustment").value);
  const newStock = currentStock + adjustment;

  if (newStock < 0) {
    showAlert("Le stock ne peut pas être négatif", "error");
    return;
  }

  const response = await apiRequest(
    `/products/${productId}/stock?quantity=${newStock}`,
    {
      method: "PATCH",
    }
  );

  if (response && response.ok) {
    showAlert("Stock ajusté avec succès!", "success");
    closeModal("stockModal");
    loadInventory();
  } else {
    showAlert("Erreur lors de l'ajustement du stock", "error");
  }
}

// Modal Functions
function openModal(modalId) {
  document.getElementById(modalId).classList.add("active");
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("active");

  if (modalId === "productModal") {
    resetProductForm();
  }
}

function resetProductForm() {
  const form = document.getElementById("productForm");
  form.reset();
  form.removeAttribute("data-product-id");
  form.removeAttribute("data-is-edit");
  document.getElementById("productModalTitle").textContent =
    "Ajouter un Produit";
}

function openAddProductModal() {
  resetProductForm();
  openModal("productModal");
}

// Utility Functions
function showLoading() {
  document.getElementById("tableContainer").innerHTML =
    '<div class="loading">Chargement...</div>';
}

function showAlert(message, type) {
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

  document.body.appendChild(alert);

  setTimeout(() => {
    if (alert.parentNode) {
      alert.parentNode.removeChild(alert);
    }
  }, 5000);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Additional Features
function refreshInventory() {
  loadInventory();
  showAlert("Inventaire actualisé", "success");
}

function checkExpirations() {
  const today = new Date();
  const expiringProducts = currentProducts.filter((product) => {
    if (!product.expiryDate) return false;
    const expiryDate = new Date(product.expiryDate);
    const daysUntilExpiry = Math.ceil(
      (expiryDate - today) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
  });

  const expiredProducts = currentProducts.filter((product) => {
    if (!product.expiryDate) return false;
    const expiryDate = new Date(product.expiryDate);
    return expiryDate < today;
  });

  let message = `Vérification terminée:\n`;
  message += `- ${expiringProducts.length} produit(s) expirant dans 7 jours\n`;
  message += `- ${expiredProducts.length} produit(s) expirés`;

  alert(message);
}

function exportInventory() {
  const csvContent = generateInventoryCSV();
  downloadCSV(
    csvContent,
    `inventaire-${new Date().toISOString().split("T")[0]}.csv`
  );
}

function generateInventoryCSV() {
  let csv =
    "Nom,Catégorie,Code-barres,Stock,Prix Achat,Prix Vente,Statut,Date Expiration\n";

  currentProducts.forEach((product) => {
    const status = getProductStatus(product);
    const expiryDate = product.expiryDate || "";

    csv += `"${product.name}","${product.category || ""}","${
      product.barcode || ""
    }",${product.stockQuantity},${product.purchasePrice},${
      product.sellingPrice
    },"${status.label}","${expiryDate}"\n`;
  });

  return csv;
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

// Global functions for onclick handlers
window.openAddProductModal = openAddProductModal;
window.closeModal = closeModal;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.adjustStock = adjustStock;
window.changePage = changePage;
window.refreshInventory = refreshInventory;
window.checkExpirations = checkExpirations;
window.exportInventory = exportInventory;
