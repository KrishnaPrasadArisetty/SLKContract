import { ZodError } from "zod";

export const errorHandler = (err, _req, res, context) => {
  if (typeof context === "string") {
    console.error(`[${context}] Error:`, err);
  }

  const errorMessage = err?.response?.data;

  if (errorMessage) {
    res.status(errorMessage.status).json({
      status: errorMessage.status,
      message: errorMessage.message,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      status: 400,
      message: "Validation error",
      errors: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  console.error(`Error:`, err);

  return res.status(500).json({
    status: 500,
    message: "Internal server error",
    // error: err instanceof Error ? err.message : err,
  });
};
