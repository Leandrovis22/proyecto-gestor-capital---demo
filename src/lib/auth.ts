// src/lib/auth.ts

let isLoggingOut = false;
let logoutTimeout: NodeJS.Timeout | null = null;

/**
 * Helper para obtener el token de sesión del sessionStorage
 */
export function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('sessionToken');
}

/**
 * Helper para agregar headers de autenticación a un fetch
 */
export function getAuthHeaders(): HeadersInit {
  const token = getSessionToken();
  return token ? { 'X-Session-Token': token } : {};
}

/**
 * Wrapper para fetch que maneja automáticamente errores 401
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    ...options.headers,
    ...getAuthHeaders()
  };

  const response = await fetch(url, { ...options, headers });

  // Si el token es inválido, cerrar sesión UNA SOLA VEZ
  if (response.status === 401 && !isLoggingOut) {
    isLoggingOut = true;
    sessionStorage.removeItem('sessionToken');
    
    // Cancelar timeout previo si existe
    if (logoutTimeout) {
      clearTimeout(logoutTimeout);
    }
    
    // Emitir evento una sola vez con debounce
    logoutTimeout = setTimeout(() => {
      try {
        window.dispatchEvent(new CustomEvent('sessionExpired'));
      } catch (e) {
        console.error('Error emitiendo evento sessionExpired:', e);
      }
      isLoggingOut = false;
      logoutTimeout = null;
    }, 200);
    
    throw new Error('Sesión expirada');
  }

  return response;
}