import { Request, Response } from "express";
import plantAssignmentService from "./plantAssignmentService";

class plantAssignmentController {
  private plantAssignmentServiceInstance: plantAssignmentService;

  constructor() {
    this.plantAssignmentServiceInstance = new plantAssignmentService();
  }

  async getPlantAssignmentDetails(req: Request, res: Response) {
    await this.plantAssignmentServiceInstance.getPlantAssignmentDetails(req, res);
  }

  async getClassificationAttrDetails(req: Request, res: Response) {
    await this.plantAssignmentServiceInstance.getClassificationAtrribute(req, res);
  }

  async declassifyItem(req: Request, res: Response) {
    await this.plantAssignmentServiceInstance.declassifyItem(req, res);
  }

  async processENGCA(req: Request, res: Response) {
    await this.plantAssignmentServiceInstance.processENGCA(req, res);
  }

}

export default plantAssignmentController;
