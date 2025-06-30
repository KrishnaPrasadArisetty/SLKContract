import { Request, Response } from "express";
import MassUploadDocumentService from './massUploadDocumentService';
import MassUploadService from './massUploadService';
class MassUploadController {
    massUploadServiceInstance: MassUploadService;
    private massUploadDocumentServiceInstance: MassUploadDocumentService;
    constructor(massUploadService: MassUploadService) {
        this.massUploadServiceInstance = massUploadService;
        this.massUploadDocumentServiceInstance = new MassUploadDocumentService();
    }
    async uploadItems(req, res) {
        await this.massUploadServiceInstance.uploadItems(req, res);
    }
    async uploadItemStructure(req, res) {
        await this.massUploadServiceInstance.uploadItemStructure(req, res);
    }
    // Document controller methods
    async createUpdateDocuments(req: Request, res: Response) {
        await this.massUploadDocumentServiceInstance.createUpdateDocuments(req, res); // Call the getDroppedObjectDetails
    }
    async connectItemDocuments(req: Request, res: Response) {
       await this.massUploadDocumentServiceInstance.connectItemDocuments(req, res); // Call the getDroppedObjectDetails
    }
}
export default MassUploadController;