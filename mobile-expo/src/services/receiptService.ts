import apiClient from './apiClient';
import i18n from '../i18n';

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
  saleId: number;
  saleNumber: string;
  saleDate: string;
  qrCodeData?: string;
  // Propriétés optionnelles pour la compatibilité avec l'ancienne structure
  sale?: {
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
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  // Propriétés utilisateur directes (pour la nouvelle structure)
  userId?: number;
  userFirstName?: string;
  userLastName?: string;
  userEmail?: string;
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
      console.log('🧾 Création d\'un reçu pour la vente:', saleId);
      
      const response = await apiClient.post(`${this.baseUrl}/create/${saleId}`);
      console.log('✅ Reçu créé avec succès:', response.data);
      
      // Vérifier la structure de la réponse
      if (!response.data) {
        throw new Error('Réponse vide reçue du serveur');
      }
      
      if (!response.data.receipt) {
        console.error('❌ Structure de réponse inattendue:', response.data);
        throw new Error('Structure de réponse inattendue: propriété "receipt" manquante');
      }
      
      const receipt = response.data.receipt;
      
      // Vérifier que le reçu a les propriétés essentielles
      if (!receipt.id) {
        console.error('❌ Reçu créé sans ID:', receipt);
        throw new Error('Reçu créé sans ID');
      }
      
      if (!receipt.receiptNumber) {
        console.error('❌ Reçu créé sans numéro de reçu:', receipt);
        throw new Error('Reçu créé sans numéro de reçu');
      }
      
      console.log('✅ Reçu valide créé:', {
        id: receipt.id,
        receiptNumber: receipt.receiptNumber,
        finalAmount: receipt.finalAmount
      });
      
      return receipt;
    } catch (error: any) {
      console.error('❌ Erreur lors de la création du reçu:', error);
      
      // Gestion spécifique des erreurs connues
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message;
        if (errorMessage && errorMessage.includes('Un reçu existe déjà pour cette vente')) {
          throw new Error('Un reçu existe déjà pour cette vente. Chaque vente ne peut avoir qu\'un seul reçu.');
        }
        throw new Error(errorMessage || 'Erreur de validation de la demande');
      }
      
      if (error.response?.status === 403) {
        throw new Error('Accès non autorisé. Vérifiez vos permissions.');
      }
      
      if (error.response?.status === 404) {
        throw new Error('Vente non trouvée. Vérifiez que la vente existe.');
      }
      
      if (error.response?.status >= 500) {
        throw new Error('Erreur du serveur. Veuillez réessayer plus tard.');
      }
      
      // Gestion des erreurs réseau et de stream
      if (error.message === 'Network Error' || 
          error.code === 'NETWORK_ERROR' || 
          error.message === 'stream has been aborted' ||
          error.code === 'ERR_BAD_RESPONSE') {
        
        // Dans ce cas, vérifier si le reçu a quand même été créé
        console.log('🔍 Vérification si le reçu a été créé malgré l\'erreur...');
        try {
          const receipts = await this.getUserReceipts();
          const existingReceipt = receipts.find(r => r.saleId === saleId);
          
          if (existingReceipt) {
            console.log('✅ Le reçu a été créé malgré l\'erreur:', existingReceipt.receiptNumber);
            return existingReceipt;
          }
        } catch (checkError) {
          console.log('❌ Impossible de vérifier les reçus existants:', checkError.message);
        }
        
        throw new Error('Erreur de connexion réseau. Vérifiez votre connexion internet et que le serveur backend est démarré.');
      }
      
      // Erreur par défaut
      throw new Error(error.response?.data?.error || error.response?.data?.message || error.message || 'Erreur lors de la création du reçu');
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
          'Accept-Language': i18n.language,
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
          'Accept-Language': i18n.language,
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
  formatCurrency(amount: number, locale: string = 'fr-FR'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  /**
   * Formate une date
   */
  formatDate(dateString: string, locale: string = 'fr-FR'): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
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
  getPaymentMethodText(paymentMethod: string, t?: (key: string) => string): string {
    if (t) {
      const methodKey = paymentMethod.toLowerCase();
      const translationKey = `receipts.paymentMethods.${methodKey}`;
      const translated = t(translationKey);
      if (translated !== translationKey) {
        return translated;
      }
    }
    
    // Fallback en français si pas de traduction
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
  getStatusText(status: string, t?: (key: string) => string): string {
    if (t) {
      const statusKey = status.toLowerCase();
      const translationKey = `receipts.status.${statusKey}`;
      const translated = t(translationKey);
      if (translated !== translationKey) {
        return translated;
      }
    }
    
    // Fallback en français si pas de traduction
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
