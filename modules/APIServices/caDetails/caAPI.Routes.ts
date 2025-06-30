const express = require('express');
const router = express.Router();
import caDataController from './caController';

const controller = new caDataController();

router.get('/getCADetails', (req, res, next) => controller.getCADetails(req, res).catch(next));

router.post('/mrAutomation', (req, res, next) => controller.mrAutomation(req, res).catch(next));

router.get('/getSaasCADetails', (req, res, next) => controller.getSaasCADetails(req, res).catch(next));

export { router };