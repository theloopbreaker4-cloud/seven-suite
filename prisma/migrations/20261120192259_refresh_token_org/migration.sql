/*
  Warnings:

  - Added the required column `org_id` to the `refresh_token` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "platform"."refresh_token" ADD COLUMN     "org_id" UUID NOT NULL;
