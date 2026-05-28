import 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** Ne pas logger d'erreur console pour un 404 (recherche code-barres, etc.). */
    silentNotFound?: boolean;
  }
}
