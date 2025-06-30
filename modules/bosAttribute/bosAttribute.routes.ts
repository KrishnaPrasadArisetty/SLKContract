import { BOSAttributeController } from './bosAttribute.controller';
import { serverMode } from '../../appconfig/config';
const express = require('express');
const router = express.Router();

const bosAttributeController = new BOSAttributeController();
setTimeout(async () => {
    await bosAttributeController.init().then(() => {
        console.log('Container created for Bos Attribute' + ((serverMode)));
    }).catch((err) => {
        console.log('Container creation failed');
        process.exit(1);
    });
}, 5000)


router.post('/getSpecDetails',
 (req, res, next) => {
        bosAttributeController.getSpecDetails(req, res).catch(next);
});

router.post('/createORupdateDetails',
(req, res, next) => {
    bosAttributeController.createORupdateDetails(req, res).catch(next);
});
    
router.post('/getLatestItemSpecDetails',
(req, res, next) => {
    bosAttributeController.getLatestItemSpecDetails(req, res).catch(next);
});

router.post('/getLatestSpecItemDetails',
(req, res, next) => {
    bosAttributeController.getLatestSpecItemDetails(req, res).catch(next);
});

router.post('/processItem',
(req, res, next) => {
    bosAttributeController.processItem(req, res).catch(next);
});
router.post('/getBOSDetails',
(req, res, next) => {
    bosAttributeController.getBOSDetails(req, res).catch(next);
});



export { router };


