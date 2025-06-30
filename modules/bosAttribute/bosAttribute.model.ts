// 1. importing the required APIs for performing operations with Cosmos
import { Container } from "@azure/cosmos";
// 2. importing the application configuration constant for URL and Primary key
import { CONTAINER } from "../../appconfig/config";
// 3. importing plant details class
import { database } from "../../db/dbConnection";
// 4. The Data Access class to create various operations
const https = require("https");
import AuthService from "../APIServices/authentication/authService";
import { urlConfig } from "../APIServices/config/urlConfig";
import authConfig, {securityContextConfig} from "../APIServices/config/authConfig";
import axios, { AxiosHeaders } from "axios";
import API_CONFIG from "../APIServices/config/APIConfig";
import { partitionKeys } from "@/src/utils/config";


const agent = new https.Agent({
  rejectUnauthorized: false,
});

interface FutureRequestHeaders {
  Cookie: string | undefined;
  SecurityContext: string;
  ENO_CSRF_TOKEN: string;
  "Content-Type": string;
}

let container;

export class BosAttribute {
  // 4.1. defining class level members
  private collectionId: string;
  private container: Container;
  // 4.2. constructor contains code to connect to CosmosDB Account
  constructor() {
    this.collectionId = CONTAINER.BOS_ATTRIBUTES;
  }


  // 4.5. initialize the CosmosDB connections to create database and container
  async initContainer() {
    // create a container if not exist
    if ((await database).id) {
      setTimeout(async () => {
        const responseContainer = await (
          await database
        ).containers.createIfNotExists(
          {
            id: this.collectionId,
          },
          { offerThroughput: 400 }
        );

        this.container = responseContainer.container;
        container = responseContainer.container;
      }, 200);
      return this.container;
    }
  }
  
  async getAuthenticationToken(
    userInfo: any = {}
  ): Promise<FutureRequestHeaders> {
    const authService = new AuthService();
    const csrfToken = await authService.authenticateUser(userInfo);
    return csrfToken;
  }

  async createORupdateDetails(Body: any) {
    const clonedArray = JSON.parse(JSON.stringify(Body));
    try {
      const ackResults: { id: string, status: string }[] = [];
      if (!container) {
        throw new Error("The specified collection is not present");
      }
      for (let i = 0; i < Body.length; i++) {
        const item = Body[i];
        delete item.ItemID;
        delete item.SpecID;
        delete item.ItemState;
        delete item.SpecState;
        const itemName = item.ItemName;
        const itemRevision = item.ItemRevision;
        const itemSpec = item.SpecName;
        const specRevision = item.SpecRevision;
        if (itemName && itemRevision && itemSpec && specRevision) { 
          const { resources: existingItems } = await this.container.items.query({
            query: `
              SELECT * FROM c 
              WHERE c.ItemName = @ItemName 
                AND c.SpecName = @SpecName`,
            parameters: [
              { name: "@ItemName", value: itemName},
              { name: "@SpecName", value: itemSpec },
            ]
          }).fetchAll();
    
          const matchingItem = existingItems.find((existingItem) =>
            existingItem.ItemRevision === itemRevision && existingItem.SpecRevision === specRevision
          );
    
          if (matchingItem) {
            matchingItem.ItemName = item.ItemName;
            matchingItem.ItemRevision = item.ItemRevision;
            matchingItem.SpecName = item.SpecName;
            matchingItem.SpecRevision = item.SpecRevision;
            matchingItem.PrintOnPurchaseOrderRequired = item.PrintOnPurchaseOrderRequired || "No";
            matchingItem.PrintOnWorkOrderRequired = item.PrintOnWorkOrderRequired || "No";
            matchingItem.WorkOrderDocumentRequired = item.WorkOrderDocumentRequired || "No";
            matchingItem.PrintOnReportOrderRequired = item.PrintOnReportOrderRequired || "No";
            matchingItem["SAP/JDE"] = item["SAP/JDE"] || "No";
            matchingItem.seq = matchingItem.seq;
            matchingItem.id = matchingItem.id;
            
            
            await this.container.item(matchingItem.id,itemName).replace(matchingItem); 
            ackResults.push({ id: matchingItem.ItemName, status: 'Updated' });

          } else {
            item.seq = existingItems.length + 1;
            const createResponse = await this.container.items.create(item); 
            ackResults.push({ id: createResponse.resource.ItemName, status: 'Created' });
          }
        } else {
          ackResults.push({ id: "", status: 'Input Object format is not proper' });
        }
      }  
      await this.processReleasedItems(clonedArray);
      return {
        details: ackResults, 
      };
    } catch (error) {
      console.error('Error processing items:', error);
      throw new Error('An error occurred while processing items');
    }
  }

 
  async getspecByItemId(Item: any, Specification: any) {
    try {    
      const result = await this.container.items.query({
        query: `
          SELECT * FROM c 
          WHERE c.ItemName = @ItemName 
            AND c.SpecName = @SpecName`,
        parameters: [
          { name: "@ItemName", value: Item },
          { name: "@SpecName", value: Specification },
        ]
      }).fetchAll();
      return result.resources;
    } catch (error) {
      console.log(error);
    }
  }

