import express from "express";
import { emailController } from "./mailer.controller";

const router = express.Router();

router.get("/sentEmail", (req, res, next) => {
  emailController
    .sendEmail(
      // ["a.selvamani@slkgroup.com", "tuttupu.varaprasad@slkgroup.com"],
      {
        to: "tuttupu.varaprasad@slkgroup.com",
        subject: "Test Subject",
        html: "Test plain text",
      }
    )
    .catch(next);
  res.send({ data: "successfully sent" });
});

export { router };
