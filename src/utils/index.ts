import fs from "fs";
import rateLimit from "express-rate-limit";

// import { destOrgsController } from "@/modules/destOrgs/destOrgs.controller";
// import { jdiBomController } from "@/modules/jdiBom/jdiBom.controller";
// import { usersController } from "@/modules/users/users.controller";

// export const initControllers = async () => {
//   try {
//     const controllers = [
//       usersController.init(),
//       jdiBomController.init(),
//       destOrgsController.init(),
//     ];

//     const results = await Promise.allSettled(controllers);

//     results.forEach((result, index) => {
//       if (result.status !== "fulfilled") {
//         console.error(`Controller ${index + 1} failed:`, result.reason);
//       }
//     });
//   } catch (error) {
//     console.error("Error initializing controllers:", error);
//     process.exit(1);
//   }
// };

const customRateLimitHandler = (_req, res, _next, options) => {
  res.status(options.statusCode).json({
    status: options.statusCode,
    message:
      "You have exceeded the maximum number of requests. Please try again later.",
    limit: options.max,
    retryAfter: Math.ceil(options.windowMs / 1000) + " seconds",
  });
};

// Rate limiter with custom response
export const rateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 40, // limit each IP to 30 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: customRateLimitHandler, // Custom handler
});

// Initialize log files if not present
export const initLogfiles = (path: string) => {
  fs.stat(path, (err) => {
    if (err?.code === "ENOENT") {
      fs.writeFile(path, "", () => {});
    }
  });
};
