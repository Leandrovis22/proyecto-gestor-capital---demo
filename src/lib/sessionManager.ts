import { randomBytes } from 'crypto';

// Usar globalThis para persistir entre reloads de Next.js en desarrollo
declare global {
  var activeSessions: Map<string, { username: string; createdAt: number }> | undefined;
}

// Almacenamiento de sesiones que persiste en desarrollo
const activeSessions = global.activeSessions || new Map<string, { username: string; createdAt: number }>();
if (!global.activeSessions) {
  global.activeSessions = activeSessions;
  console.log('🔧 Sistema de sesiones inicializado');
}

// Duración de sesión: 24 horas
export const SESSION_DURATION = 24 * 60 * 60 * 1000;

// Limpiar sesiones expiradas cada hora
if (!global.activeSessions) {
  setInterval(() => {
    const now = Date.now();
    for (const [token, session] of activeSessions.entries()) {
      if (now - session.createdAt > SESSION_DURATION) {
        activeSessions.delete(token);
        //console.log('🗑️ Sesión expirada eliminada');
      }
    }
  }, 60 * 60 * 1000);
}

/**
 * Crea una nueva sesión y devuelve el token
 */
export function createSession(username: string): string {
  const sessionToken = randomBytes(32).toString('hex');
  
  activeSessions.set(sessionToken, {
    username,
    createdAt: Date.now()
  });
  
  //console.log('✅ Nueva sesión creada para:', username);
  //console.log('🔑 Token:', sessionToken.substring(0, 16) + '...');
  //console.log('📊 Total sesiones activas:', activeSessions.size);
  return sessionToken;
}

/**
 * Valida si un token de sesión existe y no ha expirado
 */
export function validateSession(sessionToken: string | null): boolean {
  if (!sessionToken) {
    //console.log('❌ No se proporcionó token de sesión');
    return false;
  }
  
  //console.log('🔍 Buscando sesión:', sessionToken.substring(0, 16) + '...');
  //console.log('📊 Sesiones activas:', activeSessions.size);
  //console.log('🔑 Tokens disponibles:', Array.from(activeSessions.keys()).map(k => k.substring(0, 16) + '...'));
  
  const session = activeSessions.get(sessionToken);
  if (!session) {
    //console.log('❌ Sesión no encontrada');
    return false;
  }
  
  // Verificar que no haya expirado
  const now = Date.now();
  const age = now - session.createdAt;
  if (age > SESSION_DURATION) {
    activeSessions.delete(sessionToken);
    //console.log('❌ Sesión expirada');
    return false;
  }
  
  //console.log('✅ Sesión válida para:', session.username, `(${Math.floor(age / 1000 / 60)} minutos)`);
  return true;
}

/**
 * Elimina una sesión
 */
export function deleteSession(sessionToken: string): void {
  activeSessions.delete(sessionToken);
  //console.log('🗑️ Sesión eliminada');
}

/**
 * Obtiene el número de sesiones activas
 */
export function getActiveSessions(): number {
  return activeSessions.size;
}