  async getBOSDetails(Objects : any){
    const resObject : any  =[];
    try {  
      for (const obj of Objects) {
        console.log("Spec:", obj);
        const { ItemName:ItemName,ItemRevision: ItemRevision,  Specifications: Specifications = []} = obj;
        if (!ItemName || !ItemRevision|| Specifications.length === 0) {
          resObject.push({
            "ItemName": ItemName ,
            "ItemRevision": ItemRevision,
            "Specifications": Specifications
          });
          continue;
        }
        const ItemSpecDetails = await this.getLatestItemSpecDetails(ItemName, ItemRevision, Specifications);
        console.log("ItemSpecDetails:", ItemSpecDetails);
        resObject.push(ItemSpecDetails);
      }
      return resObject;
    } catch (error) {
      console.log(error);
    }
  }

  async getLatestItemSpecDetails(itemName: any, itemRevision: any, Specifications: any) {
    const data: any[] = [];  
    const resObject = {
      "ItemName": itemName,
      "ItemRevision": itemRevision,
      "Specifications": data 
    };
    
    try { 
      if (!container) {
        throw new Error("The specified collection is not present");
      }  

      const result = await this.container.items.query({
        query: `SELECT * FROM c WHERE c.ItemName = @ItemName`,
        parameters: [{ name: "@ItemName", value: itemName }],
      }).fetchAll();
  
      const filteredRecordsMap = result.resources.reduce((map, record) => {
        if (!map[record.SpecName]) {
          map[record.SpecName] = [];
        }
        map[record.SpecName].push(record);
        return map;
      }, {} as Record<string, any[]>);
  
      const getLatestRecord = (specName: string) => {
        const records = filteredRecordsMap[specName];
        if (records) {
          const latestRecord = records.reduce((prev, current) => {
            return (Number(prev.seq) > Number(current.seq)) ? prev : current;
          });
          return {
            "PrintOnPurchaseOrderRequired": latestRecord.PrintOnPurchaseOrderRequired || "No",
            "PrintOnWorkOrderRequired": latestRecord.PrintOnWorkOrderRequired || "No",
            "WorkOrderDocumentRequired": latestRecord.WorkOrderDocumentRequired || "No",
            "PrintOnReportOrderRequired": latestRecord.PrintOnReportOrderRequired || "No",
            "SAP/JDE": latestRecord["SAP/JDE"] || "No"
          };
        }
        return null;
      };
  
      const defaultRecord = () => ({
        "PrintOnPurchaseOrderRequired": "No",
        "PrintOnWorkOrderRequired": "No",
        "WorkOrderDocumentRequired": "No",
        "PrintOnReportOrderRequired": "No",
        "SAP/JDE": "No"
      });
  
      // Prepare all necessary data upfront (before entering the loop)
      for (const spec of Specifications) {
        const specName = spec.SpecName;
        const specRevision = spec.SpecRevision;
        const specDetails = { "SpecName": specName, "SpecRevision": specRevision };
  
        // Attempt to find an existing record
          const existingRecord = result.resources.reduce((acc, record) => {
          if (
            record.SpecName === specName &&
            record.SpecRevision === specRevision &&
            record.ItemName === itemName &&
            record.ItemRevision === itemRevision
          ) {
            acc = {
              "PrintOnPurchaseOrderRequired": record.PrintOnPurchaseOrderRequired || "No",
              "PrintOnWorkOrderRequired": record.PrintOnWorkOrderRequired || "No",
              "WorkOrderDocumentRequired": record.WorkOrderDocumentRequired || "No",
              "PrintOnReportOrderRequired": record.PrintOnReportOrderRequired || "No",
              "SAP/JDE": record["SAP/JDE"] || "No"
            };
          }
          return acc; 
        }, null);

        const latestRecord = existingRecord ? null : getLatestRecord(specName);
        const recordToPush = {
          ...specDetails,
         ...(existingRecord || latestRecord || defaultRecord())
      };
        data.push(recordToPush);
      }
      return resObject; 
    } catch (error) {
      console.error('Error processing items:', error);
      throw new Error('An error occurred while processing items');
    }
  }

