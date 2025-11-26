// src/app/api/sync/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateSession } from '@/lib/sessionManager';

const API_KEY = process.env.SYNC_API_KEY || 'tu-clave-secreta-super-segura';

function verificarAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const sessionToken = request.headers.get('x-session-token');

  // Bearer API key (internal)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token === API_KEY) return true;
  }

  // Session token from logged-in user
  if (sessionToken && validateSession(sessionToken)) {
    return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  if (!verificarAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { estado, timestamp, ...datos } = body;

    console.log(`📡 Webhook recibido: ${estado}`, datos);

    if (estado === 'completado') {
      // Sincronización completada
      await prisma.syncStatus.upsert({
        where: { id: 'google-apps-script' },
        update: {
          estado: 'completado',
          ultimaActualizacion: new Date(timestamp),
          archivosActualizados: datos.archivosActualizados || 0,
          archivosOmitidos: datos.archivosOmitidos || 0,
          totalArchivos: datos.totalArchivos || 0,
          duracionSegundos: datos.duracionSegundos || 0,
          errores: datos.errores || 0,
          exito: datos.exito || false,
          mensaje: datos.exito 
            ? `✅ Sincronización completada: ${datos.archivosActualizados} archivos actualizados`
            : `❌ Error: ${datos.error || 'Desconocido'}`
        },
        create: {
          id: 'google-apps-script',
          estado: 'completado',
          ultimaActualizacion: new Date(timestamp),
          archivosActualizados: datos.archivosActualizados || 0,
          archivosOmitidos: datos.archivosOmitidos || 0,
          totalArchivos: datos.totalArchivos || 0,
          duracionSegundos: datos.duracionSegundos || 0,
          errores: datos.errores || 0,
          exito: datos.exito || false,
          mensaje: datos.exito 
            ? `✅ Sincronización completada: ${datos.archivosActualizados} archivos actualizados`
            : `❌ Error: ${datos.error || 'Desconocido'}`
        }
      });

      console.log(`✅ Sincronización completada: ${datos.archivosActualizados} archivos en ${datos.duracionSegundos}s`);

    } else if (estado === 'en_progreso') {
      // Actualización de progreso
      await prisma.syncStatus.upsert({
        where: { id: 'google-apps-script' },
        update: {
          estado: 'en_progreso',
          ultimaActualizacion: new Date(timestamp),
          archivosActualizados: datos.actualizados || 0,
          totalArchivos: datos.totalArchivos || 0,
          porcentaje: datos.porcentaje || 0,
          mensaje: `🔄 Procesando: ${datos.archivosActuales}/${datos.totalArchivos} (${datos.porcentaje}%)`
        },
        create: {
          id: 'google-apps-script',
          estado: 'en_progreso',
          ultimaActualizacion: new Date(timestamp),
          archivosActualizados: datos.actualizados || 0,
          totalArchivos: datos.totalArchivos || 0,
          porcentaje: datos.porcentaje || 0,
          exito: false,
          mensaje: `🔄 Procesando: ${datos.archivosActuales}/${datos.totalArchivos} (${datos.porcentaje}%)`
        }
      });

      console.log(`📊 Progreso: ${datos.archivosActuales}/${datos.totalArchivos} (${datos.porcentaje}%)`);
    }

    return NextResponse.json({ success: true, mensaje: 'Webhook procesado' });

  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

// GET: Consultar estado actual de sincronización
export async function GET(request: NextRequest) {
  if (!verificarAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const estado = await prisma.syncStatus.findUnique({
      where: { id: 'google-apps-script' }
    });

    if (!estado) {
      return NextResponse.json({
        success: true,
        estado: 'sin_datos',
        mensaje: 'No hay sincronizaciones registradas'
      });
    }

    return NextResponse.json({
      success: true,
      estado: {
        estado: estado.estado,
        ultimaActualizacion: estado.ultimaActualizacion,
        archivosActualizados: estado.archivosActualizados,
        archivosOmitidos: estado.archivosOmitidos,
        totalArchivos: estado.totalArchivos,
        porcentaje: estado.porcentaje,
        duracionSegundos: estado.duracionSegundos,
        errores: estado.errores,
        exito: estado.exito,
        mensaje: estado.mensaje
      }
    });

  } catch (error) {
    console.error('❌ Error consultando estado:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}