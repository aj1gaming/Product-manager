/*
  Warnings:

  - The primary key for the `ProductComment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `comment` on the `ProductComment` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `ProductComment` table. All the data in the column will be lost.
  - Added the required column `email` to the `ProductComment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `text` to the `ProductComment` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" TEXT
);
INSERT INTO "new_ProductComment" ("createdAt", "id", "productId") SELECT "createdAt", "id", "productId" FROM "ProductComment";
DROP TABLE "ProductComment";
ALTER TABLE "new_ProductComment" RENAME TO "ProductComment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
