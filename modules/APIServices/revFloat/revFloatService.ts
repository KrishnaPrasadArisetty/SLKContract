import { Request, Response } from "express";
import AuthService from "../authentication/authService";
import API_CONFIG from "../config/APIConfig";
import axios, { AxiosHeaders } from "axios";
import { urlConfig } from "../config/urlConfig";

import { EmailController } from '../../mailer/mailer.controller';

const https = require("https");
import { configurations } from "../config/configurations";

const agent = new https.Agent({
  rejectUnauthorized: false,
});

interface FutureRequestHeaders {
  Cookie: string | undefined;
  SecurityContext: string;
  ENO_CSRF_TOKEN: string;
  "Content-Type": string;
}
class RevFloatService {
  // const userInfo = {// Optional to pass this object
  //     username: authConfig.username,
  //     password: authConfig.password,
  //     securityContext: authConfig.SecurityContext
  // };
  async getAuthenticationToken(
    userInfo: any = {}
  ): Promise<FutureRequestHeaders> {
    const authService = new AuthService();
    const csrfToken = await authService.authenticateUser(userInfo);

    return csrfToken;
  }


  private async getDetails(droppedObjectID: string, droppedObjectType: string, headers: AxiosHeaders): Promise<any> {

    try {
      const {
        phyProdEINMask,
        rawMaterialEINMask,
        docMask,
        getRevGraphReqBody,
        phyProdCADMask,
        droppedObjDetails,
        docInfoParamts,
        caUrlParams,
        mfgItemUrlParams
      } = API_CONFIG;
      const {
        getPhysicalProductInfoURL,
        getDocumentInfoURL,
        getRawMaterialInfoURL,
        getAllRevisions,
        baseURL,
        cadSearchURL,
        getCadObjDetails,
        caDetailsURL,
        mfgItemURL
      } = urlConfig;

      const droppedObjDetailsCopy = { ...droppedObjDetails };


      // Check the object type and call appropriate WS to get object details
      let objectDetailsURL = getPhysicalProductInfoURL;
      let objectDetailsParams: any = phyProdEINMask;
      if (droppedObjectType == "Document") {
        objectDetailsURL = getDocumentInfoURL;
        objectDetailsParams = docMask;
      } else if (droppedObjectType == "Raw_Material") {
        objectDetailsURL = getRawMaterialInfoURL;
        objectDetailsParams = rawMaterialEINMask;
      } else if (droppedObjectType == "ChangeAction") {
        objectDetailsURL = caDetailsURL;
        objectDetailsParams = caUrlParams;
      } else if (droppedObjectType == "CreateKit" || droppedObjectType == "CreateAssembly" || droppedObjectType == "CreateMaterial" || droppedObjectType == "Provide" || droppedObjectType == "ProcessContinuousProvide") {
        objectDetailsURL = mfgItemURL;
        objectDetailsParams = mfgItemUrlParams;
      }

      const objectDetailsRes = await axios.get(`${objectDetailsURL}/${droppedObjectID}`, {
        params: objectDetailsParams,
        headers,
        httpsAgent: agent,
      });
      
      // get UI values
      const objectUIDetailsRes = await axios.get(`${getDocumentInfoURL}/${droppedObjectID}`, {
        params: docInfoParamts,
        headers,
        httpsAgent: agent,
      });

      // Get the latest released revision
      // Create the body for the rev post API
      getRevGraphReqBody.data[0].id = droppedObjectID;
      getRevGraphReqBody.data[0].identifier = droppedObjectID;
      getRevGraphReqBody.data[0].type = droppedObjectType;
      getRevGraphReqBody.data[0].source = baseURL;
      getRevGraphReqBody.data[0].relativePath = objectUIDetailsRes?.data?.data[0]?.relativePath;

      const objectRevGraphRes = await axios.post(`${getAllRevisions}`, getRevGraphReqBody, {
        params: objectDetailsParams,
        headers,
        httpsAgent: agent,
      });

      // Get the highest released revision
      const releasedRevisions = objectRevGraphRes?.data?.results[0]?.versions.filter(
        (version: any) => {
          return version.maturityState === "RELEASED";
        }
      );

      // Get the latest revision
      const latestRevision = objectRevGraphRes?.data?.results[0]?.versions.reduce(
        (prev: any, current: any) => {
          return (prev.revision > current.revision) ? prev : current;
        }
      );

      const highestReleasedRevision = releasedRevisions.length > 0 ? releasedRevisions.reduce((prev: any, current: any) => {
        return (prev.revision > current.revision) ? prev : current;
      }, releasedRevisions[0]) : "";

      // Build Response data
      if (droppedObjectType === "Document" && objectUIDetailsRes) {
        droppedObjDetailsCopy.Title = objectUIDetailsRes?.data?.data[0]?.dataelements?.title;
        droppedObjDetailsCopy.Description = objectUIDetailsRes?.data?.data[0]?.dataelements?.description;
        droppedObjDetailsCopy.EIN = "";
        droppedObjDetailsCopy["Dropped Revision"] = objectUIDetailsRes?.data?.data[0]?.dataelements?.revision;
        droppedObjDetailsCopy["Dropped Revision ID"] = objectUIDetailsRes?.data?.data[0]?.id;
      } else if (droppedObjectType === "ChangeAction" && objectDetailsRes) {
        droppedObjDetailsCopy.Title = objectDetailsRes.data?.title;
        droppedObjDetailsCopy.Description = objectDetailsRes?.data?.description;
        droppedObjDetailsCopy.EIN = "";
        droppedObjDetailsCopy["Dropped Revision"] = "";
        droppedObjDetailsCopy["Dropped Revision ID"] = "";
      } else if (droppedObjectType == "CreateKit" || droppedObjectType == "CreateAssembly" || droppedObjectType == "CreateMaterial" || droppedObjectType == "Provide" || droppedObjectType == "ProcessContinuousProvide") {
        droppedObjDetailsCopy.Description = objectDetailsRes?.data?.member[0]?.description;
        droppedObjDetailsCopy.EIN = objectDetailsRes?.data?.member[0]?.["dsmfg:EnterpriseReference"]?.partNumber;
        droppedObjDetailsCopy.Title = objectDetailsRes?.data?.member[0]?.title;
        droppedObjDetailsCopy["Dropped Revision"] = objectDetailsRes?.data?.member[0]?.revision;
        droppedObjDetailsCopy["Dropped Revision ID"] = objectDetailsRes?.data?.member[0]?.id;
      } else {
        droppedObjDetailsCopy.Description = objectDetailsRes?.data?.member[0]?.description;
        droppedObjDetailsCopy.EIN = objectDetailsRes?.data?.member[0]?.["dseng:EnterpriseReference"]?.partNumber;
        droppedObjDetailsCopy.Title = objectDetailsRes?.data?.member[0]?.title;
        droppedObjDetailsCopy["Dropped Revision"] = objectDetailsRes?.data?.member[0]?.revision;
        droppedObjDetailsCopy["Dropped Revision ID"] = objectDetailsRes?.data?.member[0]?.id;
        droppedObjDetailsCopy["HasMBOM"] = objectDetailsRes?.data?.member[0]?.["dseno:EnterpriseAttributes"]?.EMR_hasMBOM;
      }
      droppedObjDetailsCopy.imageURL = objectUIDetailsRes?.data?.data[0]?.dataelements?.image;
      droppedObjDetailsCopy.relativePath = objectUIDetailsRes?.data?.data[0]?.relativePath;
      droppedObjDetailsCopy.Name = objectUIDetailsRes?.data?.data[0]?.dataelements?.name;
      droppedObjDetailsCopy.Type = objectUIDetailsRes?.data?.data[0]?.dataelements?.typeNLS;
      droppedObjDetailsCopy["Maturity State"] = objectUIDetailsRes?.data?.data[0]?.dataelements?.stateNLS;
      droppedObjDetailsCopy.Owner = `${objectUIDetailsRes?.data?.data[0]?.relateddata?.ownerInfo[0].dataelements?.firstname} ${objectUIDetailsRes?.data?.data[0]?.relateddata?.ownerInfo[0].dataelements?.lastname}`;
      droppedObjDetailsCopy["Collaborative Space"] = objectUIDetailsRes?.data?.data[0]?.dataelements?.collabspace;
      droppedObjDetailsCopy["Collaborative Space Title"] = objectUIDetailsRes?.data?.data[0]?.dataelements?.collabSpaceTitle;
      droppedObjDetailsCopy["Latest Released Revision"] = highestReleasedRevision?.revision || "";
      droppedObjDetailsCopy["Latest Released Revision ID"] = highestReleasedRevision?.id || "";
      droppedObjDetailsCopy["organization"] = objectUIDetailsRes?.data?.data[0]?.dataelements?.organization || "";
      droppedObjDetailsCopy["Latest Revision"] = latestRevision?.revision || "";


      // Get CAD details for Physical Products
      if (droppedObjectType == "VPMReference") {

        try {
          const objCADDetails = await axios.get(`${getPhysicalProductInfoURL}/${droppedObjectID}`, {
            params: phyProdCADMask,
            headers,
            httpsAgent: agent,
          });

          if (objCADDetails.status === 200) {
            if (objCADDetails?.data?.totalItems > 0) {
              droppedObjDetailsCopy["CAD Format"] = objCADDetails?.data?.member[0]?.["dsxcad:xCADAttributes"]?.cadorigin;
            } else {
              droppedObjDetailsCopy["CAD Format"] = "3DExperience";
            }
          } else {
            droppedObjDetailsCopy["CAD Format"] = "3DExperience";
          }
        } catch (getCadDetailError) {
          droppedObjDetailsCopy["CAD Format"] = "3DExperience";
          console.log(getCadDetailError.message);
        }

      } else {
        droppedObjDetailsCopy["CAD Format"] = "";
      }
      return droppedObjDetailsCopy;
    } catch (error) {
      // Log the error for debugging purposes
      console.error('Error fetching object details:', error);

      // Return an error response      
      throw new Error(`Failed to fetch object details: ${error?.response?.data?.message || error.message || 'Unknown error'}`);
    }
  }

