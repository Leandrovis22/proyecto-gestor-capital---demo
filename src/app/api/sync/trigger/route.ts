// src/app/api/sync/trigger/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/sessionManager';

// ========================================
// API PARA DISPARAR SINCRONIZACIÓN EN GOOGLE APPS SCRIPT
// ========================================

// Configuración de Google Apps Script Web App
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_WEB_APP_URL || '';
const API_KEY = process.env.SYNC_API_KEY || '';

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================

function verificarAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const sessionToken = request.headers.get('x-session-token');
  
  // Autenticación con Bearer token (interno)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    return token === API_KEY;
  }
  
  // Autenticación con session token (cliente)
  if (sessionToken) {
    return validateSession(sessionToken);
  }
  
  return false;
}

// ========================================
// POST: Disparar sincronización en Google Script
// ========================================

export async function POST(request: NextRequest) {
  // Autenticación
  if (!verificarAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (!GOOGLE_SCRIPT_URL) {
    return NextResponse.json(
      { error: 'Google Script URL no configurada. Añade GOOGLE_SCRIPT_WEB_APP_URL al .env' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const forzarTodo = body.forzarTodo || false;
    
    console.log(`🔔 Disparando sincronización en Google Script (forzarTodo: ${forzarTodo})`);
    
    // Llamar al Web App de Google Script
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        forzarTodo,
        authorization: `Bearer ${API_KEY}` // Doble autenticación para doPost
      })
    });

    if (!response.ok) {
      throw new Error(`Google Script respondió con status ${response.status}`);
    }

    const resultado = await response.json();
    
    if (!resultado.exito) {
      console.error('❌ Error en Google Script:', resultado.error);
      return NextResponse.json(
        { error: resultado.error || 'Error en sincronización' },
        { status: 500 }
      );
    }

    console.log(`✅ Sincronización completada en ${resultado.duracionSegundos}s`);
    console.log(`📊 Archivos actualizados: ${resultado.archivosActualizados}`);
    console.log(`⏭️  Archivos omitidos: ${resultado.archivosOmitidos}`);

    return NextResponse.json({
      success: true,
      mensaje: 'Sincronización disparada exitosamente',
      ...resultado
    });

  } catch (error) {
    console.error('❌ Error al disparar sincronización:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al conectar con Google Script' },
      { status: 500 }
    );
  }
}

// ========================================
// GET: Estado de la sincronización
// ========================================

export async function GET(request: NextRequest) {
  // Autenticación
  if (!verificarAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  return NextResponse.json({
    available: !!GOOGLE_SCRIPT_URL,
    endpoints: {
      triggerSync: '/api/sync/trigger',
      receiveData: '/api/sync/receive'
    },
    usage: {
      post: {
        description: 'Disparar sincronización en Google Apps Script',
        body: {
          forzarTodo: 'boolean (opcional) - true para sincronizar todos los archivos, false para solo cambios'
        },
        examples: [
          { forzarTodo: false, description: 'Solo sincronizar archivos que cambiaron' },
          { forzarTodo: true, description: 'Sincronización completa semanal' }
        ]
      }
    }
  });
}
