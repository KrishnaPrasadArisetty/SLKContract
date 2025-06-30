import { AxiosHeaders } from "axios";
import { Request, Response } from "express";
import AuthService from "../authentication/authService";
import Document from "../document/document";
import ItemService from "./ItemService";

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

class documentService {
  async getAuthenticationToken(userInfo: any = {}): Promise<FutureRequestHeaders> {
    const authService = new AuthService();
    const csrfToken = await authService.authenticateUser(userInfo);
    return csrfToken;
  }

  public async createUpdateDocuments(req: Request, res: Response): Promise<void> {
    try {
      const csrfTokenAndHeaders = await this.getAuthenticationToken();
      const headers: AxiosHeaders = this.buildHeaders(csrfTokenAndHeaders);
      const documentArray = req?.body?.documents;
      const userID = req?.body?.userId;
      const securityContext = req?.body?.securityContext;

      if (!documentArray || !Array.isArray(documentArray)) {
        throw new Error("Invalid document array");
      }

      const batchSize = 100; // Define the batch size
      const responses = await this.processDocumentsInBatches(documentArray,userID,securityContext, headers, batchSize);
      console.log("responses", responses);

      res.json({ success: true, responses });
    } catch (error) {
      console.error('Error in createUpdateDocuments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get mass import documents',
        error: error.message || 'Unknown error'
      });
    }
  }

  private buildHeaders(csrfTokenAndHeaders: FutureRequestHeaders): AxiosHeaders {
    const headers = new AxiosHeaders();
    headers.set('Cookie', csrfTokenAndHeaders.Cookie || '');
    headers.set('SecurityContext', csrfTokenAndHeaders.SecurityContext);
    headers.set('ENO_CSRF_TOKEN', csrfTokenAndHeaders.ENO_CSRF_TOKEN);
    headers.set('Content-Type', csrfTokenAndHeaders["Content-Type"]);
    return headers;
  }

  private async processDocumentsInBatches(documentArray: any[],userID:any,securityContext:string, headers: AxiosHeaders, batchSize: number): Promise<any[]> {
    const results: any[] = [];
    for (let i = 0; i < documentArray.length; i += batchSize) {
      const batch = documentArray.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(document => this.processDocument(document, userID,securityContext,headers)));
      results.push(...batchResults);
    }
    return results;
  }

  private async processDocument(documentInfo: any, userID: any, securityContext:string,headers: AxiosHeaders): Promise<any> {
    
    const result = {
      "name": "",
      "revision": "",
      "status": "",
      "message": ""
    };
    let docBeingProcessed: any = documentInfo;
    try {
      // Check if document object exists if yes return object details
      const document = new Document(); // Create an instance of the Document class


      // build leader security context
      const leaderSecurityContext = `VPLMProjectLeader.${securityContext.split(".")[1]}.${docBeingProcessed?.collabSpace}`;
      
      headers.SecurityContext = leaderSecurityContext;
    
      const collabSpaceTitle = docBeingProcessed?.collabSpaceTitle;
      const classificationType = docBeingProcessed?.classificationType;
      const documentSearchResult: any = await document.checkDocumentExists(documentInfo?.dataelements?.name, headers);


      if (documentSearchResult?.data && documentSearchResult?.data.length > 0) {
        // Document already exists
        // Fetch the latest revision
        let latestRevision = documentSearchResult.data.find((doc: any) => doc.dataelements?.isLatestRevision === "TRUE");
        docBeingProcessed = latestRevision;
        // check the state of the latest revision
        if (latestRevision) {
          let state = latestRevision.dataelements?.state.toUpperCase();
          if (state && (state === "DRAFT" || state === "IN_WORK")) {
            // update the document properties.
            // generate the properties to update
            let propertiesToUpdate = this.mapDocumentDataElements(documentInfo.dataelements, latestRevision.dataelements);
            const docUpdateResult: any = await document.updateDocumentProperties(latestRevision.id, { "dataelements": propertiesToUpdate }, headers);

            result.name = docUpdateResult?.data[0]?.dataelements?.name;
            result.revision = docUpdateResult?.data[0]?.dataelements?.revision;
            result.status = "Success";
            result.message = "Document updated successfully";
            return result;
          } else {
            // Document is not in correct state, so cannot be updated

            result.name = latestRevision?.dataelements?.name;
            result.revision = latestRevision?.dataelements?.revision;
            result.status = "Failed";
            result.message = "Document is not in correct state, so cannot be updated";
            return result;
          }
        }
      } else {
        // Document does not exist
        const createDocResponse = await document.createDocument(documentInfo, headers);
        docBeingProcessed = createDocResponse?.data[0];
        
        const ItemServiceInstance = new ItemService();
        // Classify the object
        let classID = await ItemServiceInstance.getClassifcationIdByType(classificationType,collabSpaceTitle,"Document",leaderSecurityContext,headers);
        let classificationResponse = await ItemServiceInstance.classifyItem("Document", docBeingProcessed?.id,leaderSecurityContext ,classID,  headers);

        // check classification response to show error
        

        // Transfer the ownership
        const transferOwnershipResponse = await ItemServiceInstance.transferOwnership(createDocResponse?.data[0]?.id, userID, leaderSecurityContext, headers);
        // Check transfer ownership response to show error

        result.name = createDocResponse?.data[0]?.dataelements?.name;
        result.revision = createDocResponse?.data[0]?.dataelements?.revision;
        result.status = "Success";
        result.message = "Document Created successfully";
        return result
      }

      // // await new Promise((resolve) => setTimeout(resolve, documentInfo.time));
      // if (documentInfo.fail) throw new Error("failed");
      // return "test";
    } catch (processDocError) {

      
      const errorMessage = processDocError?.response?.data?.message || processDocError?.response?.data?.errorReport[0]?.errorMessage || processDocError.message || 'Unknown error'
      result.name = docBeingProcessed?.dataelements?.name;
      result.revision = docBeingProcessed?.dataelements?.revision||"";
      result.status = "Failed";
      result.message = errorMessage;
      return result;
    }
  }

  private mapDocumentDataElements(documentInfo: any, dataelement: any): any {
    try {
      let dataelementsToUpdate = {};
      Object.keys(documentInfo).forEach((key) => {
        let value = documentInfo[key];
        if (dataelement.hasOwnProperty(key) && value) {
          dataelementsToUpdate[key] = value;
        }
      });
      return dataelementsToUpdate;
    } catch (error) {
      console.error('Error mapping document data elements:', error);
      throw new Error(`Failed to map document data elements: ${error.message}`);
    }
  }

  public async connectItemDocuments(req: Request, res: Response): Promise<void> {
    try {
      const csrfTokenAndHeaders = await this.getAuthenticationToken();
      const headers: AxiosHeaders = this.buildHeaders(csrfTokenAndHeaders);
      const documentArray = req?.body?.documents;

      if (!documentArray || !Array.isArray(documentArray)) {
        throw new Error("Invalid document array");
      }

      // const responses = await this.processDocument(documentArray, headers);
      // console.log("responses", responses);

      // res.json({ success: true, responses });
    } catch (error) {
      console.error('Error in connectItemDocuments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to connect item documents',
        error: error.message || 'Unknown error'
      });
    }
  }

}

export default documentService;
