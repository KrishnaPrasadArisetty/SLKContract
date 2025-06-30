import { Request, Response } from "express";
import revFloatService from "./revFloatService";

class revFloatController {
  private revFloatServiceInstance: revFloatService;

  constructor() {
    this.revFloatServiceInstance = new revFloatService();
  }

  async getDroppedObjectDetails(req: Request, res: Response) {
     await this.revFloatServiceInstance.getDroppedObjectDetails(req, res); // Call the getDroppedObjectDetails
  }
  
  async getParents(req: Request, res: Response) {
     await this.revFloatServiceInstance.getParents(req, res); // Call the getParents
  }

  async floatRevisions(req: Request, res: Response) {
     await this.revFloatServiceInstance.floatRevisions(req, res); // Call the revFloatServiceInstance
  }
}

export default revFloatController;
