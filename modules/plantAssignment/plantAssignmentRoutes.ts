const express = require("express");
const router = express.Router();
import plantAssignmentController from "./plantAssignmentController";

const controller = new plantAssignmentController();

router.post("/classifyProductToClass", (req, res, next) =>
  controller.getPlantAssignmentDetails(req, res).catch(next)
);

router.patch("/updateClassificationAttribute", (req, res, next) =>
 controller.getClassificationAttrDetails(req,res).catch(next)
)

router.post("/declassifyProductToClass", (req, res, next) =>
  controller.declassifyItem(req,res).catch(next)
)

router.post("/processENGCA", (req, res, next) =>
  controller.processENGCA(req,res).catch(next)
)

export { router };
