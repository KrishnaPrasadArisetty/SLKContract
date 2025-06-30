const express = require('express');
const router = express.Router();
import revFloatDataController from './revFloatController';

const controller = new revFloatDataController();

router.get('/getDroppedObjectDetails', (req, res, next) => controller.getDroppedObjectDetails(req, res).catch(next));

router.post('/getParents', (req, res, next) => controller.getParents(req, res).catch(next));

router.post('/floatRevisions', (req, res, next) => controller.floatRevisions(req, res).catch(next));
// router.post('/mrAutomation', (req, res, next) => controller.mrAutomation(req, res).catch(next));




export { router };