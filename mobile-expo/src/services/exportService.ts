import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { Alert } from 'react-native';

interface Product {
  id: number;
  name: string;
  sellingPrice: number;
  stockQuantity: number;
  category: string;
  purchasePrice: number;
}

interface Sale {
  id: number;
  saleDate: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  items?: SaleItem[];
}

interface SaleItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface ReportStats {
  totalSales: number;
  totalRevenue: number;
  totalProducts: number;
  averageOrderValue: number;
  topSellingProducts: Array<{
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  salesByPaymentMethod: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
  salesByPeriod: Array<{
    period: string;
    sales: number;
    revenue: number;
  }>;
  profitAnalysis: {
    totalCost: number;
    totalRevenue: number;
    grossProfit: number;
    profitMargin: number;
  };
}

export class ExportService {
  
  // Export CSV functionality
  static async exportToCSV(data: any[], filename: string, headers: string[]): Promise<void> {
    try {
      // Create CSV content
      let csvContent = headers.join(',') + '\n';
      
      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header] || '';
          // Escape commas and quotes in CSV
          return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        });
        csvContent += values.join(',') + '\n';
      });

      // Create file path
      const fileUri = FileSystem.documentDirectory + `${filename}.csv`;
      
      // Write file
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Exporter le rapport CSV',
        });
      } else {
        Alert.alert('Succès', `Fichier CSV sauvegardé: ${filename}.csv`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      Alert.alert('Erreur', 'Impossible d\'exporter le fichier CSV');
    }
  }

  // Export sales data to CSV
  static async exportSalesToCSV(sales: Sale[], period: string): Promise<void> {
    const salesData = sales.map(sale => ({
      'ID': sale.id,
      'Date': new Date(sale.saleDate).toLocaleDateString('fr-FR'),
      'Montant Total': `${sale.totalAmount.toFixed(2)} €`,
      'Méthode de Paiement': sale.paymentMethod === 'CASH' ? 'Espèces' : 
                            sale.paymentMethod === 'CARD' ? 'Carte' : 'Virement',
      'Statut': sale.status === 'COMPLETED' ? 'Terminé' : sale.status,
      'Nombre d\'articles': sale.items?.length || 0,
    }));

    const headers = ['ID', 'Date', 'Montant Total', 'Méthode de Paiement', 'Statut', 'Nombre d\'articles'];
    const filename = `ventes_${period}_${new Date().toISOString().split('T')[0]}`;
    
    await this.exportToCSV(salesData, filename, headers);
  }

  // Export products data to CSV
  static async exportProductsToCSV(products: Product[]): Promise<void> {
    const productsData = products.map(product => ({
      'ID': product.id,
      'Nom': product.name,
      'Catégorie': product.category || 'Non catégorisé',
      'Prix d\'achat': `${product.purchasePrice.toFixed(2)} €`,
      'Prix de vente': `${product.sellingPrice.toFixed(2)} €`,
      'Stock': product.stockQuantity,
      'Marge': `${(((product.sellingPrice - product.purchasePrice) / product.sellingPrice) * 100).toFixed(1)}%`,
    }));

    const headers = ['ID', 'Nom', 'Catégorie', 'Prix d\'achat', 'Prix de vente', 'Stock', 'Marge'];
    const filename = `produits_${new Date().toISOString().split('T')[0]}`;
    
    await this.exportToCSV(productsData, filename, headers);
  }

  // Export top selling products to CSV
  static async exportTopProductsToCSV(topProducts: ReportStats['topSellingProducts'], period: string): Promise<void> {
    const productsData = topProducts.map((product, index) => ({
      'Rang': index + 1,
      'Produit': product.productName,
      'Quantité Vendue': product.totalQuantity,
      'Chiffre d\'Affaires': `${product.totalRevenue.toFixed(2)} €`,
    }));

    const headers = ['Rang', 'Produit', 'Quantité Vendue', 'Chiffre d\'Affaires'];
    const filename = `top_produits_${period}_${new Date().toISOString().split('T')[0]}`;
    
    await this.exportToCSV(productsData, filename, headers);
  }

  // Export complete report to PDF
  static async exportReportToPDF(stats: ReportStats, period: string, sales: Sale[], products: Product[]): Promise<void> {
    try {
      const currentDate = new Date().toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const periodLabel = period === 'today' ? 'Aujourd\'hui' :
                         period === 'week' ? 'Cette semaine' :
                         period === 'month' ? 'Ce mois' : 'Cette année';

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Rapport de Ventes - ${periodLabel}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 20px;
              color: #333;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #667eea;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #667eea;
              margin: 0;
              font-size: 28px;
            }
            .header p {
              color: #666;
              margin: 5px 0;
              font-size: 14px;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin-bottom: 30px;
            }
            .stat-card {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #667eea;
            }
            .stat-card h3 {
              margin: 0 0 10px 0;
              color: #667eea;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .stat-card .value {
              font-size: 24px;
              font-weight: bold;
              color: #333;
              margin: 0;
            }
            .section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .section h2 {
              color: #667eea;
              border-bottom: 2px solid #e9ecef;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              background: white;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #dee2e6;
            }
            th {
              background-color: #667eea;
              color: white;
              font-weight: 600;
              text-transform: uppercase;
              font-size: 12px;
              letter-spacing: 0.5px;
            }
            tr:hover {
              background-color: #f8f9fa;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .profit-analysis {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #28a745;
            }
            .profit-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e9ecef;
            }
            .profit-row:last-child {
              border-bottom: none;
              font-weight: bold;
              font-size: 18px;
              color: #28a745;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #666;
              font-size: 12px;
              border-top: 1px solid #e9ecef;
              padding-top: 20px;
            }
            @media print {
              body { margin: 0; }
              .page-break { page-break-before: always; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Rapport de Ventes</h1>
            <p><strong>Période:</strong> ${periodLabel}</p>
            <p><strong>Généré le:</strong> ${currentDate}</p>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <h3>Ventes Totales</h3>
              <p class="value">${stats.totalSales}</p>
            </div>
            <div class="stat-card">
              <h3>Chiffre d'Affaires</h3>
              <p class="value">${stats.totalRevenue.toFixed(2)} €</p>
            </div>
            <div class="stat-card">
              <h3>Panier Moyen</h3>
              <p class="value">${stats.averageOrderValue.toFixed(2)} €</p>
            </div>
            <div class="stat-card">
              <h3>Produits Actifs</h3>
              <p class="value">${stats.totalProducts}</p>
            </div>
          </div>

          <div class="section">
            <h2>🏆 Top Produits Vendus</h2>
            <table>
              <thead>
                <tr>
                  <th>Rang</th>
                  <th>Produit</th>
                  <th class="text-right">Quantité</th>
                  <th class="text-right">Chiffre d'Affaires</th>
                </tr>
              </thead>
              <tbody>
                ${stats.topSellingProducts.map((product, index) => `
                  <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>${product.productName}</td>
                    <td class="text-right">${product.totalQuantity}</td>
                    <td class="text-right">${product.totalRevenue.toFixed(2)} €</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>💳 Répartition par Méthode de Paiement</h2>
            <table>
              <thead>
                <tr>
                  <th>Méthode</th>
                  <th class="text-right">Nombre de Ventes</th>
                  <th class="text-right">Montant Total</th>
                </tr>
              </thead>
              <tbody>
                ${stats.salesByPaymentMethod.map(method => `
                  <tr>
                    <td>${method.method === 'CASH' ? 'Espèces' : method.method === 'CARD' ? 'Carte' : 'Virement'}</td>
                    <td class="text-right">${method.count}</td>
                    <td class="text-right">${method.amount.toFixed(2)} €</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section page-break">
            <h2>📈 Analyse de Rentabilité</h2>
            <div class="profit-analysis">
              <div class="profit-row">
                <span>Chiffre d'affaires:</span>
                <span>${stats.profitAnalysis.totalRevenue.toFixed(2)} €</span>
              </div>
              <div class="profit-row">
                <span>Coût des marchandises:</span>
                <span>-${stats.profitAnalysis.totalCost.toFixed(2)} €</span>
              </div>
              <div class="profit-row">
                <span>Bénéfice brut:</span>
                <span>${stats.profitAnalysis.grossProfit.toFixed(2)} €</span>
              </div>
              <div class="profit-row">
                <span>Marge bénéficiaire:</span>
                <span>${stats.profitAnalysis.profitMargin.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>📋 Détail des Ventes Récentes</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th class="text-right">Montant</th>
                  <th>Paiement</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                ${sales.slice(0, 10).map(sale => `
                  <tr>
                    <td>${sale.id}</td>
                    <td>${new Date(sale.saleDate).toLocaleDateString('fr-FR')}</td>
                    <td class="text-right">${sale.totalAmount.toFixed(2)} €</td>
                    <td>${sale.paymentMethod === 'CASH' ? 'Espèces' : sale.paymentMethod === 'CARD' ? 'Carte' : 'Virement'}</td>
                    <td>${sale.status === 'COMPLETED' ? 'Terminé' : sale.status}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>Rapport généré automatiquement par Sales Manager Mobile</p>
            <p>© ${new Date().getFullYear()} - Tous droits réservés</p>
          </div>
        </body>
        </html>
      `;

      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      // Share PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Exporter le rapport PDF',
        });
      } else {
        Alert.alert('Succès', 'Rapport PDF généré avec succès');
      }
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      Alert.alert('Erreur', 'Impossible de générer le rapport PDF');
    }
  }

  // Export sales summary to PDF
  static async exportSalesSummaryToPDF(sales: Sale[], period: string): Promise<void> {
    try {
      const currentDate = new Date().toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const periodLabel = period === 'today' ? 'Aujourd\'hui' :
                         period === 'week' ? 'Cette semaine' :
                         period === 'month' ? 'Ce mois' : 'Cette année';

      const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const averageOrder = sales.length > 0 ? totalRevenue / sales.length : 0;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Résumé des Ventes - ${periodLabel}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 20px;
              color: #333;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #28a745;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #28a745;
              margin: 0;
              font-size: 28px;
            }
            .summary {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
              border-left: 4px solid #28a745;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #dee2e6;
            }
            th {
              background-color: #28a745;
              color: white;
              font-weight: 600;
            }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>💰 Résumé des Ventes</h1>
            <p><strong>Période:</strong> ${periodLabel}</p>
            <p><strong>Généré le:</strong> ${currentDate}</p>
          </div>

          <div class="summary">
            <h3>Résumé Exécutif</h3>
            <p><strong>Nombre total de ventes:</strong> ${sales.length}</p>
            <p><strong>Chiffre d'affaires total:</strong> ${totalRevenue.toFixed(2)} €</p>
            <p><strong>Panier moyen:</strong> ${averageOrder.toFixed(2)} €</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>ID Vente</th>
                <th>Date</th>
                <th class="text-right">Montant</th>
                <th>Méthode de Paiement</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              ${sales.map(sale => `
                <tr>
                  <td>${sale.id}</td>
                  <td>${new Date(sale.saleDate).toLocaleDateString('fr-FR')}</td>
                  <td class="text-right">${sale.totalAmount.toFixed(2)} €</td>
                  <td>${sale.paymentMethod === 'CASH' ? 'Espèces' : sale.paymentMethod === 'CARD' ? 'Carte' : 'Virement'}</td>
                  <td>${sale.status === 'COMPLETED' ? 'Terminé' : sale.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Exporter le résumé des ventes PDF',
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'export PDF des ventes:', error);
      Alert.alert('Erreur', 'Impossible de générer le résumé PDF des ventes');
    }
  }
}
