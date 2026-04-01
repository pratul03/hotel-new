import "dotenv/config";
import { prisma } from "../config/database";
import { runSeed } from "./seed";

runSeed()
  .catch((error) => {
    console.error("Course seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
