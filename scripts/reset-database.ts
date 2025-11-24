// Script para limpiar toda la base de datos
// USAR CON CUIDADO - Borra todos los datos

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('🗑️  Iniciando limpieza de base de datos...');
  
  try {
    // Borrar en orden para respetar foreign keys
    console.log('Eliminando pagos...');
    await prisma.pago.deleteMany();
    
    console.log('Eliminando ventas...');
    await prisma.venta.deleteMany();
    
    console.log('Eliminando registros consolidados...');
    await prisma.registroConsolidado.deleteMany();
    
    console.log('Eliminando clientes...');
    await prisma.cliente.deleteMany();
    
    console.log('Eliminando control de archivos...');
    await prisma.archivoControl.deleteMany();
    
    console.log('Eliminando logs de sincronización...');
    await prisma.logSincronizacion.deleteMany();
    
    console.log('Eliminando gastos...');
    await prisma.gasto.deleteMany();
    
    console.log('Eliminando inversiones...');
    await prisma.inversion.deleteMany();
    
    console.log('✅ Base de datos limpiada completamente');
    
  } catch (error) {
    console.error('❌ Error al limpiar la base de datos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Confirmar antes de ejecutar
console.log('⚠️  ADVERTENCIA: Este script borrará TODOS los datos de la base de datos');
console.log('⚠️  Presiona Ctrl+C para cancelar o espera 3 segundos para continuar...');

setTimeout(() => {
  resetDatabase()
    .then(() => {
      console.log('🎉 Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}, 3000);
