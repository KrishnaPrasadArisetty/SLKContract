import { Request, Response } from "express";
import flowDownCAService from "./flowDownCAService";

class flowDownCAController {
  private flowDownCAServiceInstance: flowDownCAService;

  constructor() {
    this.flowDownCAServiceInstance = new flowDownCAService();
  }

  async getFlowDownCADetails(req: Request, res: Response) {
    console.log("came here");
    await this.flowDownCAServiceInstance.getFlowDownCADetails(req, res);
  }

  async reverseAutomationProcess(req: Request, res: Response) {
    await this.flowDownCAServiceInstance.reverseAutomationProcess(req, res);
  }

  async updatePartPlantMRData(req: Request, res: Response) {
    console.log("updatePartPlantMRData");
    await this.flowDownCAServiceInstance.updatePartPlantMRData(req, res);
  }

  async createMFGCA(req: Request, res: Response) {
    console.log("createMFGCA");
    await this.flowDownCAServiceInstance.createMFGCA(req, res);
  }
  async processMFGCA(req: Request, res: Response) {
    console.log("processMFGCA");
    await this.flowDownCAServiceInstance.processMFGCA(req, res);
  }
}

export default flowDownCAController;