  async getLatestSpecItemDetails(specName: any, specRevision: any, Items: any) {
    const data: any[] = [];  
    const resObject = {
      "SpecName": specName,
      "SpecRevision": specRevision,
      "Items": data 
    };
  
    try { 
      if (!container) {
        throw new Error("The specified collection is not present");
      }  
  
      const result = await this.container.items.query({
        query: `SELECT * FROM c WHERE c.SpecName = @SpecName`,
        parameters: [{ name: "@SpecName", value: specName }],
      }).fetchAll();
  
      const filteredRecordsMap = result.resources.reduce((map, record) => {
        if (!map[record.ItemName]) {
          map[record.ItemName] = [];
        }
        map[record.ItemName].push(record);
        return map;
      }, {} as Record<string, any[]>);
  
      const getLatestRecord = (itemName: string) => {
        const records = filteredRecordsMap[itemName];
        if (records) {
          const latestRecord = records.reduce((prev, current) => {
            return (Number(prev.seq) > Number(current.seq)) ? prev : current;
          });
          return {
            "PrintOnPurchaseOrderRequired": latestRecord.PrintOnPurchaseOrderRequired || "No",
            "PrintOnWorkOrderRequired": latestRecord.PrintOnWorkOrderRequired || "No",
            "WorkOrderDocumentRequired": latestRecord.WorkOrderDocumentRequired || "No",
            "PrintOnReportOrderRequired": latestRecord.PrintOnReportOrderRequired || "No",
            "SAP/JDE": latestRecord["SAP/JDE"] || "No"
          };
        }
        return null;
      };
  
      const defaultRecord = () => ({
        "PrintOnPurchaseOrderRequired": "No",
        "PrintOnWorkOrderRequired": "No",
        "WorkOrderDocumentRequired": "No",
        "PrintOnReportOrderRequired": "No",
        "SAP/JDE": "No"
      });
  
      for (const item of Items) {
        const itemName = item.ItemName;
        const itemRevision = item.ItemRevision;
        const itemDetails = { "ItemName": itemName, "ItemRevision": itemRevision };
  
        const existingRecord = result.resources.reduce((acc, record) => {
          if (
            record.SpecName === specName &&
            record.SpecRevision === specRevision &&
            record.ItemName === itemName &&
            record.ItemRevision === itemRevision
          ) {
            acc = {
              "PrintOnPurchaseOrderRequired": record.PrintOnPurchaseOrderRequired || "No",
              "PrintOnWorkOrderRequired": record.PrintOnWorkOrderRequired || "No",
              "WorkOrderDocumentRequired": record.WorkOrderDocumentRequired || "No",
              "PrintOnReportOrderRequired": record.PrintOnReportOrderRequired || "No",
              "SAP/JDE": record["SAP/JDE"] || "No"
            };
          }
          return acc; 
        }, null);

        // Determine if we should use the existing record, the latest record, or the default record
        const latestRecord = existingRecord ? null : getLatestRecord(itemName);

        const recordToPush = {
            ...itemDetails,
           ...(existingRecord || latestRecord || defaultRecord())
        };
  
        // Add the selected record to the data array
        data.push(recordToPush);
      }
  
      return resObject; 
    } catch (error) {
      console.error('Error processing items:', error);
      throw new Error('An error occurred while processing items');
    }
  }