  public async getDroppedObjectDetails(req: Request, res: Response): Promise<void> {

    try {


      const csrfTokenAndHeaders = await this.getAuthenticationToken();
      const queryParams = req.query;
      const droppedObjectID = queryParams?.oid as string;
      const droppedObjectType = queryParams?.type as string;

      const headers: AxiosHeaders = {
        Cookie: csrfTokenAndHeaders.Cookie,
        SecurityContext: csrfTokenAndHeaders.SecurityContext,
        ENO_CSRF_TOKEN: csrfTokenAndHeaders.ENO_CSRF_TOKEN,
        "Content-Type": csrfTokenAndHeaders["Content-Type"],
      };

      const details = await this.getDetails(droppedObjectID, droppedObjectType, headers);
      res.send(details);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get dropped object details',
        error: error.message || 'Unknown error'
      });
    }
  }

  public async getParents(req: Request, res: Response): Promise<void> {

    try {


      const {
        phyProdCADMask,
        rawMaterialEINMask,
        docMask,
        getRevGraphReqBody,
        cadSearchEINMask,
        droppedObjDetails,
        docWhereUsedAttachmentParams,
        docWhereUsedSpecDocParams
      } = API_CONFIG;
      const {
        getPhysicalProductInfoURL,
        getDocumentInfoURL,
        getRawMaterialInfoURL,
        getAllRevisions,
        baseURL,
        cadSearchURL,
        getPhyProdWhereUsedURL,
        getDocumentWhereUsedURL,
        getCadObjDetails
      } = urlConfig;

      const csrfTokenAndHeaders = await this.getAuthenticationToken();
      let reqBody = req.body;

      let objectId = reqBody?.data?.id as string;
      let objectType = reqBody?.data?.type as string;
      let objectRelativePath = reqBody?.data?.relativePath as string;

      const headers: AxiosHeaders = {
        Cookie: csrfTokenAndHeaders.Cookie,
        SecurityContext: csrfTokenAndHeaders.SecurityContext,
        ENO_CSRF_TOKEN: csrfTokenAndHeaders.ENO_CSRF_TOKEN,
        "Content-Type": csrfTokenAndHeaders["Content-Type"],
      };

      // Get All revisions of the object
      // Get the latest released revision
      // Create the body for the rev post API
      getRevGraphReqBody.data[0].id = objectId;
      getRevGraphReqBody.data[0].identifier = objectId;
      getRevGraphReqBody.data[0].type = objectType;
      getRevGraphReqBody.data[0].source = baseURL;
      getRevGraphReqBody.data[0].relativePath = objectRelativePath;


      let objectRevGraphResp = await axios.post(`${getAllRevisions}`, getRevGraphReqBody, {
        headers,
        httpsAgent: agent,
      });

      // console.log("versions", objectRevGraphRes?.data?.results[0]?.versions);
      // Get the highest released revision
      const releasedRevisions = objectRevGraphResp?.data?.results[0]?.versions.filter(
        (version: any) => {
          return version.maturityState === "RELEASED";
        }
      );

      const highestReleasedRevision = releasedRevisions.length > 0 ? releasedRevisions.reduce((prev: any, current: any) => {
        return (prev.revision > current.revision) ? prev : current;
      }, releasedRevisions[0]) : "";


      // Check if Physical product is a CAD Object, based on that the parent API will have different relativePath
      let isCadObject = false;
      if (objectType == "VPMReference") {
        try {
          const objectCADDetailsRes = await axios.get(`${getCadObjDetails}/${objectId}`, {
            headers,
            httpsAgent: agent,
          });

          if (objectCADDetailsRes.status === 200) {
            isCadObject = true;
          } else {
            isCadObject = false;
          }
        } catch (getCadDetailError) {
          console.log(getCadDetailError.message);
          isCadObject = false;
        }
      }
      // Get All parents of all revisions parallely

      let allUniqueParents = await Promise.all(
        objectRevGraphResp?.data?.results[0]?.versions.map(async (version: any) => {

          // If type is document call diff api, for phy prod and raw materail the parent api will be same
          if (objectType == "Document") {
            let docParentInfo: { SpecDoc: any[], Attachment: any[] } = { SpecDoc: [], Attachment: [] };
            let specDocParentRes = await axios.get(`${getDocumentWhereUsedURL}/${version.identifier}`, {
              params: docWhereUsedSpecDocParams,
              headers,
              httpsAgent: agent,
            });
            console.log
            let specDocParentsDetails = specDocParentRes?.data?.data.map((item: any) => ({
              ...item.dataelements,
              connectedChildRev: version.revision,
              identifier: item.identifier,
              type: item.type
            }));
            docParentInfo.SpecDoc.push(...specDocParentsDetails);

            let attachmentParentRes = await axios.get(`${getDocumentWhereUsedURL}/${version.identifier}`, {
              params: docWhereUsedAttachmentParams,
              headers,
              httpsAgent: agent,
            });

            let attachementParentDetails = attachmentParentRes?.data?.data.map((item: any) => ({
              ...item.dataelements,
              connectedChildRev: version.revision,
              identifier: item.identifier,
              type: item.type
            }));
            docParentInfo.Attachment.push(...attachementParentDetails);

            return docParentInfo;

          } else {
            if (isCadObject) {
              version.relativePath = version.relativePath.split("dseng").join("dsxcad").split("EngItem").join("Product");
            } else if (objectType == "VPMReference") {
              version.type = "dseng:EngItem";
            }

            console.log("version.relativePath", version.relativePath);
            const referencedObjects = [version];
            const whereUsedPostBody = { referencedObjects };
            const objectParentRes = await axios.post(`${getPhyProdWhereUsedURL}`, whereUsedPostBody, {
              headers,
              httpsAgent: agent,
            });

            const uniqueParents = new Map();
            for (const parent of objectParentRes?.data?.member) {
              for (const instanceDetails of parent["dseng:EngInstance"]?.member) {
                const parentObject = instanceDetails.parentObject;
                // console.log("parentObject.identifier", parentObject.identifier);
                if (parentObject && !uniqueParents.has(parentObject.identifier)) {
                  instanceDetails.connectedChildRev = version.revision;
                  instanceDetails.connectedChildRevID = version.identifier;
                  uniqueParents.set(parentObject.identifier, instanceDetails);
                }
              }
            }
            return Array.from(uniqueParents.values());
          }

        })
      );

      if (objectType == "Document") {
        // Function to get unique items based on itemId
        const getUniqueItems = (items: any[]) => {
          const uniqueItemsMap = new Map();
          items.forEach(item => {
            if (!uniqueItemsMap.has(item.identifier)) {
              uniqueItemsMap.set(item.identifier, item);
            }
          });
          const ItemsToReplace: any[] = [];

          const uniqueItems = Array.from(uniqueItemsMap.values());

          const uniqueItemsToBeReplaced: any[] = [];
          uniqueItems.forEach(parent => {
            const matchingNameObjs = uniqueItemsToBeReplaced.filter(item => item.name === parent.name);
            if (matchingNameObjs.length > 0) {
              matchingNameObjs.forEach(sameNameParent => {
                // Check if higher rev parent is already added in the array
                if (sameNameParent.revision > parent.revision) {
                  // Check if the higher revision parent is not released
                  if (sameNameParent.state.toLowerCase() != "released") {
                    uniqueItemsToBeReplaced.push(parent);
                  } else {

                  }
                } else {
                  if (parent.state.toLowerCase() == "released") {
                    uniqueItemsToBeReplaced.push(parent);
                    // remove the old parent from the list
                    const index = uniqueItemsToBeReplaced.indexOf(sameNameParent);
                    if (index > -1) {
                      uniqueItemsToBeReplaced.splice(index, 1);
                    }
                  } else {
                    uniqueItemsToBeReplaced.push(parent);
                  }
                }
              })
            } else {
              uniqueItemsToBeReplaced.push(parent);
            }
          });

          return uniqueItemsToBeReplaced;
        };

        // Flatten the arrays and get unique items
        const allSpecDocs = allUniqueParents.flatMap(parent => parent.SpecDoc);
        const allAttachments = allUniqueParents.flatMap(parent => parent.Attachment);

        const allDocumentParents: any[] = [];
        if (allSpecDocs.length > 0) {
          const AllUniqueSpecDoc = getUniqueItems(allSpecDocs);
          const AllUniqueSpecDocWithRelName = AllUniqueSpecDoc.map(item => ({
            ...item,
            relationship: "Specification Document"
          }));
          // add all objects of AllUniqueSpecDoc to allDocumentParents
          allDocumentParents.push(...AllUniqueSpecDocWithRelName);
        }

        // add all attachment docs to the list
        if (allAttachments.length > 0) {
          const allUniqueAttachments = getUniqueItems(allAttachments);
          const allUniqueAttachmentsWithRelName = allUniqueAttachments.map(item => ({
            ...item,
            relationship: "Attachment"
          }));
          // add all objects of AllUniqueSpecDoc to allDocumentParents
          allDocumentParents.push(...allUniqueAttachmentsWithRelName);
        }

        allUniqueParents = allDocumentParents;
      }

      //Get details of all unique parents
      const parentDetailsArray = await Promise.all(
        allUniqueParents.flat().map(async (parentDetails: any) => {
          let objDetails: { [key: string]: any } = {};
          if (objectType == "Document") {
            objDetails = parentDetails;
          } else {
            objDetails = parentDetails.parentObject;
          }
          const parentObject = parentDetails.parentObject;
          if (objDetails) {
            const parentDetailsResponse = await this.getDetails(
              objDetails.identifier,
              objDetails.type,
              headers
            );
            // console.log("parentDetailsResponse",parentDetailsResponse);
            let connectedChildRev = parentDetails.connectedChildRev;
            parentDetailsResponse.connectedChildRev = connectedChildRev;
            parentDetailsResponse.connectedChildRevID = parentDetails?.connectedChildRevID;
            parentDetailsResponse.toBeChildRevConnected = highestReleasedRevision.revision > connectedChildRev ? highestReleasedRevision.revision : "";
            parentDetailsResponse.relationship = objDetails?.relationship;
            parentDetailsResponse.instancePath = parentDetails?.relativePath;
            return parentDetailsResponse;
          }
          return null;
          // }

        })
      );
      const allParentInfo: { data: any[] } = { data: [] };

      const filteredParentDetailsArray = parentDetailsArray.filter((parentDetails, index, self) => {
        const sameNameObjects = self.filter(obj => obj.Name === parentDetails.Name);
        if (sameNameObjects.length > 1) {
          return parentDetails["Dropped Revision"] >= parentDetails["Latest Released Revision"];
        }
        return true;
      });
      allParentInfo.data = filteredParentDetailsArray;

      res.send(allParentInfo);
    } catch (error) {
      console.log(error?.response?.data?.errorReport[0]?.errorMessage);
      res.status(500).json({
        success: false,
        message: 'Failed to get Parent details',
        error: error?.response?.data?.message || error?.response?.data?.errorReport[0]?.errorMessage || error.message || 'Unknown error'
      });
    }

  }

  public async floatRevisions(req: Request, res: Response): Promise<void> {
    try {

      const {
        replaceInstaceReqBody,
        itemWhereUsedAPIBody,
        replaceAttachmentParams,
        replaceSpecDocParams
      } = API_CONFIG;
      const {
        replaceItemURL,
        getPhyProdWhereUsedURL,
        baseURL,
        replaceDocumentURL
      } = urlConfig;

      const csrfTokenAndHeaders = await this.getAuthenticationToken();

      const headers: AxiosHeaders = {
        Cookie: csrfTokenAndHeaders.Cookie,
        SecurityContext: csrfTokenAndHeaders.SecurityContext,
        ENO_CSRF_TOKEN: csrfTokenAndHeaders.ENO_CSRF_TOKEN,
        "Content-Type": csrfTokenAndHeaders["Content-Type"],
      };

      let reqBody = req?.body;
      let selectedParents = reqBody?.SelectedParents;
      let droppedObjectDetails = reqBody?.DroppedData;
      let latestReleasedRevId = reqBody?.DroppedData["Latest Released Revision ID"];
      let userEmail = reqBody.userEmail;

      let droppedObjBackendType = "";
      let respToSend: any = {};
      if (droppedObjectDetails?.Type === "Document") {
        respToSend = await this.floatDocuments(selectedParents, droppedObjectDetails, latestReleasedRevId, headers);
      } else {
        respToSend = await this.floatItems(selectedParents, droppedObjectDetails, latestReleasedRevId, headers);

      }
      try {
        await this.sendRevFloatStatusMail(userEmail, respToSend, selectedParents);
      } catch (sendMailError) {
        console.log("Error in sending mail", sendMailError.message);
      } finally {
        try {
          res.send(respToSend);
        } catch (resSendError) {
          throw new Error(`Error in sending response : ${resSendError.message || 'Unknown error'}`);
        }

      }

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update revisions',
        error: error.message || 'Unknown error'
      });
    }
  }

  private async floatItems(selectedParents: any[], droppedObjectDetails: any, latestReleasedRevId: string, headers: AxiosHeaders): Promise<any> {

    try {
      const {
        replaceInstaceReqBody,
        itemWhereUsedAPIBody,
        replaceAttachmentParams,
        replaceSpecDocParams
      } = API_CONFIG;
      const {
        replaceItemURL,
        getPhyProdWhereUsedURL,
        baseURL,
        getCadObjDetails
      } = urlConfig;

      let droppedObjBackendType = "";
      let isCADObject = false;
      if (droppedObjectDetails?.Type == "Physical Product") {
        droppedObjBackendType = "VPMReference"
        if (droppedObjectDetails["CAD Format"] != "3DExperience") {
          try {
            const objectCADDetailsRes = await axios.get(`${getCadObjDetails}/${latestReleasedRevId}`, {
              headers,
              httpsAgent: agent,
            });

            if (objectCADDetailsRes.status === 200) {
              isCADObject = true;
            } else {
              isCADObject = false;
            }
          } catch (getCadDetailError) {
            console.log(getCadDetailError.message);
            isCADObject = false;
          }

        }
      } else if (droppedObjectDetails?.Type == "Raw Material") {
        droppedObjBackendType = "Raw_Material"
      }

      // Remove the part after the last "/"
      let relativePath = droppedObjectDetails.relativePath.substring(0, droppedObjectDetails.relativePath.lastIndexOf('/'));

      // From the requst body get the selected parent objects for replacement.
      // instance path gives the parent object ID and rel id to the previous connected revision
      const connectedChildRevIDs: string[] = Array.from(new Set(selectedParents.map((parent: any) => parent.connectedChildRevID)));

      const childRevInstanceDetails = await Promise.all(
        connectedChildRevIDs.map(async (childRevID: string) => {

          const whereUsedPostBody = { ...itemWhereUsedAPIBody };
          if (whereUsedPostBody && whereUsedPostBody.referencedObjects[0]) {
            whereUsedPostBody.referencedObjects[0].identifier = childRevID;
            whereUsedPostBody.referencedObjects[0].type = droppedObjBackendType;
            whereUsedPostBody.referencedObjects[0].source = baseURL;
            whereUsedPostBody.referencedObjects[0].relativePath = `${relativePath}/${childRevID}`;

            // If CAD Object change the relative path for where used API
            if (isCADObject) {
              whereUsedPostBody.referencedObjects[0].relativePath = whereUsedPostBody.referencedObjects[0].relativePath.split("dseng").join("dsxcad").split("EngItem").join("Product")

            } else if (droppedObjBackendType == "VPMReference") {
              whereUsedPostBody.referencedObjects[0].type = "dseng:EngItem";
            }
            // console.log("whereUsedPostBody",whereUsedPostBody);
            const objectParentRes = await axios.post(`${getPhyProdWhereUsedURL}`, whereUsedPostBody, {
              headers,
              httpsAgent: agent,
            });
            return objectParentRes?.data?.member[0]?.["dseng:EngInstance"]?.member;
          }
        })
      );
      // console.log("childRevInstanceDetails",childRevInstanceDetails.flat());
      const instanceToReplace: any[] = [];
      childRevInstanceDetails.flat().forEach(childRevInstance => {

        selectedParents.forEach(selectedParent => {

          if (childRevInstance.relativePath.includes(selectedParent.relativePath)) {
            childRevInstance.collabspace = selectedParent["Collaborative Space"];
            childRevInstance.organization = selectedParent["organization"];
            childRevInstance.parentInfo = (selectedParent["EIN"] || selectedParent["Title"]) + " " + selectedParent["Dropped Revision"];
            instanceToReplace.push(childRevInstance);
          }
        })
      });

      const replaceInstaceReqBodyCopy = { ...replaceInstaceReqBody };

      let replacementResp: any[] = [];
      if (replaceInstaceReqBodyCopy && replaceInstaceReqBodyCopy.referencedObject) {
        replaceInstaceReqBodyCopy.referencedObject.identifier = latestReleasedRevId;
        replaceInstaceReqBodyCopy.referencedObject.type = droppedObjBackendType;
        replaceInstaceReqBodyCopy.referencedObject.source = baseURL;
        replaceInstaceReqBodyCopy.referencedObject.relativePath = `${relativePath}/${latestReleasedRevId}`;

        if (isCADObject) {
          replaceInstaceReqBodyCopy.referencedObject.relativePath = replaceInstaceReqBodyCopy.referencedObject.relativePath.split("dseng").join("dsxcad").split("EngItem").join("Product")
        } else if (droppedObjBackendType == "VPMReference") {
          replaceInstaceReqBodyCopy.referencedObject.type = "dseng:EngItem";
        }
        replacementResp = await Promise.all(
          instanceToReplace.map(async (instance) => {
            headers.SecurityContext = `VPLMProjectAdministrator.${instance.organization}.${instance.collabspace}`;
            try {
              console.log(`${baseURL}${instance.relativePath}/replace`);
              console.log(replaceInstaceReqBodyCopy);
              const objectParentRes = await axios.post(`${baseURL}${instance.relativePath}/replace`, replaceInstaceReqBodyCopy, {
                headers,
                httpsAgent: agent,
              });
              return {
                success: true,
                "Success in": instance?.parentInfo
              }
            } catch (replaceError) {
              return {
                errorMessage: replaceError?.response?.data?.message || replaceError.message || "Unknown Error",
                "Error in": instance?.parentInfo
              }
            }
          }
          )
        );
      }

      try {
        const manuFloatResp = await this.floatManufacturingItems(selectedParents, droppedObjectDetails, latestReleasedRevId, headers);
        replacementResp.push(...manuFloatResp);

      } catch (mfgFloatError) {
        console.log("Error in replacing Manufacturing items : ", mfgFloatError.message);
      }
      return (replacementResp);
    } catch (replaceItemsError) {
      // Log the error for debugging purposes
      console.error('Error in replacing items method:', replaceItemsError.message);

      // Return an error response
      const errorMessage = replaceItemsError?.response?.data?.message || replaceItemsError?.response?.data?.errorReport[0]?.errorMessage || replaceItemsError.message || 'Unknown error'
      throw new Error(`Error in floating items method : ${errorMessage}`);
    }
  }

  private async floatDocuments(selectedParents: any[], droppedObjectDetails: any, latestReleasedRevId: string, headers: AxiosHeaders): Promise<any> {

    try {
      const {
        replaceAttachmentParams,
        replaceSpecDocParams,
        docReplacementBody
      } = API_CONFIG;
      const {
        baseURL,
        replaceDocumentURL
      } = urlConfig;

      // Get all revisions of the document
      const allDocRevDetails = await this.getAllRevisions(droppedObjectDetails["Dropped Revision ID"], droppedObjectDetails?.Type, droppedObjectDetails?.relativePath, headers);
      // console.log(allDocRevDetails?.data?.results[0]?.versions);

      // Map rev with its id
      const revisionMap = new Map<string, string>();
      allDocRevDetails?.data?.results[0]?.versions.forEach((version: any) => {
        revisionMap.set(version.revision, version.identifier);
      });

      // Itterate over the selectedParents

      const floatResponses = await Promise.all(
        selectedParents.map(async (parent) => {
          let connectedChildRev = parent?.connectedChildRev;
          if (connectedChildRev) {
            const revisionId = revisionMap.get(connectedChildRev);
            if (revisionId) {
              const docReplacementBodyCopy = { ...docReplacementBody };
              docReplacementBodyCopy.data[0].id = latestReleasedRevId;
              docReplacementBodyCopy.data[0].relateddata.parents[0].id = parent["Dropped Revision ID"];
              docReplacementBodyCopy.data[1].id = revisionId;
              docReplacementBodyCopy.data[1].relateddata.parents[0].id = parent["Dropped Revision ID"];

              try {
                headers.SecurityContext = `VPLMProjectAdministrator.${droppedObjectDetails["organization"]}.${droppedObjectDetails["Collaborative Space"]}`;
                const response = await axios.put(`${replaceDocumentURL}`, docReplacementBodyCopy, {
                  params: parent?.relationship === "Specification Document" ? replaceSpecDocParams : replaceAttachmentParams,
                  headers,
                  httpsAgent: agent,
                });
                return {
                  success: response?.data?.success,
                  "Success In": parent?.Title
                }
              } catch (error) {
                console.log(error?.response?.data?.error);
                return {
                  errorMessage: error?.response?.data?.error || error?.message || "Unknown Error",
                  "Error in": parent?.Title
                };
              }
            }
          }
        })
      );

      return floatResponses;

    } catch (replaceDocError) {
      // Log the error for debugging purposes
      console.error('Error in floating documents method:', replaceDocError);

      // Return an error response
      const errorMessage = replaceDocError?.response?.data?.message || replaceDocError?.response?.data?.errorReport[0]?.errorMessage || replaceDocError.message || 'Unknown error'
      throw new Error(`Error in floating documents method : ${errorMessage}`);
    }
  }

  private async getAllRevisions(droppedObjectID: string, droppedObjectType: string, relativePath: string, headers: AxiosHeaders): Promise<any> {

    try {
      const {
        getRevGraphReqBody
      } = API_CONFIG;
      const {
        baseURL,
        getAllRevisions
      } = urlConfig;

      // Get all revisions of the document
      getRevGraphReqBody.data[0].id = droppedObjectID;
      getRevGraphReqBody.data[0].identifier = droppedObjectID;
      getRevGraphReqBody.data[0].type = droppedObjectType;
      getRevGraphReqBody.data[0].source = baseURL;
      getRevGraphReqBody.data[0].relativePath = relativePath;

      const objectRevGraphRes = await axios.post(`${getAllRevisions}`, getRevGraphReqBody, {
        headers,
        httpsAgent: agent,
      });
      return objectRevGraphRes;
    } catch (error) {

      // Return an error response
      const errorMessage = error?.response?.data?.message || error?.response?.data?.errorReport[0]?.errorMessage || error.message || 'Unknown error'
      throw new Error(`Error in getting revisions : ${errorMessage}`);
    }
  }

  private async sendRevFloatStatusMail(userEmail: string, respToSend: any, selectedParents: []): Promise<any> {
    try {
      // Send Mail
      const emailController = new EmailController();
      await emailController.sendEmail(userEmail, "Revision Float Status", "Revision Float Done", "");
    } catch (error) {
      throw new Error(`Error in sending mail : ${error.message || 'Unknown error'}`);
    }
  }

  private async floatManufacturingItems(selectedParents: any[], droppedObjectDetails: any, latestReleasedRevId: string, headers: AxiosHeaders): Promise<any> {
    try {
      const {
        mfgParentItemReqBody,
        mfgParentItemURLParams,
        mfgItemUrlEINParams
      } = API_CONFIG;
      const {
        mfgParentItemURL,
        getMfgItemByScopeURL,
        mfgItemURL,
        baseURL
      } = urlConfig;

      // get scope link of connected child rev and latest child rev

      // From the selectedParents array get all the connected child rev IDs
      const connectedChildRevIDs: string[] = Array.from(new Set(selectedParents.map(parent => parent.connectedChildRevID)));

      // Get MfgItem by Scope for previous revisions
      const prevRevMfgResp = await axios.post(
        `${getMfgItemByScopeURL}`,
        connectedChildRevIDs,
        {
          params: { "$mask": "dsmfg:MfgItem.NavigateMask.utc" },
          headers,
          httpsAgent: agent,
        }
      );

      const latestRevMfgResp = await axios.post(
        `${getMfgItemByScopeURL}`,
        [latestReleasedRevId],
        {
          params: { "$mask": "dsmfg:MfgItem.NavigateMask.utc" },
          headers,
          httpsAgent: agent,
        }
      );
      // console.log(prevRevMfgResp?.data?.member);

      // check If scoped link object is not same for connected child rev and latest child rev then that means new rv for manu item exists
      const prevRevMfgItemIds = prevRevMfgResp?.data?.member.map((item: any) => item.mfgItemId);
      const latestRevMfgItemIds = latestRevMfgResp?.data?.member.map((item: any) => item.mfgItemId);

      // Get the latest released revision of child manufacturing item for each org
      const latestRevMfgItemIdPerOrg = await Promise.all(
        latestRevMfgItemIds.map(async (latestMfgChildRevId) => {

          const latestMfgChildDetailsResp = await axios.get(
            `${mfgItemURL}/${latestMfgChildRevId}`,
            {
              headers,
              httpsAgent: agent,
            }
          );

          let mfgRevOrg = latestMfgChildDetailsResp?.data?.member[0]?.organization;
          let mfgRevcollabspace = latestMfgChildDetailsResp?.data?.member[0]?.collabspace;

          return {
            "organization": mfgRevOrg,
            "collabspace": mfgRevcollabspace,
            "id": latestMfgChildRevId
          };
        })
      );
      // console.log(latestRevMfgItemIdPerOrg);
      const unmatchedMfgItemIds = prevRevMfgItemIds.filter((id: string) => !latestRevMfgItemIds.includes(id));

      // console.log('Unmatched Manufacturing Item IDs:', unmatchedMfgItemIds);

      // get the parents of the connected child rev
      const getMfgParentItemReqBody = { ...mfgParentItemReqBody };

      getMfgParentItemReqBody.objectReferences = unmatchedMfgItemIds.map((id: string) => ({
        identifier: id
      }));
      // console.log('getMfgParentItemReqBody:', getMfgParentItemReqBody);
      const mfgItemParentDetails = await axios.post(
        `${mfgParentItemURL}`,
        getMfgParentItemReqBody,
        {
          params: mfgParentItemURLParams,
          headers,
          httpsAgent: agent,
        }
      );

      const parentIdentifiersMap = new Map<string, { relativePath: string, organization: string, collaborativeSpace: string }[]>();

      mfgItemParentDetails?.data?.member.forEach((item: any) => {
        item["dsmfg:MfgItemInstance"].member.forEach((instance: any) => {
          const parentID = instance.parentObject.identifier;
          const relativePath = instance.relativePath;
          const organization = instance.organization;
          const collaborativeSpace = instance.collabspace;

          if (!parentIdentifiersMap.has(parentID)) {
            parentIdentifiersMap.set(parentID, []);
          }
          parentIdentifiersMap.get(parentID)?.push({ relativePath, organization, collaborativeSpace });
        });
      });

      const parentIdentifiers = Array.from(parentIdentifiersMap.entries()).map(([parentID, relativePaths]) => ({
        parentID,
        relativePaths
      }));

      // replace in parents where the EIN and state of the parents matches with the engineering item parent
      const replaceResponses = await Promise.all(
        parentIdentifiers.map(async (parent) => {

          const { parentID, relativePaths } = parent;
          const parentResponse = await axios.get(
            `${mfgItemURL}/${parentID}`,
            {
              params: mfgItemUrlEINParams,
              headers,
              httpsAgent: agent,
            }
          );

          let parentDetailsResp = parentResponse?.data?.member[0];
          parentDetailsResp.relativePaths = relativePaths;
          parentDetailsResp.id = parentID;
          return parentDetailsResp;
        })
      );

      // console.log("replaceResponses",replaceResponses);
      const replaceMfgItemsBase: any[] = [];

      replaceResponses.forEach((replaceResponse) => {
        const ein = replaceResponse["dsmfg:EnterpriseReference"]?.partNumber;
        const state = replaceResponse.state;

        selectedParents.forEach((parent) => {
          if (parent.EIN === ein && parent["Maturity State"].replace(/\s|_/g, '').toLowerCase() === state.replace(/\s|_/g, '').toLowerCase()) {
            replaceMfgItemsBase.push(replaceResponse);
          }
        });
      });

      const replaceMfgItemsResponses = await Promise.all(
        replaceMfgItemsBase.map(async (replaceParentItem) => {
          const { relativePaths, name } = replaceParentItem;
          const replaceResponses = await Promise.all(
            relativePaths.map(async (relativePathObj) => {
              const { relativePath, collaborativeSpace, organization } = relativePathObj;
              const latestRevMfgItemIdOrg = latestRevMfgItemIdPerOrg.find(item => item.collabspace === collaborativeSpace && item.organization === organization)?.id;
              const replaceBody = {
                referencedObject: {
                  identifier: latestRevMfgItemIdOrg
                }
              };
              headers.SecurityContext = `VPLMProjectAdministrator.${organization}.${collaborativeSpace}`;
              try {
                const response = await axios.post(`${baseURL}${relativePath}/replace`, replaceBody, {
                  headers,
                  httpsAgent: agent,
                });
                return response.data;
              } catch (error) {
                return {
                  errorMessage: error.message,
                  "Error in": `Replacement failed in  ${relativePath}`
                };
              }
            })
          );
          return {
            name,
            replaceResponses
          };
        })
      );
      return replaceMfgItemsResponses;

    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.response?.data?.errorReport[0]?.errorMessage || error.message || 'Unknown error'
      throw new Error(`Error in replacing Manufacturing revisions : ${errorMessage}`);
    }
  }
}

export default RevFloatService;
