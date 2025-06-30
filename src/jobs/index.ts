import cron from "node-cron";
import { logger } from "../utils/logger";
import { jdiBomController } from "@/modules/jdiBom/jdiBom.controller";

// ✅ Schedule it to run daily at 11:59 PM
cron.schedule("59 23 * * *", async () => {
  logger.info(`End-of-day update job started.`);

  await jdiBomController.updateBomStatuses();
});
