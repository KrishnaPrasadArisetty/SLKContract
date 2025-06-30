// 1. import Request and Response objects from express
import { Request, Response } from "express";
// 2. import the BosAttributeDetails class
// 3. import the BosAttribute class
import { BosAttribute } from "../bosAttribute/bosAttribute.model";
// import { Template } from "../template/template.model";

// 4. The AppController class
export class BOSAttributeController {
  // 4.1 Define an instance of the class
  private dao: BosAttribute;
  // private template: Template;
  constructor() {
    this.dao = new BosAttribute();
    // this.template = new Template();
  }
  // 4.2 the init method accepts initDbAndContainer()
  //   method to create database and container
  async init() {
    await this.dao.initContainer();
  }

  async getSpecDetails(request: Request, response: Response) {
    const body = request.body;
    const ItemName = body.ItemName;
    const SpecName = body.SpecName;
    const ItemSpecDetails = await this.dao.getspecByItemId(ItemName, SpecName);
    response.send({ data: ItemSpecDetails });
  }
  async createORupdateDetails(request: Request, response: Response): Promise<void> {
    try {
      const body = request.body;
      if (body.length === 0) {
        response.status(400).json({ error: "Input Object format is not proper" });
      }
      const responseData = await this.dao.createORupdateDetails(body);
      response.status(200).json({ data: responseData });
    } catch (error) {
      console.error("Error fetching spec details:", error);
      response.status(500).json({ error: "Internal Server Error" });
    }
  }
 
  async getLatestItemSpecDetails(request: Request, response: Response): Promise<void> {
    try {
      const body = request.body;
      const { ItemName:ItemName,ItemRevision: ItemRevision,  Specifications: Specifications = []} = body;
      
      if (!ItemName || !ItemRevision|| Specifications.length === 0) {
        response.status(400).json({ error: "ItemName, ItemRevision and Specifications are required" });
      }
      const ItemSpecDetails = await this.dao.getLatestItemSpecDetails(ItemName, ItemRevision, Specifications);
      response.status(200).json({ data: ItemSpecDetails });
    } catch (error) {
      console.error("Error fetching spec details:", error);
      response.status(500).json({ error: "Internal Server Error"});
    }
  }

  async getLatestSpecItemDetails(request: Request, response: Response): Promise<void> {
    try {
      const body = request.body;
      const { SpecName:SpecName,SpecRevision: SpecRevision,  Items: Items = []} = body;
      
      if (!SpecName || !SpecRevision|| Items.length === 0) {
        response.status(400).json({ error: "SpecName, SpecRevision and Items are required" });
      }
      const ItemSpecDetails = await this.dao.getLatestSpecItemDetails(SpecName, SpecRevision, Items);
      response.status(200).json({ data: ItemSpecDetails });
    } catch (error) {
      console.error("Error fetching spec details:", error);
      response.status(500).json({ error: "Internal Server Error"});
    }
  }

  async processItem(request: Request, response: Response): Promise<void> {
    try {
      const body = request.body;
      if (body.length === 0) {
        response.status(400).json({ error: "Input Object format is not proper" });
      }
      const responseData = await this.dao.processItem(body);
      response.status(200).json({status:"success",msg: "Database Updated Successfully" });
    } catch (error) {
      console.error("Error fetching spec details:", error);
      response.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getBOSDetails(request: Request, response: Response): Promise<void> {
    try {
      const body = request.body;
      const { data: data = []} = body;
      
      if (data.length === 0) {
        response.status(400).json({ error: "Body is not valid" });
      }
      const ItemSpecDetails = await this.dao.getBOSDetails(data);
      console.log("ItemSpecDetails-->", ItemSpecDetails);
      response.status(200).json({ data: ItemSpecDetails });
    } catch (error) {
      console.error("Error fetching spec details:", error);
      response.status(500).json({ error: "Internal Server Error"});
    }
  }

}