  async processItem(Body: any) { 
    const ItemId = Body.id;
    const itemName = Body.name;
    const itemRevision = Body.revision;

    try { 
      if (!container) {
        throw new Error("The specified collection is not present");
      }  
      const result = await this.container.items.query({
        query: `SELECT * FROM c WHERE c.ItemName = @ItemName AND c.ItemRevision = @ItemRevision`,
        parameters: 
        [
          { name: "@ItemName", value: itemName },
          { name: "@ItemRevision", value: itemRevision}

        ],
      }).fetchAll();

      const { itemSpecURL, baseURL } = urlConfig;
      const { itemSpecURLParams, } =  API_CONFIG;
      const csrfTokenAndHeaders = await this.getAuthenticationToken();
      const headers = {
        Cookie: csrfTokenAndHeaders.Cookie,
        SecurityContext: csrfTokenAndHeaders.SecurityContext,
        ENO_CSRF_TOKEN: csrfTokenAndHeaders.ENO_CSRF_TOKEN,
        "Content-Type": csrfTokenAndHeaders["Content-Type"],
      };
      const specDataEngItem = await axios.get(
        `${itemSpecURL}/${ItemId}`,
        {
          params: itemSpecURLParams,
          headers,
          httpsAgent: agent,
        }
      );

      const specFilterData = specDataEngItem?.data?.data?.map((item) => ({
        SpecName: item.dataelements?.name,
        SpecRevision: item.dataelements?.revision,
      }));
      const specFilterSet = new Set(
        specFilterData.map(item => `${item.SpecName}-${item.SpecRevision}`)
      );
      const uniqueItems = result.resources.filter(item => {
        const specKey = `${item.SpecName}-${item.SpecRevision}`;
        return !specFilterSet.has(specKey);
      });
      
      for (const record of uniqueItems) { 
        await this.container.item(record.id, record.ItemName).delete();
      }      
      return "Success";
    } catch (error) {
      console.error('Error processing items:', error);
      throw new Error('An error occurred while processing items');
    }
  }
  
  
// Process the released items by extracting relevant details and updating the business operations table
async processReleasedItems(body: any) {
  try {
    
    let processedCADetails:any = {};
    const csrfTokenAndHeaders = await this.getAuthenticationToken();
    const headers = {
      Cookie: csrfTokenAndHeaders.Cookie,
      SecurityContext: csrfTokenAndHeaders.SecurityContext,
      ENO_CSRF_TOKEN: csrfTokenAndHeaders.ENO_CSRF_TOKEN,
      "Content-Type": csrfTokenAndHeaders["Content-Type"],
    };

    // Filter released items and extract unique item IDs
    const releasedItems = body.filter(item => item.ItemState === "Released" && item.SpecState === "Released");
    if (releasedItems.length > 0) { 
      const uniqueReleasedItemIds = this.getUniqueItemIds(releasedItems);
      if (uniqueReleasedItemIds.length > 0) {

        // Fetch classification details for the unique items
        const classificationDetails = await this.getClassificationDetails(uniqueReleasedItemIds, headers, processedCADetails);
        if (classificationDetails.length > 0) {

          // Update the business operations table with the retrieved details
          await this.updateBosTable(releasedItems, classificationDetails, headers);
        } else {
          console.log("No classification details found.");
          return;
        }
      } else {
        console.log("No unique released item IDs found.");
        return; 
      }
    } else {
      console.log("No released items found in payload.");
      return; 
    }
       


  } catch (error) {
    console.error('Error in processing released items:', error);
  }
}

// Helper method to extract unique item IDs from the released items
private getUniqueItemIds(items: any[]): string[] {
  return items
    .map(item => item.ItemID)
    .filter((value, index, self) => value && self.indexOf(value) === index);
}

// Fetch classification details for the unique released item IDs
async getClassificationDetails(itemIds: string[], headers: any, processedCADetails:any): Promise<any[]> {
  const details: any[] = [];
  let FlowDownCADetails: any ={}
  try {
    for (const itemId of itemIds) {
      const plantData = await this.fetchPlantDataForItem(itemId, headers,processedCADetails);
      details.push({ Id: itemId, PlantData: plantData });
    }
  } catch (error) {
    console.error('Error in fetching classification details:', error);
  }
  return details;
}

// Fetch the plant data for a single item ID
private async fetchPlantDataForItem(itemId: string, headers: any,processedCADetails:any): Promise<any[]> {
  const plantData: any[] = [];
  const previousRevisionClasses = await this.getPreviousRevisionClasses(itemId, headers);
  const classificationData = await this.fetchClassificationData(itemId, headers);

  // Process the classification data to extract relevant plant assignment details
  for (const classAttr of classificationData) {
    const plantName = await this.extractPlantNameAfterClassIsTrue(classAttr,headers);
    if (plantName) {
      const flowDownCA = "EMRMCOName";
      const status = "EMRPlantStatus";
      const attributeValues = this.extractAttributes(classAttr.Attributes, flowDownCA, status);

      // Check flow-down status and plant assignment conditions
     const flowDownCAName= attributeValues[flowDownCA];
      if (flowDownCAName) {
        let flowDownCAStatus = "";
        let flowDownCABU = "";
        if (flowDownCAName in processedCADetails) { 
          flowDownCAStatus = processedCADetails[flowDownCAName]['Status'];
          flowDownCABU = processedCADetails[flowDownCAName]['RDO'];
        }else {
          const flowDownCAarray = await this.checkFlowDownCAStatus(flowDownCAName, headers);
          processedCADetails[flowDownCAName] = flowDownCAarray;
          flowDownCAStatus = flowDownCAarray['Status'];
          flowDownCABU = flowDownCAarray['RDO'];
        }        
        if (flowDownCABU !== null && flowDownCABU !== "") {
          if (flowDownCAStatus) {
            plantData.push({"PlantName":plantName,"RDO":flowDownCABU});
          } else if (previousRevisionClasses.includes(plantName)) {
            plantData.push({"PlantName":plantName,"RDO":flowDownCABU});
          }
        }
      }
    }
  }
  return plantData;
}

// Fetch classification data for an item ID
private async fetchClassificationData(itemId: string, headers: any) {
  const { engClassificationURL, searchCaURL, modifyCaURL, baseURL } = urlConfig;
  const { engClassificationURLParams } = API_CONFIG;
  const response = await axios.get(
    `${engClassificationURL}/${itemId}`,
    {
      params: engClassificationURLParams,
      headers,
      httpsAgent: agent,
    }
  );
  return response?.data?.member[0]?.ClassificationAttributes?.member || [];
}

// Extract plant name after confirming the PlantAssignmentClass is valid (true)
private async extractPlantNameAfterClassIsTrue(classAttr: any,headers: any): Promise<string | null> {
  const ClassID = classAttr.ClassID;
  const attributes = classAttr.Attributes || [];

  // Check for the PlantAssignmentClass first
  const plantAssignmentClass = attributes.find(attr => attr.name === 'EMRPlantAssignmentClass')?.value;

  // Proceed only if PlantAssignmentClass is found and valid (true)
  if (plantAssignmentClass) {
    // Find the associated PlantId, once we know the assignment class is valid
    const plantName = await this.fetchClassName(ClassID,headers);
    if (plantName) {
      // Extract and return the plant name
     // const plantName = plantIdAttr.name.replace("PlantId", "");
      return plantName;
    }
  }

  // Return null or empty string if no valid PlantAssignmentClass is found
  return null;
}

private async fetchClassName(
  realizedClassId: any,
  headers: AxiosHeaders,
): Promise<any> {
  try {
    const { engClassificationIdURL } = urlConfig;
    const response = await axios.get(`${engClassificationIdURL}/${realizedClassId}`,
      {
        headers,
        httpsAgent: agent,
      }
    );
    return response.data?.member?.[0]?.title.replace(/^Plant\s*/, "");
    
  } catch (error) {
    console.error(`Error fetching ClassName for item: ${realizedClassId}:`,error);
    return "";
  }
}

//Not using THis Methods
// Construct flow-down CA based on the plant assignment class
private constructFlowDownCA(plantAssignmentClass: string): string {
  return /^[0-9]/.test(plantAssignmentClass) ? `FlowDownCA${plantAssignmentClass}` : `${plantAssignmentClass}FlowDownCA`;
}

// Construct the status based on the plant assignment class
private constructStatus(plantAssignmentClass: string): string {
  return /^[0-9]/.test(plantAssignmentClass) ? `ERPStatus${plantAssignmentClass}` : `${plantAssignmentClass}ERPStatus`;
}

// Extract relevant attribute values for flow-down CA and status
private extractAttributes(attributes: any[], flowDownCA: string, status: string): { [key: string]: string } {
  return attributes.reduce((acc, attr) => {
    if ([flowDownCA, status].includes(attr.name)) {
      acc[attr.name] = attr.value;
    }
    return acc;
  }, {});
}

// Fetch the previous revision's classes for an item ID
async getPreviousRevisionClasses(itemId: string, headers: any): Promise<string[]> {
  const previousClasses: string[] = [];
  try {
    const { getAllRevisions ,baseURL} = urlConfig;
    const { getRevGraphReqBody } = API_CONFIG;

    getRevGraphReqBody.data[0].id = itemId;
    getRevGraphReqBody.data[0].identifier = itemId;
    getRevGraphReqBody.data[0].type = 'VPMReference';
    getRevGraphReqBody.data[0].source = baseURL;
    getRevGraphReqBody.data[0].relativePath = `/resources/v1/modeler/dseng/dseng:EngItem/${itemId}`;
    
    const response = await axios.post(getAllRevisions, getRevGraphReqBody, { headers, httpsAgent: agent });

    const currentVersion = response?.data?.result?.versions?.find(v => v.id === itemId);
    if (currentVersion?.ancestors?.length) {
      const previousRevisionId = currentVersion.ancestors[0].id;
      const prevClassification = await this.fetchClassificationData(previousRevisionId, headers);
      // prevClassification.forEach(classAttr => {
      //   //TBD get plantID from Class ID
      //   //const plantId = this.extractPlantIdFromAttributes(classAttr.Attributes);
      //   const plantId = classAttr.ClassID;
      //   const plantName = this.fetchClassName(plantId,headers);
      //   if (plantName) previousClasses.push(plantName);
      // });
      for (const classAttr of prevClassification) {
        const plantId = classAttr.ClassID;
        if (!plantId) continue;
      
        const plantName = await this.fetchClassName(plantId, headers);
        if (plantName) {
          previousClasses.push(plantName);
        }
      }
    }
  } catch (error) {
    console.error('Error in fetching previous revision classes:', error);
  }
  return previousClasses;
}

// Extract plant ID from classification attributes Not used this Method-->
private extractPlantIdFromAttributes(attributes: any[]): string | undefined {
  return attributes.find(attr => attr.name.includes("PlantId"))?.value;
}

// Check if the flow-down CA status is complete
async checkFlowDownCAStatus(flowdownCA: string, headers: any): Promise<{}> {
  try {
    const { searchCaURL, modifyCaURL,searchRouteURL ,createRouteURL,searchRoutePrivateURL} = urlConfig;
    const CAnumber = ((p) => p.length === 3 && /^\d+$/.test(p[1]) ? p[1] : flowdownCA)(flowdownCA.split("-"));
    const { data } = await axios.get(searchCaURL, {
      params: { '$searchStr': `name:*${CAnumber}` },
      headers,
      httpsAgent: agent,
    });
    const CAList = data?.changeAction || [];
    for (const ca of CAList) {
      const CAId = ca?.identifier;
      if (CAId) {
        const response = await axios.get(`${searchRoutePrivateURL}`, {
          params: {
            whereUsed: CAId,
            tenant: "OI000186152",
          },
          headers,
          httpsAgent: agent,
        });
        const match = response?.data?.data.find(item => item.type === "Route" && item.dataelements?.name === flowdownCA);

        if (match) {
          const collabSpace = match.dataelements?.project;
          const RouteStatus = match.dataelements?.state;
          const status = RouteStatus === 'Complete';
          return { Status: status, RDO: collabSpace };
        }
      }
    }
  } catch (error) {
    console.error('Error checking FlowDownCA status:', error);
  }
  return {"Status":false,"RDO":""};
}

async updateBosTable(releasedItems: any[], detailsArray: any[], headers: any): Promise<void> {
  try {
    
    const { bosSpecUpdateURL } = urlConfig;
    const bosArray = releasedItems.flatMap(item => {
      const matchingDetail = detailsArray.find(detail => detail.Id === item.ItemID);
      const plantData = matchingDetail?.PlantData || []; 

      // Map over the plantData to create bos entries
      return plantData.map(plant => ({
        organizationCode: plant.PlantName, 
        woPrintFlag: item.PrintOnWorkOrderRequired,
        itemSpecDelinkFlag: "N",
        poPrintFlag: item.PrintOnPurchaseOrderRequired,
        invItemName: item.ItemName.toUpperCase(),
        rtPrintFlag: item.PrintOnReportOrderRequired,
        specNumber: item.SpecName,
        itemSpecAttributeCategory: "",
        workOrderDocumentFlag: item.WorkOrderDocumentRequired,
        userName: "EMR_MMI_ENG_OMIADMIN",
        specType: "", 
        plantName: plant.PlantName, 
        businessUnit: plant.RDO 
      }));
    });

    const body = { "bosspecs": { "bos": bosArray } };
    console.log("body:", JSON.stringify(body, null, 2));
    const response = await axios.post(bosSpecUpdateURL, body, { headers, httpsAgent: agent });
    if (response.status === 200) {
      console.log("BOS table updated successfully");
    } else {
      console.error(`Error: Unexpected Error when updated BOS table ${response.status}`);
    }
  } catch (error) {
    console.error('Error in updating the Bos:', error);
  }
}



}