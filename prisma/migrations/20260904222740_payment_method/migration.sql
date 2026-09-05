-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'CHEQUE');

-- AlterTable
ALTER TABLE "payment_plans" ADD COLUMN     "method" "PaymentMethod" NOT NULL DEFAULT 'CASH';
