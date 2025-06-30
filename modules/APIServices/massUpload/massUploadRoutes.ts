import MassUploadController from "./massUploadController";
import MassUploadService from "./massUploadService";
const express = require('express');
const router = express.Router();
const massUploadServiceInstance = new MassUploadService();
const massUploadControllerInstance = new MassUploadController(massUploadServiceInstance);
router.post('/uploadItems', (req, res, next) => massUploadControllerInstance.uploadItems(req, res).catch(next));
router.post('/uploadItemStructure',(req,res,next)=>massUploadControllerInstance.uploadItemStructure(req,res).catch(next));

// Mass upload document routes
router.post('/documents', (req, res, next) => massUploadControllerInstance.createUpdateDocuments(req, res).catch(next));
router.post('/connectItemDocuments', (req, res, next) => massUploadControllerInstance.connectItemDocuments(req, res).catch(next));
export { router };

