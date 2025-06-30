import { Request, Response } from "express";
import caService from "./caService";

class caController {
  private caServiceInstance: caService;

  constructor() {
    this.caServiceInstance = new caService();
  }

  async getCADetails(req: Request, res: Response) {
    console.log("came here");
    await this.caServiceInstance.getCADetails(req, res);
  }
  async getSaasCADetails(req: Request, res: Response) {
    await this.caServiceInstance.getSaasCADetails(req, res); // Call the getCADetails function from caService.ts
  }
  async mrAutomation(req: Request, res: Response) {
    await this.caServiceInstance.mrAutomation(req, res); // Call the getCADetails function from caService.ts
  }
}

export default caController;
