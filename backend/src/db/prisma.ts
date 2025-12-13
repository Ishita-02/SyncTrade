import { PrismaClient } from '@prisma/client'

// Pass the URL explicitly to the constructor
export const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
})
export default prisma;
