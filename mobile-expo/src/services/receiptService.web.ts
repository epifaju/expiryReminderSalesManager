import apiClient from './apiClient';

export interface Receipt {
  id: number;
  receiptNumber: string;
  saleId: number;
  userId: number;
  totalAmount: number;
  taxAmount?: number;
  discountAmount?: number;
  finalAmount: number;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  notes?: string;
  createdAt: string;
  status: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  downloadCount?: number;
  downloadedAt?: string;
}

export interface CreateReceiptRequest {
  saleId: number;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  notes?: string;
}

export interface CreateReceiptResponse {
  success: boolean;
  receipt: Receipt;
  message: string;
}

export interface ReceiptsResponse {
  receipts: Receipt[];
}

/**
 * Service de gestion des reçus (version web)
 */
class ReceiptService {
  private baseUrl = '/api/receipts';

  /**
   * Créer un nouveau reçu pour une vente
   */
  async createReceipt(request: CreateReceiptRequest): Promise<CreateReceiptResponse> {
    try {
      console.log('🧾 Création d\'un reçu pour la vente:', request.saleId);
      
      const response = await apiClient.post(`${this.baseUrl}/create/${request.saleId}`, request);
      
      console.log('✅ Reçu créé avec succès:', response.data);
      // Compat backend: ancien format {success,receipt,message} vs nouveau format ReceiptResponse direct
      if (response.data?.receipt) {
        return response.data;
      }
      return {
        success: true,
        receipt: response.data,
        message: 'Reçu créé avec succès',
      };
    } catch (error: any) {
      console.error('❌ Erreur création reçu:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de la création du reçu');
    }
  }

  /**
   * Récupérer tous les reçus de l'utilisateur connecté
   */
  async getReceipts(): Promise<ReceiptsResponse> {
    try {
      console.log('📋 Récupération des reçus...');
      
      const response = await apiClient.get(this.baseUrl);
      
      console.log('✅ Reçus récupérés:', response.data);
      if (Array.isArray(response.data)) {
        return { receipts: response.data };
      }
      if (response.data?.receipts) {
        return response.data;
      }
      return { receipts: [] };
    } catch (error: any) {
      console.error('❌ Erreur récupération reçus:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de la récupération des reçus');
    }
  }

  /**
   * Récupérer un reçu par son ID
   */
  async getReceiptById(receiptId: number): Promise<Receipt> {
    try {
      console.log('🔍 Récupération du reçu:', receiptId);
      
      const response = await apiClient.get(`${this.baseUrl}/${receiptId}`);
      
      console.log('✅ Reçu récupéré:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur récupération reçu:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de la récupération du reçu');
    }
  }

  /**
   * Récupérer un reçu par son numéro
   */
  async getReceiptByNumber(receiptNumber: string): Promise<Receipt> {
    try {
      console.log('🔍 Récupération du reçu par numéro:', receiptNumber);
      
      const response = await apiClient.get(`${this.baseUrl}/number/${receiptNumber}`);
      
      console.log('✅ Reçu récupéré:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur récupération reçu:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de la récupération du reçu');
    }
  }

  /**
   * Télécharger le PDF d'un reçu
   */
  async downloadReceiptPdf(receiptId: number): Promise<string> {
    try {
      console.log('📥 Téléchargement PDF du reçu:', receiptId);
      
      const response = await apiClient.get(`${this.baseUrl}/${receiptId}/pdf`, {
        responseType: 'blob',
      });
      
      // Convertir le blob en base64
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = () => {
          const base64 = reader.result as string;
          console.log('✅ PDF récupéré en base64');
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(response.data);
      });
    } catch (error: any) {
      console.error('❌ Erreur téléchargement PDF:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors du téléchargement du PDF');
    }
  }

  /**
   * Récupérer les reçus récemment téléchargés
   */
  async getRecentlyDownloadedReceipts(): Promise<ReceiptsResponse> {
    try {
      console.log('🕒 Récupération des reçus récemment téléchargés...');
      
      const response = await apiClient.get(`${this.baseUrl}/recent`);
      
      console.log('✅ Reçus récents récupérés:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur récupération reçus récents:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de la récupération des reçus récents');
    }
  }
}

export default new ReceiptService();
