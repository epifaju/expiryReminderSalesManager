import apiClient from './apiClient';

export interface Receipt {
  id: number;
  receiptNumber: string;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyLogoUrl?: string;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  downloadedAt?: string;
  downloadCount: number;
  sale: {
    id: number;
    saleNumber: string;
    saleDate: string;
    saleItems: Array<{
      id: number;
      quantity: number;
      unitPrice: number;
      discount: number;
      subtotal: number;
      product: {
        id: number;
        name: string;
        description?: string;
      };
    }>;
  };
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateReceiptRequest {
  saleId: number;
}

export interface UpdateReceiptRequest {
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyLogoUrl?: string;
  notes?: string;
}

class ReceiptService {
  private baseUrl = '/api/receipts';

  /**
   * Crée un nouveau reçu pour une vente
   */
  async createReceipt(saleId: number): Promise<Receipt> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/create/${saleId}`);
      return response.data.receipt;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Erreur lors de la création du reçu');
    }
  }

  /**
   * Récupère tous les reçus de l'utilisateur connecté
   */
  async getUserReceipts(): Promise<Receipt[]> {
    try {
      console.log('🔗 Tentative de récupération des reçus depuis:', `${apiClient.defaults.baseURL}${this.baseUrl}`);
      
      const response = await apiClient.get(this.baseUrl);
      console.log('✅ Reçus récupérés:', response.data);
      
      if (response.data && response.data.receipts) {
        return response.data.receipts;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des reçus:', error);
      console.error('📊 Détails erreur:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: `${apiClient.defaults.baseURL}${this.baseUrl}`
      });
      
      // En cas d'erreur réseau ou d'authentification, retourner une liste vide pour éviter le crash
      if (error.message === 'Network Error' || 
          error.code === 'NETWORK_ERROR' ||
          error.response?.status === 403 ||
          error.message.includes('403') ||
          error.message.includes('Unauthorized')) {
        console.warn('⚠️ Erreur réseau/auth - Retour d\'une liste vide pour éviter le crash:', error.message);
        return [];
      }
      
      throw new Error(error.response?.data?.error || error.message || 'Erreur lors de la récupération des reçus');
    }
  }

  /**
   * Récupère un reçu par son ID
   */
  async getReceipt(receiptId: number): Promise<Receipt> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${receiptId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Reçu non trouvé');
    }
  }

  /**
   * Récupère un reçu par son numéro
   */
  async getReceiptByNumber(receiptNumber: string): Promise<Receipt> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/number/${receiptNumber}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Reçu non trouvé');
    }
  }

  /**
   * Télécharge le PDF d'un reçu
   */
  async downloadReceiptPdf(receiptId: number): Promise<Blob> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${receiptId}/pdf`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf',
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Erreur lors du téléchargement du PDF');
    }
  }

  /**
   * Télécharge le PDF d'un reçu par son numéro
   */
  async downloadReceiptPdfByNumber(receiptNumber: string): Promise<Blob> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/number/${receiptNumber}/pdf`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf',
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Erreur lors du téléchargement du PDF');
    }
  }

  /**
   * Met à jour les informations d'un reçu
   */
  async updateReceipt(receiptId: number, updateData: UpdateReceiptRequest): Promise<Receipt> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${receiptId}`, updateData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Erreur lors de la mise à jour du reçu');
    }
  }

  /**
   * Supprime un reçu
   */
  async deleteReceipt(receiptId: number): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${receiptId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Erreur lors de la suppression du reçu');
    }
  }

  /**
   * Formate un montant en devise
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  /**
   * Formate une date
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Obtient le texte du mode de paiement
   */
  getPaymentMethodText(paymentMethod: string): string {
    const methods: { [key: string]: string } = {
      CASH: 'Espèces',
      CARD: 'Carte bancaire',
      MOBILE_MONEY: 'Mobile Money',
      BANK_TRANSFER: 'Virement bancaire',
      CREDIT: 'Crédit',
    };
    return methods[paymentMethod] || paymentMethod;
  }

  /**
   * Obtient le texte du statut
   */
  getStatusText(status: string): string {
    const statuses: { [key: string]: string } = {
      GENERATED: 'Généré',
      SENT: 'Envoyé',
      DELIVERED: 'Livré',
      FAILED: 'Échec',
    };
    return statuses[status] || status;
  }

  /**
   * Vérifie si un reçu peut être téléchargé
   */
  isReceiptDownloadable(receipt: Receipt): boolean {
    return receipt.status === 'GENERATED' || receipt.status === 'DELIVERED';
  }
}

export const receiptService = new ReceiptService();
