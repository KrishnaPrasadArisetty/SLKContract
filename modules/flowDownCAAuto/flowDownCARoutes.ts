const express = require("express");
const router = express.Router();
import flowDownCAController from "./flowDownCAController";

const controller = new flowDownCAController();

//router.get('/flowdownCAAutomation', (req, res, next) => controller.getFlowDownCADetails(req, res).catch(next));
router.post("/flowdownCAAutomation", (req, res, next) =>
  controller.getFlowDownCADetails(req, res).catch(next)
);
router.post("/flowdownCAReverseAutomation", (req, res, next) =>
  controller.reverseAutomationProcess(req, res).catch(next)
);
router.post("/updatePartPlantMRData", (req, res, next) =>
  controller.updatePartPlantMRData(req, res).catch(next)
);

router.post("/createMFGCA", (req, res, next) =>
  controller.createMFGCA(req, res).catch(next)
);

router.post("/processMFGCA", (req, res, next) =>
  controller.processMFGCA(req, res).catch(next)
);

export { router };
