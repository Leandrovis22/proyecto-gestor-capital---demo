-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "saldoAPagar" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "ultimaModificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivoId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_consolidados" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "fechaPago" TIMESTAMP(3),
    "entrega" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "saldoAPagar" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "columnaK" TEXT,
    "hojaOrigen" TEXT,
    "filaOrigen" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registros_consolidados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "tipoPago" TEXT,
    "numeroPagoDia" INTEGER,
    "timestampArchivo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "fechaVenta" TIMESTAMP(3) NOT NULL,
    "totalVenta" DECIMAL(10,2) NOT NULL,
    "numeroVentaDia" INTEGER,
    "timestampArchivo" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gastos" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "categoria" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gastos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inversiones" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "categoria" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inversiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "archivos_control" (
    "id" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "archivoId" TEXT,
    "ultimaModificacion" TIMESTAMP(3) NOT NULL,
    "ultimaSincronizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalRegistros" INTEGER NOT NULL DEFAULT 0,
    "sincronizacionExitosa" BOOLEAN NOT NULL DEFAULT true,
    "errorMensaje" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "archivos_control_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_sincronizacion" (
    "id" TEXT NOT NULL,
    "tipoOperacion" TEXT NOT NULL,
    "archivosActualizados" INTEGER NOT NULL DEFAULT 0,
    "archivosOmitidos" INTEGER NOT NULL DEFAULT 0,
    "registrosProcesados" INTEGER NOT NULL DEFAULT 0,
    "exitoso" BOOLEAN NOT NULL DEFAULT true,
    "errorMensaje" TEXT,
    "duracionSegundos" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_sincronizacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_nombre_key" ON "clientes"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_archivoId_key" ON "clientes"("archivoId");

-- CreateIndex
CREATE INDEX "clientes_nombre_idx" ON "clientes"("nombre");

-- CreateIndex
CREATE INDEX "clientes_saldoAPagar_idx" ON "clientes"("saldoAPagar");

-- CreateIndex
CREATE INDEX "registros_consolidados_clienteId_idx" ON "registros_consolidados"("clienteId");

-- CreateIndex
CREATE INDEX "registros_consolidados_fechaPago_idx" ON "registros_consolidados"("fechaPago");

-- CreateIndex
CREATE INDEX "pagos_clienteId_fechaPago_idx" ON "pagos"("clienteId", "fechaPago");

-- CreateIndex
CREATE INDEX "pagos_fechaPago_idx" ON "pagos"("fechaPago" DESC);

-- CreateIndex
CREATE INDEX "ventas_clienteId_fechaVenta_idx" ON "ventas"("clienteId", "fechaVenta");

-- CreateIndex
CREATE INDEX "ventas_fechaVenta_idx" ON "ventas"("fechaVenta" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ventas_clienteId_fechaVenta_key" ON "ventas"("clienteId", "fechaVenta");

-- CreateIndex
CREATE INDEX "gastos_fecha_idx" ON "gastos"("fecha" DESC);

-- CreateIndex
CREATE INDEX "inversiones_fecha_idx" ON "inversiones"("fecha" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "archivos_control_nombreArchivo_key" ON "archivos_control"("nombreArchivo");

-- CreateIndex
CREATE INDEX "archivos_control_nombreArchivo_idx" ON "archivos_control"("nombreArchivo");

-- CreateIndex
CREATE INDEX "archivos_control_ultimaSincronizacion_idx" ON "archivos_control"("ultimaSincronizacion");

-- CreateIndex
CREATE INDEX "logs_sincronizacion_createdAt_idx" ON "logs_sincronizacion"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "registros_consolidados" ADD CONSTRAINT "registros_consolidados_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
