import { Request, Response } from "express";
import AuthService from "../APIServices/authentication/authService";
import API_CONFIG from "../APIServices/config/APIConfig";
import axios, { AxiosHeaders } from "axios";
import { json } from "body-parser";
import { urlConfig } from "../APIServices/config/urlConfig";
import authConfig, {securityContextConfig} from "../APIServices/config/authConfig";
import { send } from "process";
import { Attributes } from "../mco/attributes.model";
import { Agent } from "http";
import { Console, error } from "console";
import { promises } from "dns";
const https = require("https");

const agent = new https.Agent({
  rejectUnauthorized: false,
});

interface FutureRequestHeaders {
  Cookie: string | undefined;
  SecurityContext: string;
  ENO_CSRF_TOKEN: string;
  "Content-Type": string;
}

class getPlantAssignmentService {
  
  async getAuthenticationToken(
    userInfo: any = {}
  ): Promise<FutureRequestHeaders> {
    const authService = new AuthService();
    const csrfToken = await authService.authenticateUser(userInfo);
    return csrfToken;
  }

  public async getPlantAssignmentDetails(req: Request, res: Response): Promise<void> {
    try {
      const { classifyProdToClassURL, baseURL } = urlConfig;
      const csrfTokenAndHeaders = await this.getAuthenticationToken();
      const headers: AxiosHeaders = {
        Cookie: csrfTokenAndHeaders.Cookie,
        SecurityContext: csrfTokenAndHeaders.SecurityContext,
        ENO_CSRF_TOKEN: csrfTokenAndHeaders.ENO_CSRF_TOKEN,
        "Content-Type": csrfTokenAndHeaders["Content-Type"],
      };

      const requestBody: any = req.body;  // Type the body
      const { id: productId, classes: classIds = [], type, childs: childIds = [], mode } = requestBody;

      if (!productId || !Array.isArray(classIds) || classIds.length === 0) {
        res.status(400).json({ message: "Missing or invalid product ID or classes." });
        return;
      }

      const getRelativePath = (itemType: string, id: string): string => {
        if (
          ["CreateKit", "CreateAssembly", "CreateMaterial", "Provide", "ProcessContinuousProvide"].includes(itemType)
        ) {
          return `/resources/v1/modeler/dsmfg/dsmfg:MfgItem/${id}`;
        } else if (itemType === "Raw_Material") {
          return `/resources/v1/modeler/dsrm/dsrm:RawMaterial/${id}`;
        } else {
          return `/resources/v1/modeler/dseng/dseng:EngItem/${id}`;
        }
      };
      let ObjectsToClassify: any[] = [];
      if (mode ==="classifyParent"){  
        ObjectsToClassify.push({
          source: baseURL,
          type: type,
          identifier: productId,
          relativePath: getRelativePath(type, productId),
        });
      } else {
        childIds.forEach((prod) => {
          ObjectsToClassify.push({
            source: baseURL,
            identifier: prod.id,
            type: prod.type,
            relativePath: getRelativePath(prod.type, prod.id),
          });
        });
      }
      
      for (const classId of classIds) {
        const body = {
          ClassID: classId,
          ObjectsToClassify: ObjectsToClassify,
        };    
        const response = await axios.post(`${classifyProdToClassURL}`, body, {
          headers,
          httpsAgent: agent,
        });
      }
      res.status(200).json({ message: "Classes successfully classified" });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        res.status(500).json({ error: error.response.data });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  public async getClassificationAtrribute(req: Request, res: Response): Promise<void> {
    try {
      const { classificationAttrUpdateURL } = urlConfig;
      const csrfTokenAndHeaders = await this.getAuthenticationToken();

      const objectId: any = req.query.id;
      const payload: any = req.body;
      const headers: AxiosHeaders = {
        Cookie: csrfTokenAndHeaders.Cookie,
        SecurityContext: csrfTokenAndHeaders.SecurityContext,
        ENO_CSRF_TOKEN: csrfTokenAndHeaders.ENO_CSRF_TOKEN,
        "Content-Type": csrfTokenAndHeaders["Content-Type"],
      };

      const iterationHeaders = new AxiosHeaders({
        ...headers, // Copy the original headers
        SecurityContext: securityContextConfig.SecurityContext // Modify SecurityContext
      });

      if(objectId){
        const classificationAttrRawResponse: any = await axios.post(`${classificationAttrUpdateURL}`, payload, {
          headers: iterationHeaders,
          httpsAgent: agent,
        });
        res.status(200).json(classificationAttrRawResponse.data);
      } else {
        res.status(500).json({status: 500, message: 'Object Id not found'});
      }

    } catch (error) {
      res.status(500).json(error.response.data);
    }
  }

  public async declassifyItem(req: Request, res: Response): Promise<void> {
    try {
      const { declassifyProdToClassURL,baseURL } = urlConfig;
      const csrfTokenAndHeaders = await this.getAuthenticationToken();
      const headers: AxiosHeaders = {
        Cookie: csrfTokenAndHeaders.Cookie,
        SecurityContext: csrfTokenAndHeaders.SecurityContext,
        ENO_CSRF_TOKEN: csrfTokenAndHeaders.ENO_CSRF_TOKEN,
        "Content-Type": csrfTokenAndHeaders["Content-Type"],
      };

      const requestBody: any = req.body;  // Type the body
      const { id: productId, classes: classIds, type } = requestBody;

      if (!productId || !Array.isArray(classIds) || classIds.length === 0) {
        res.status(400).json({ message: "Missing or invalid product ID or classes." });
        return;
      }
      const getRelativePath = (itemType: string, id: string): string => {
        if (
          ["CreateKit", "CreateAssembly", "CreateMaterial", "Provide", "ProcessContinuousProvide"].includes(itemType)
        ) {
          return `/resources/v1/modeler/dsmfg/dsmfg:MfgItem/${id}`;
        } else if (itemType === "Raw_Material") {
          return `/resources/v1/modeler/dsrm/dsrm:RawMaterial/${id}`;
        } else {
          return `/resources/v1/modeler/dseng/dseng:EngItem/${id}`;
        }
      };
      const staticBody = {
        ObjectsToDeclassify: [
          {
            source: baseURL,
            type: type,
            identifier: productId,
            relativePath: getRelativePath(type, productId),
          },
        ],
      };
      const classificationPromises = classIds.map((classId) => {
        const body = {
          ClassID: classId,
          ...staticBody, 
        };
        
        return axios.post(`${declassifyProdToClassURL}`, body, {
          headers,
          httpsAgent: agent,
        });
      });

      const classificationResponses = await Promise.all(classificationPromises);
      res.status(200).json({ message: "Classes successfully De classified" });
      
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        res.status(500).json({ error: error.response.data });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }


  public async processENGCA(req: Request, res: Response): Promise<void> {
    try {
      const { classifyProdToClassURL, declassifyProdToClassURL, baseURL,searchLibraryURL ,libraryDetailsURL  } = urlConfig;
      const searchLibParams = API_CONFIG?.searchLibParams;
      const csrfTokenAndHeaders = await this.getAuthenticationToken();
      const headers: AxiosHeaders = {
        Cookie: csrfTokenAndHeaders.Cookie,
        SecurityContext: csrfTokenAndHeaders.SecurityContext,
        ENO_CSRF_TOKEN: csrfTokenAndHeaders.ENO_CSRF_TOKEN,
        "Content-Type": csrfTokenAndHeaders["Content-Type"],
      };
  
      const { Items = [] } = req.body;
      for (const item of Items) {
        const { ItemId, ItemType, ItemState, ItemMBOM, ItemPlants, AllPlantsRemoved} = item;
        const newPlants: string[] = [];
        const removePlants: string[] = [];
  
        ItemPlants?.forEach(plant =>
          (plant.PlantType === "New" && newPlants.push(plant.PlantID)) ||
          (plant.PlantType === "Remove" && removePlants.push(plant.PlantID))
        );
        
        let productChilds: any[] = [];
        
        console.log("ItemType-",ItemType);
        console.log("newPlants-",newPlants);
        if (ItemType === "VPMReference" && ItemMBOM && newPlants.length > 0) {
          productChilds = await this.getItemChilds(ItemId, headers);
          console.log("productChilds-",productChilds);
        }

        if (AllPlantsRemoved) {
          searchLibParams.$searchStr = "NoClassification";
          const response = await axios.get(searchLibraryURL, {
            params: searchLibParams,
            headers
          });

          if (response.data.member.length > 0) {
            const noClassItem = response.data.member.find(item => item.title === "NoClassification");
            if (noClassItem?.id) {
              const librResponse = await axios.get(`${libraryDetailsURL}/${noClassItem.id}/?$mask=dslib:ExpandClassesDetailsMask`, {
                headers
              });
              const noClassChild = librResponse.data?.member[0]?.ChildClasses?.member?.find(child => child.title === "No Class");
              const Classid = noClassChild?.id;
              if (Classid) {
                console.log("Classid:", Classid);
                newPlants.push(Classid);
              } else {
                console.log("No child class with Title === 'No Class' found.");
              }
            }
          }
        }
  
        if (newPlants.length > 0) {
          const objectsToClassify: any[] = [
            {
              source: baseURL,
              type: ItemType === "Raw_Material" ? "Raw_Material" : "VPMReference",
              identifier: ItemId,
              relativePath: `/resources/v1/modeler/${
                ItemType === "Raw_Material" ? "dsrm/dsrm:RawMaterial" : "dseng/dseng:EngItem"
              }/${ItemId}`,
            },
            ...productChilds.map(prod => ({
              source: baseURL,
              identifier: prod.Id,
              type: prod.Type,
              relativePath: `/resources/v1/modeler/${
                prod.Type === "VPMReference" ? "dseng/dseng:EngItem" : "dsrm/dsrm:RawMaterial"
              }/${prod.Id}`,
            })),
          ];
  
        
          for (const classId of newPlants) {
            await axios.post(
              classifyProdToClassURL,
              { ClassID: classId, ObjectsToClassify: objectsToClassify },
              { headers, httpsAgent: agent }
            );
          }
        }
  
        if (removePlants.length > 0) {
          const objectsToDeclassify = [
            {
              source: baseURL,
              type: ItemType === "Raw_Material" ? "Raw_Material" : "VPMReference",
              identifier: ItemId,
              relativePath: `/resources/v1/modeler/${
                ItemType === "Raw_Material" ? "dsrm/dsrm:RawMaterial" : "dseng/dseng:EngItem"
              }/${ItemId}`,
            },
          ];
  
          const classificationPromises = removePlants.map(classId =>
            axios.post(
              declassifyProdToClassURL,
              { ClassID: classId, ObjectsToDeclassify: objectsToDeclassify },
              { headers, httpsAgent: agent }
            )
          );
  
          await Promise.all(classificationPromises);
        }
      }
  
      res.status(200).json({ message: "Processing Engineering CA completed."});
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        res.status(500).json({ error: error.response.data });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }
  

  private async getItemChilds(engItmId: string, headers: AxiosHeaders): Promise<any> {
    try {
      const { expandProductURL } = urlConfig;
      const { expandChildItemReqBody } = API_CONFIG;

      const response = await axios.post(
        `${expandProductURL}/${engItmId}/expand`,
        expandChildItemReqBody,
        {
          headers,
          httpsAgent: agent,
        }
      );

      return (response?.data?.member || [])
        .filter(
          (child) =>
            (child.type === "VPMReference" || child.type === "Raw_Material") &&
            child.id !== engItmId
        )
        .map((child) => ({
          Type: child.type,
          Id: child.id,
        }));

    } catch (error) {
      console.error(`Error while getting Item Childs:`, error);
      return []; 
    }
  }
}

export default getPlantAssignmentService;
