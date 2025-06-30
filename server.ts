import "./src/utils/setup.alias";

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { configDotenv } from "dotenv";
import helmet from "helmet";
import nocache from "nocache";

import { initLogfiles } from "./src/utils";
import { errorHandler } from "./src/middlewares/error.middleware";
import {
  combinedLogFilePath,
  errorLogFilePath,
  logger,
} from "./src/utils/logger";

// -------- ROUTERS --------
import { router as caAPIRouter } from "./modules/APIServices/caDetails/caAPI.Routes";
import { router as massUpload } from "./modules/APIServices/massUpload/massUploadRoutes";
import { router as revFloatAPIRouter } from "./modules/APIServices/revFloat/revFloatAPI.Routes";
import { router as bosAttribute } from "./modules/bosAttribute/bosAttribute.routes";
import { router as flowDownCA } from "./modules/flowDownCAAuto/flowDownCARoutes";
import { router as EmailControllerRouter } from "./modules/mailer/mailer.routes";
import { router as plantAssignment } from "./modules/plantAssignment/plantAssignmentRoutes";

// Load environment variables
configDotenv();

initLogfiles(errorLogFilePath);
initLogfiles(combinedLogFilePath);

// 3. an instance of the express and adding bodyParser and cors middlewares
const instance = express();

// Increase body-parser limits to 5mb
instance.use(bodyParser.json({ limit: "5mb" }));
instance.use(bodyParser.urlencoded({ limit: "5mb", extended: true }));

//Fo CORSs
instance.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

try {
  instance.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'"],
          imgSrc: ["'self'"],
          styleSrc: ["'self'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
      },
      referrerPolicy: { policy: "no-referrer" },
    })
  );
  instance.use(nocache());
  instance.disable("x-powered-by");

  instance.use(express.static("downloads"));

  // middleware - authentication checks for all end points
  // Apply middleware globallyy
  instance.use(async (req, res, next) => {
    console.log("process.env.EMRPDH_URL", process.env.EMRPDH_URL);
    console.log("process.env.EMRPDH_NODE_URL", process.env.EMRPDH_NODE_URL);
    next("route");
  });

  instance.use("/ca", caAPIRouter);
  instance.use("/flowDownCA", flowDownCA);
  instance.use("/plantAssignment", plantAssignment);
  instance.use("/mail", EmailControllerRouter);
  instance.use("/revFloat", revFloatAPIRouter);
  instance.use("/bosAttribute", bosAttribute);
  instance.use("/massUpload", massUpload);
} catch (error) {
  console.log("Something went wrong:", error);
}

instance.use("/health", (_req, res) => {
  res.status(200).json({ status: 200, message: "Server is healthy" });
});

// Fallback: Invalid route
instance.use((_req, res) => {
  res
    .status(403)
    .json({ status: 403, error: "Access denied: path not allowed." });
});

// Global error handler
instance.use(errorHandler);

const portNumber = process.env.PORT || 8080;

instance.listen(portNumber, async () => {
  logger.info(`Application started on port ${portNumber}`);
});
