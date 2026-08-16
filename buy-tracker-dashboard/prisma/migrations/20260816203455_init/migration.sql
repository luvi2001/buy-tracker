-- CreateEnum
CREATE TYPE "OverallStatus" AS ENUM ('COMPLETE', 'IN_PROGRESS', 'BLOCKED', 'NOT_STARTED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "StepStatus" AS ENUM ('DONE', 'IN_PROGRESS', 'PENDING', 'BLOCKED');

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "buyOrderName" TEXT NOT NULL,
    "responsible" TEXT,
    "buyQty" INTEGER NOT NULL DEFAULT 0,
    "totalSO" INTEGER NOT NULL DEFAULT 0,
    "totalFG" INTEGER NOT NULL DEFAULT 0,
    "refActiveFG" TEXT,
    "deadline" TIMESTAMP(3),
    "overallStatus" "OverallStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Step" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "stepName" TEXT NOT NULL,
    "dateDone" TIMESTAMP(3),
    "status" "StepStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "Step_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Order_overallStatus_idx" ON "Order"("overallStatus");

-- CreateIndex
CREATE INDEX "Step_orderId_idx" ON "Step"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Step_orderId_stepNumber_key" ON "Step"("orderId", "stepNumber");

-- AddForeignKey
ALTER TABLE "Step" ADD CONSTRAINT "Step_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
