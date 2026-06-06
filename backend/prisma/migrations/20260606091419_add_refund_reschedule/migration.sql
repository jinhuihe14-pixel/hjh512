-- CreateTable
CREATE TABLE "RefundRule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "minHours" REAL NOT NULL,
    "maxHours" REAL,
    "refundRate" REAL NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RefundRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "refundNo" TEXT NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "employeeId" INTEGER,
    "refundAmount" REAL NOT NULL,
    "serviceFee" REAL NOT NULL,
    "originalAmount" REAL NOT NULL,
    "refundType" TEXT NOT NULL,
    "reason" TEXT,
    "operatorType" TEXT NOT NULL,
    "operatorId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RefundRecord_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RefundRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RefundRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RescheduleRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rescheduleNo" TEXT NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "employeeId" INTEGER,
    "oldSessionId" INTEGER NOT NULL,
    "newSessionId" INTEGER NOT NULL,
    "oldPrice" REAL NOT NULL,
    "newPrice" REAL NOT NULL,
    "priceDifference" REAL NOT NULL,
    "playerCount" INTEGER NOT NULL,
    "operatorType" TEXT NOT NULL,
    "operatorId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RescheduleRecord_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RescheduleRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RescheduleRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RescheduleRecord_oldSessionId_fkey" FOREIGN KEY ("oldSessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RescheduleRecord_newSessionId_fkey" FOREIGN KEY ("newSessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RefundRecord_refundNo_key" ON "RefundRecord"("refundNo");

-- CreateIndex
CREATE UNIQUE INDEX "RescheduleRecord_rescheduleNo_key" ON "RescheduleRecord"("rescheduleNo");
