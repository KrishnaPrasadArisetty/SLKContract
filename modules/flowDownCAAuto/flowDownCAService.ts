import { Request, Response } from "express";
import AuthService from "../APIServices/authentication/authService";
import API_CONFIG from "../APIServices/config/APIConfig";
import axios, { AxiosHeaders } from "axios";
import { urlConfig } from "../APIServices/config/urlConfig";
import authConfig, {
  securityContextConfig
} from "../APIServices/config/authConfig";
import { Console, error } from "console";
import CAService from "../APIServices/caDetails/caService";


const caService = new CAService();

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

interface updateMRInput {
  productPhysicalId: string;
  changeID: string;
  ChangeName: string;
  productName: string;
  productType: string;
  productPlantName: string;
  productProductionTypeChanged: boolean;
  productLatestProductionValue: string;
  productMaterialType: string;
  isMaterialTypeInOptional: boolean;
  isMaterialTypeInNotOptional: boolean;
}
class getFlowDownCAService {
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
    console.log(`csrfToken: ${JSON.stringify(csrfToken)}`);
    return csrfToken;
  }

  private async fetchCaDetails(
    caId: any,
    headers: AxiosHeaders
  ): Promise<any> {
    try {
      const { caDetailsURL } = urlConfig;
      const { caUrlParams } = API_CONFIG;
      console.log(`====headers: ${JSON.stringify(headers)}`);
      const response = await axios.get(`${caDetailsURL}/${caId}`, {
        params: caUrlParams,
        headers,
        httpsAgent: agent,
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data && error.response.data.errorMessage) {
        console.error(`Error fetching CA details for ID ${caId}: ${error.response.data.errorMessage}`);
      } else {
        console.error("An unknown error occurred:", error);
      }
      throw error;
    }
  }

  private async fetchClassificationAttribute(
    proposedItem: any,
    headers: AxiosHeaders,
  ): Promise<any> {
    try {
      const { engClassificationNewURL } = urlConfig;
      const { engClassificationURLParams } = API_CONFIG
      const response = await axios.get(`${engClassificationNewURL}/${proposedItem}`,
        {
          params: engClassificationURLParams,
          headers,
          httpsAgent: agent,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching Classification Attribute details for item ${proposedItem}:`,error);
      return null;
    }
  }

  private async fetchClassName(
    proposedClassId: any,
    headers: AxiosHeaders,
  ): Promise<any> {
    try {
      const { engClassificationIdURL } = urlConfig;
      const response = await axios.get(`${engClassificationIdURL}/${proposedClassId}`,
        {
          headers,
          httpsAgent: agent,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching ClassName for item: ${proposedClassId}:`,error);
      return "";
    }
  }

  private async getPlantInfo(
    plantName: any,
    headers: AxiosHeaders
  ): Promise<void> {
    try {
      const { companyUrlParams, companyPlantsUrlParams } = API_CONFIG;
      const { companyUrl, companyPlantsUrl } = urlConfig;
      //get company
      const companyData = await axios.get(`${companyUrl}`, {
        params: companyUrlParams,
        headers,
        httpsAgent: agent,
      });
      const companyId = companyData?.data?.data[0]?.id;
      //get Plants
      const plantsData = await axios.get(`${companyPlantsUrl}/${companyId}/plants`,
        {
          params: companyPlantsUrlParams,
          headers,
          httpsAgent: agent,
        }
      );
      const plantData = plantsData.data.data;
      const foundPlant = plantData && plantData.find((item) => item.title === plantName);
      return foundPlant?.name || "";
    } catch(error) {
        console.error(`Error fetching PlantInfo for item: ${plantName}: `,error);
        throw error;
    }
  }

  private async createFlowDownCA(
    headers: AxiosHeaders,
    getName: string,
    getKey: string,
    getCollabSpace: string,
    getDesc: string,
    getSeverity: string
  ): Promise<any> {
    try {
      const { createCAURL } = urlConfig;
      const payload = {
        policy: "Change Action",
        description: getDesc,
        type: "Change Action",
        title: getName,
        name: getName,
        severity: getSeverity,
      };
      console.log(`---CreateFDCAPayload: ${JSON.stringify(payload)}`);
      console.log(`---CreateFDCAHeader: ${JSON.stringify(headers)}`);

      const getPlantNumber = await this.getPlantInfo(getKey, headers);
      headers.SecurityContext = headers.SecurityContext.replace(headers.SecurityContext?.split(".")[1],getPlantNumber);
      headers.SecurityContext = headers.SecurityContext.replace(headers.SecurityContext?.split(".")[2],getCollabSpace);
    
      console.log(`---CreateFDCAHeaderAfterModification: ${JSON.stringify(headers)}`);

      const response = await axios.post(`${createCAURL}`, payload, {
        headers,
        httpsAgent: agent,
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data && error.response.data.errorMessage) {
        console.error(`Error while creating FDCA for plant ${getName}: ${error.response.data.errorMessage}`);
      } else {
        console.error("An unknown error occurred:", error);
      }
      throw error;
    }
  }

  private async createFlowDownCANew(
    headers: AxiosHeaders,
    fdcaName: string,
    fdcaTitle: string,
    upstreamCaDesc: string,
    upstreamCaSeverity: string
  ): Promise<any> {
    try {
      const { createCAURL } = urlConfig;
      const payload = {
        policy: "Change Action",
        description: upstreamCaDesc,
        type: "Change Action",
        title: fdcaTitle,
        name: fdcaName,
        severity: upstreamCaSeverity,
      };
      console.log(`---CreateFDCAPayload: ${JSON.stringify(payload)}`);
      console.log(`---CreateFDCAHeader: ${JSON.stringify(headers)}`);

      const iterationHeaders = new AxiosHeaders({
        ...headers, // Copy the original headers
        SecurityContext: headers.SecurityContext.replace(headers.SecurityContext?.split(".")[0],securityContextConfig.LeaderCredential)
      });
      console.log(`---CreateFDCAHeaderAfterModification: ${JSON.stringify(iterationHeaders)}`);

      const response = await axios.post(`${createCAURL}`, payload, {
        headers: iterationHeaders,
        httpsAgent: agent,
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data && error.response.data.errorMessage) {
        console.error(`Error while creating FDCA of ${fdcaName}: ${error.response.data.errorMessage}`);
      } else {
        console.error("An unknown error occurred:", error);
      }
      throw error;
    }
  }

  private async fetchPhysicalProductDetails(getPhysicalProductId: any, headers: AxiosHeaders, itemType: string): Promise<any> {
    try {
      console.log(`----Headers of fetchPhysicalProductDetails: ${JSON.stringify(headers)}`);
      const { getPhysicalProductInfoURL,getRawMaterialInfoURL } = urlConfig;

      const urlToFetchProductDetails = itemType === 'Raw_Material' ? `${getRawMaterialInfoURL}` : `${getPhysicalProductInfoURL}`;

      const response = await axios.get(`${urlToFetchProductDetails}/${getPhysicalProductId}`,
        { params: { "$mask": "dsmveng:EngItemMask.Details" },
          headers,
          httpsAgent: agent,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error while fetching Physical Product details for ID ${getPhysicalProductId}: ${error}`);
      throw error;
    }
  }

  private async modifyCA(
    headers: AxiosHeaders,
    upstreamCaId: any,
    flowdownCaId: any
  ): Promise<any> {
    try {
      const { modifyCaURL } = urlConfig;
      const fdCaDetailsResponse = await this.fetchCaDetails(flowdownCaId, headers);
      const payload = {
        cestamp: fdCaDetailsResponse.cestamp,
        add: [
            {
              contexts: [
                  {
                      type: "Change Action",
                      identifier: flowdownCaId,
                      relativePath: `/resources/v1/modeler/dslc/changeaction/${flowdownCaId}`
                  }
              ]
          },
          {
            isFlowDownOf: [
              {
                type: "Change Action",
                identifier: upstreamCaId,
                relativePath: `/resources/v1/modeler/dslc/changeaction/${upstreamCaId}`,
              }
            ]
          }
        ]
      };
      const response = await axios.patch(`${modifyCaURL}/${flowdownCaId}`,
        payload,
        {
          headers,
          httpsAgent: agent,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error while connecting Upstream CA with flowDownCA: ${flowdownCaId}:`,error.message);
      throw error;
    }
  }

  private async addingOwnerAsApprover(
    getFdcaId: string,
    headers: AxiosHeaders,
    upstreamCaId: any,
  ): Promise<any> {
    try {
      const { modifyCaURL, caDetailsURL } = urlConfig;
      const { caUrlParams } = API_CONFIG;
      const fdcaDetailsResponse = await axios.get(`${caDetailsURL}/${getFdcaId}`, {
        params: caUrlParams,
        headers,
        httpsAgent: agent,
      });
      const payload = {
        cestamp: fdcaDetailsResponse.data.cestamp,
        "add": [
            {
                "members": [
                    {
                        "reviewers": [
                            "e1331143" //Here it should be replaced by Upstream CA owner
                        ]
                    }
                ]
            }
        ],
        "remove": [
            {
                "members": [
                    {
                        "followers": [
                          fdcaDetailsResponse.data.owner
                        ]
                    }
                ]
            }
        ]
      };
      const response = await axios.patch(`${modifyCaURL}/${upstreamCaId}`,
        payload,
        {
          headers,
          httpsAgent: agent,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error while adding owner as approver for: ${getFdcaId}:`,error);
      return null;
    }
  }

  private async modifyCAPrivate(
    headers: AxiosHeaders,
    upstreamCaId: any,
    flowdownCaId: any
  ): Promise<any> {
    try {
      const { modifyCaPrivateURL } = urlConfig;
      const payload = {
        originChangeActionId: `pid:${upstreamCaId}`,
        receivingChangeActionId: `pid:${flowdownCaId}`,
      };
      const response = await axios.put(`${modifyCaPrivateURL}`, payload, {
        headers,
        httpsAgent: agent,
      });
      return response.data;
    } catch (error) {
      console.error(`Error while connecting Upstream CA with flowDownCA: ${flowdownCaId}:`,error.message);
      throw error;
    }
  }

  private async callMrAutomation(
    headers: AxiosHeaders,
    payloadOfMrAutomation: any
  ): Promise<any> {
    try {
      const { mrAutomationURL } = urlConfig;
      const payload = payloadOfMrAutomation;
      const response = await axios.post(`${mrAutomationURL}`, payload, {
        headers,
        httpsAgent: agent,
      });

      return response.data;
    } catch (error) {
      console.log(`Error from the MR Automation: ${error}`);
      throw error;
    }
  }

  private async connectMbomItemToFdca(
    getFdcaId: any,
    getManufacturingItemId: any,
    getManufacturingItemType: any,
    headers: AxiosHeaders,
    getCestamp: any,
    getConnectMbomItemToFdcaURL: string
  ): Promise<any> {
    try {
      const payload = {
        cestamp: getCestamp,
        add: [
          {
            proposedChanges: [
              {
                where: {
                  source:
                    "https://OI000186152-us1-space.3dexperience.3ds.com/enovia",
                  type: getManufacturingItemType,
                  identifier: getManufacturingItemId,
                  relativePath: `/resources/v1/modeler/dsmfg/dsmfg:MfgItem/${getManufacturingItemId}`,
                },
                target: "CurrentVersion",
              },
            ],
          },
        ],
      };
      console.log(`---payload of connectMbomItemToFdca: ${JSON.stringify(payload)}`);
      const response = await axios.patch(`${getConnectMbomItemToFdcaURL}/${getFdcaId}`,
        payload,
        {
          headers,
          httpsAgent: agent,
        }
      );
      return response.data;
    } catch (error) {
      if (
        error.response && error.response.data && error.response.data.errorMessage) {
        const errorMessage = error.response.data.errorMessage;
        console.error(`ConnectMbomItemToFdca error message: ${errorMessage}`);
      } else {
        console.error("An unknown error occurred:", error);
      }
      return null;
    }
  }

  private async promoteFdcaToInWork(
    getFdcaId: any,
    headers: AxiosHeaders,
    getUpdateFdcaToInWorkURL: string
  ): Promise<any> {
    try {
      const payload = {
        data: [
          {
            id: getFdcaId,
            nextState: "In Work",
          },
        ],
      };
      const response = await axios.post(`${getUpdateFdcaToInWorkURL}`,
        payload,
        {
          headers,
          httpsAgent: agent,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error while promoting FDCA to In-Work for flowDownCA: ${getFdcaId}: `,error);
      return null;
    }
  }

  private async updateFdcaStatusAsIgnored(
    getFdcaId: any,
    headers: AxiosHeaders,
    getUpdateFdcaAsIgnored: string
  ): Promise<any> {
    try {
      const payload = {};
      const response = await axios.post(`${getUpdateFdcaAsIgnored}`, payload, {
        headers,
        httpsAgent: agent,
      });
      return response.data;
    } catch (error) {
      console.error(`Error while updating FDCA status as Ignored for flowDownCA: ${getFdcaId}: `,error);
      return null;
    }
  }

  public async updatePartPlantMRData( 
    req: Request,
    res: Response
  ): Promise<boolean> {
    try {
      const requestData = req.body;
      console.log("updatePartPlantMRData");
      //logic to update the part plant MR data
      res.send(true);
    } catch (error) {}
    return true;
  }

  private async transferOwnershipOfMfgItems(upstreamCaDataDetails: any, headers: AxiosHeaders, mfgItemArray: any): Promise<any> {
    try {
      const { updateOwnerURL } = urlConfig;
      const payload = {
        "owner": "emrserviceuser",
        "organization": upstreamCaDataDetails.organization,
        "collabspace": upstreamCaDataDetails.collabSpace,
        "data": mfgItemArray
      }
      console.log("====payload of transferOwnershipOfMfgItems", JSON.stringify(payload));
      const response = await axios.post(`${updateOwnerURL}`, payload, {
        headers,
        httpsAgent: agent,
      });

      console.log("=======response of transferOwnershipOfMfgItems", JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      const errorMessage = error?.response?.data;
      console.error(`Error while transfer ownership of mfgItem: ${JSON.stringify(errorMessage)}`);
      throw error;
    }
  }

  private async transferOwnershipOfCA(upstreamCaDataDetails: any, headers: AxiosHeaders): Promise<any> {
    try {
      const { updateOwnerURL } = urlConfig;
      const payload = {
        "owner": "emrserviceuser",
        "organization": upstreamCaDataDetails.organization,
        "collabspace": upstreamCaDataDetails.collabSpace,
        "data": [
          {
            "id": upstreamCaDataDetails.flowDownCaId,
          }
        ]
      }
      console.log("====payload of transferOwnershipOfCA", JSON.stringify(payload));
      const response = await axios.post(`${updateOwnerURL}`, payload, {
        headers,
        httpsAgent: agent,
      });
      console.log("=======response of transferOwnershipOfCA", JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      const errorMessage = error?.response?.data?.errorMessage;
      console.error(`Error while transfer ownership for flow down CA : ${errorMessage},${upstreamCaDataDetails.flowDownCaId}`);
      throw error;

    }
  }

  private async removeMfgCAConnectionFromEngCA(upstreamCaDataDetails: any, headers: AxiosHeaders): Promise<any> {
    try {
      const { modifyCaURL } = urlConfig;
      const mfgCaDetailsResponse = await this.fetchCaDetails(upstreamCaDataDetails.flowDownCaId, headers);
      const payload = {
        "cestamp": mfgCaDetailsResponse.cestamp,
        "remove": [
            {
                "isFlowDownOf": [
                    {
                        "source": process.env.SAAS_BASE_URL,
                        "type": "Change Action",
                        "identifier": upstreamCaDataDetails.id,
                        "relativePath": `/resources/v1/modeler/dslc/changeaction/${upstreamCaDataDetails.id}`
                    }
                ]
            }
        ]
      };
      //console.log("====payload of removeMfgCAConnectionFromEngCA", JSON.stringify(payload));
      //console.log(`====URL of removeMfgCAConnectionFromEngCA: ${modifyCaURL}/${upstreamCaDataDetails.flowDownCaId}`);
      const response = await axios.patch(`${modifyCaURL}/${upstreamCaDataDetails.flowDownCaId}`, 
      payload, 
      {
        headers,
        httpsAgent: agent,
      });
      console.log("======response of removeMfgCAConnectionFromEngCA", JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      const errorMessage = error?.response?.data?.errorMessage;
      console.error(`Error while remove connection between EngCA and MfgCA : ${errorMessage}`);
      throw error;

    }
  }

  private async getScopeLink(mfgItemId: string, headers: AxiosHeaders, mfgItemURL: string): Promise<any> {
    try {
      const response = await axios.get(`${mfgItemURL}/${mfgItemId}/dsmfg:ScopeEngItem`, { headers, httpsAgent: agent });
      return response?.data?.member?.[0];
    } catch (error) {
      console.error(`Error get scope link for ${mfgItemId}:`, error?.response?.data);
      throw error;
    }
  }

  private async removeMfgInstance(mfgItemInstanceId: string, headers: AxiosHeaders, flowDownCAId: string): Promise<any> {
    try {
        const { removeMfgInstanceURL } = urlConfig;
        console.log("===Removing mfg Instance link for", mfgItemInstanceId);
        const modifiedHeaders = { ...headers, 'DS-Change-Authoring-Context': `pid:${flowDownCAId}` };
        console.log("===Removing mfg Instance link modifiedHeaders", modifiedHeaders);
        console.log("===Removing mfg Instance link URL", removeMfgInstanceURL, mfgItemInstanceId);

        const response = await axios.post(`${removeMfgInstanceURL}`, [mfgItemInstanceId], { headers: modifiedHeaders, httpsAgent: agent });
        console.log(`===response for remove mfg Instance link for InstanceId:${mfgItemInstanceId}:: ${response?.data}`);
        console.log(response?.data);

        return response?.data;
    } catch (error) {
        console.error(`Error removing mfg instance link for ${mfgItemInstanceId}:`, error);
        throw error; // Re-throw the error after logging it
    }
  }

  private async detachScopeLink(mfgItemId: any, headers: AxiosHeaders, engItemId: any, flowDownCAId: string): Promise<any> {
    try {
      const { mfgItemURL } = urlConfig;
      const payload = {
        "identifier": engItemId,
        "source": "https://oi000186152-us1-acspace.3dexperience.3ds.com/3DSpace",
        "relativePath": `/resources/v1/modeler/dseng/dseng:EngItem/${engItemId}`,
        "type": "VPMReference",
        "syncEIN": true
      };
      const modifiedHeaders = { ...headers, 'DS-Change-Authoring-Context': `pid:${flowDownCAId}` };
      console.log(`==========modifiedHeaders to detachScopeLink: ${JSON.stringify(modifiedHeaders)}`);
      console.log(`==========payload to detachScopeLink: ${JSON.stringify(payload)}`);

      const response = await axios.post(`${mfgItemURL}/${mfgItemId}/dsmfg:ScopeEngItem/detach`, payload, { headers: modifiedHeaders, httpsAgent: agent });
      console.log("response of detachScopeLink", response?.data);
      return response?.data;
    } catch (error) {
      const errorMessage = error?.response?.data?.message;
      console.error(`Error detachScopeLink for mfgId: ${mfgItemId}: ${errorMessage}`);
      throw error;
    }
  }

  private async deleteMfgItem(mfgItemId: any, headers: AxiosHeaders): Promise<any> {
    try {
      const { mfgItemURL } = urlConfig;
      console.log(`==========header to deleteMfgItem: ${JSON.stringify(headers)}`);
      console.log(`==========url to deleteMfgItem: ${mfgItemURL}`);
      console.log(`==========mfgItemId to deleteMfgItem: ${mfgItemId}`);
      headers.SecurityContext = headers.SecurityContext.replace(headers.SecurityContext?.split('.')[0], 'VPLMProjectAdministrator');
      const response = await axios.delete(`${mfgItemURL}/${mfgItemId}`, { headers, httpsAgent: agent });
      console.log("response of deleteMfgItem", response.data);
      headers.SecurityContext = headers.SecurityContext.replace(headers.SecurityContext?.split('.')[0], 'VPLMProjectLeader');
      return response?.data;
    } catch (error) {
      const errorMessage = error?.response?.data?.message;
      console.error(`Error deleting of mfgId: ${mfgItemId}: ${errorMessage}`);
      throw error;
    }
  }

  // Used private API to search routes base on the mfgCA
  private async searchRoutePrivate(mfgCaId: any, headers: AxiosHeaders): Promise<any> {
    try {
      const { searchRoutePrivateURL } = urlConfig;
      console.log(`==========MfgCA Id  to search listed Routes: ${mfgCaId}`);
      const response = await axios.get(`${searchRoutePrivateURL}`, 
      { params: { "whereUsed": mfgCaId, 
        "tenant": "OI000186152", 
        "timestamp": "1742450358779", 
        "xrequestedwith": "xmlhttprequest" },
        headers, 
        httpsAgent: agent });
      //console.log("response of searchRoutePrivate: ", JSON.stringify(response.data));
      return response?.data;
    } catch (error) {
      const errorMessage = error?.response?.data?.message;
      console.error(`Error when search Routes for mfgCA : ${mfgCaId}: ${errorMessage}`);
      throw error;
    }
  }

  private async removeProposedChangeItemsFromMfgCA(mfgItemInternalId: any, headers: AxiosHeaders, mfgCaId: string): Promise<any> {
    try {
      const { removeProposedChangeURL } = urlConfig;
      //console.log(`==========header to removeProposedChangeItemsFromMfgCA: ${JSON.stringify(headers)}`);
      //console.log(`==========mfgItemInternalId to removeFromProposedChange: ${mfgItemInternalId}`);
      const mfgCaDetailsResponse = await this.fetchCaDetails(mfgCaId, headers);
      const paylod = {
        "cestamp": mfgCaDetailsResponse.cestamp,
        "remove": [
            {
                "proposedChanges": [
                  mfgItemInternalId
                ]
            }
        ]
      };
      //console.log(`==========paylod of removeProposedChangeItemsFromMfgCA: ${JSON.stringify(paylod)}`);
      const response = await axios.patch(`${removeProposedChangeURL}/${mfgCaId}`,paylod,{ headers, httpsAgent: agent });
      console.log("response of removeProposedChangeItemsFromMfgCA", response.data);
      return response?.data;
    } catch (error) {
      const errorMessage = error?.response?.data?.message;
      console.error(`Error removing of mfgItemInternalId: ${mfgItemInternalId}: ${errorMessage}`);
      throw error;
    }
  }

  private async searchRoute(
    routeId: string,
    headers: AxiosHeaders,
  ): Promise<any> {
    try {
      const { deleteRouteURL } = urlConfig;
      const payload = {
        "data": [
          {
            "id": routeId,
          }
        ]
      };
      console.log(`==========header to deleteRoute: ${JSON.stringify(headers)}`);
      console.log(`==========payload to deleteRoute: ${JSON.stringify(payload)}`);
      console.log(`==========RouteId to deleteRoute: ${routeId}`);

      const response = await axios.post(`${deleteRouteURL}`, payload, {
        headers,
        httpsAgent: agent,
      });
      console.log(`==========Response of deleteRoute: ${response.data}`);
      return response.data;
    } catch (error) {
     console.error(`Error when deleting Route:`, error?.response?.data);
      //throw error?.response?.data;
      return null;
    }
  }

  private async deleteRoute(
    routeId: string,
    headers: AxiosHeaders,
  ): Promise<any> {
    try {
      //console.log(`Came here4`);
      const { deleteRouteURL } = urlConfig;
      const payload = {
        "data": [
          {
            "id": routeId,
          }
        ]
      };
      console.log(`==========header to deleteRoute: ${JSON.stringify(headers)}`);
      console.log(`==========payload to deleteRoute: ${JSON.stringify(payload)}`);
      console.log(`==========RouteId to deleteRoute: ${routeId}`);

      const response = await axios.post(`${deleteRouteURL}`, payload, {
        headers,
        httpsAgent: agent,
      });
      console.log(`======Response of deleteRoute: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
     console.error(`Error when deleting Route:`, error?.response?.data);
      //throw error?.response?.data;
      return null;
    }
  }

  private async deleteCa(
    caId: string,
    headers: AxiosHeaders,
  ): Promise<any> {
    try {
      const { deleteCaURL } = urlConfig;
      console.log(`==========header to deleteCa: ${JSON.stringify(headers)}`);
      console.log(`==========CA to deleteCa: ${caId}`);

      const response = await axios.delete(`${deleteCaURL}/${caId}`, {
        headers,
        httpsAgent: agent,
      });
      console.log(`======Response of deleteCa: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
     console.error(`Error when deleting CA:`, error?.response?.data);
      //throw error?.response?.data;
      return null;
    }
  }


  public async getFlowDownCADetails(req: Request, res: Response): Promise<void> {
    try {
      console.time('API Execution Time');
      const {searchCaURL, getPhysicalProductInfoURL, baseURL, getGraphURL}=urlConfig;
      const csrfTokenAndHeaders = await this.getAuthenticationToken();
      const headers: AxiosHeaders = {
        Cookie: csrfTokenAndHeaders.Cookie,
        SecurityContext: csrfTokenAndHeaders.SecurityContext,
        ENO_CSRF_TOKEN: csrfTokenAndHeaders.ENO_CSRF_TOKEN,
        "Content-Type": csrfTokenAndHeaders["Content-Type"],
      };

      interface MulesoftData {
        CAID: string;
        CABussinessGroup: string;
        CAState: string;
        CADescription: string;
        CAOwner: string;
      }

      interface UpstreamCAData {
        name: string;
        title: string;
        description: string;
        severity: string;
        owner: string;
        organization: string;
        collabSpace: string;
      }

      //create an object to store proposedItems and thier classification attributes details
      //Here one physical product can assigned to multiple plants(Class) like MMB,MMC,MVO,ISV plants. Here 'key' is pysical product Id
      let proposedItemsDetails: {
        [key: string]: {
          classificationAttributes: {
            ClassId: string;
            MbomValue: boolean;
            ProposedChange: any;
            ClassName: string;
          }[];
        };
      } = {};

      const mulesoftData: MulesoftData = req.body;
      console.log(`---RECIEVED request from MuleSoft: CAId: ${mulesoftData.CAID}:: Timestamp: ${new Date().toLocaleString()}`);
      const caDetailsResponse = await this.fetchCaDetails(mulesoftData.CAID, headers);

      const { name, title, description, severity, owner, organization, collabSpace } = caDetailsResponse;
      const upstreamCaData: UpstreamCAData = { name, title, description, severity, owner, organization, collabSpace };
      const connectedFdcaId = caDetailsResponse.isFlowedDownIn[0]?.identifier;

      const plantName: any = upstreamCaData?.organization;
      headers.SecurityContext = headers.SecurityContext.replace(headers.SecurityContext?.split('.')[1], plantName);
      headers.SecurityContext = headers.SecurityContext.replace(headers.SecurityContext?.split('.')[2], upstreamCaData?.collabSpace);

      const framedFdcaName = `MCO-${upstreamCaData.name.split('-')[2]}`;
      const searchCaResponse = await axios.get(`${searchCaURL}?`, {params:{'$searchStr':`name:${framedFdcaName}`}, headers, httpsAgent: agent });
      console.log(`========searchCaResponse: ${JSON.stringify(searchCaResponse.data)}`);
      const createdFdcaId = searchCaResponse.data.changeAction[0]?.identifier;
      console.log(`========createdFdcaId: ${createdFdcaId}`);
        
      //Fetch and store all proposedChange Items from caDetailsResponse, the result will stored in an array (proposedChangeItems)
      const proposedChangeItems = caDetailsResponse?.proposedChanges?.map(
        (item: any) => ({
          identifier: item.where.identifier,
          proposedChange: item,
        })
      );

      let foundValidClassificationAttribute = false;

      //Loop through all proposedItem and store thier classification attribute properties into 'proposedItemsDetails'
      for (const pcItem of proposedChangeItems) {
        const proposedItem = pcItem.identifier;
        let classificationAttributes: any;
        if(pcItem?.proposedChange?.target == 'NewVersion') {
          console.log("Came here2");
          const payload = {
            "data": [
              {
                id: proposedItem,
                identifier: proposedItem,
                type: pcItem?.proposedChange?.where?.type,
                source: baseURL,
                relativePath: `/resources/v1/modeler/dseng/dseng:EngItem/${proposedItem}`
              }
            ]
          }
          console.log("check for new version");
          //Get the new version engitem by using Graph API
          const newVersionEngItemDetails = await axios.post(
            `${getGraphURL}`,
            payload,
            {
              headers,
              httpsAgent: agent,
            }
          );

          let newVersionEngItem = newVersionEngItemDetails?.data?.results[0]?.versions?.filter((item: any) => item?.ancestors);
          console.log("newVersionEngItem: ", newVersionEngItem);

          const classificationAttrResOfNewVersion = await this.fetchClassificationAttribute(newVersionEngItem[0]?.identifier,headers);
          classificationAttributes = classificationAttrResOfNewVersion?.member?.[0]?.ClassificationAttributes;

          if (classificationAttributes?.totalItems <= 0) {
            console.log(`No classificationAttributes found for proposedItem newVersion: ${newVersionEngItem}`);
            //Then look into the classification attributes of previous revision
            const classificationAttrResOfPrevVersion = await this.fetchClassificationAttribute(proposedItem,headers);
            classificationAttributes = classificationAttrResOfPrevVersion?.member?.[0]?.ClassificationAttributes;
            if (classificationAttributes?.totalItems <= 0) {
              console.log(`No classificationAttributes found for proposedItem PrevVersion: ${proposedItem}`);
              continue; // Skip to the next iteration if ClassificationAttribute is undefined
            } else {
              foundValidClassificationAttribute = true;
              const classificationAttributeData: {
                ClassId: string;
                MbomValue: boolean;
                ProposedChange: any;
                ClassName: string; // Add an optional ClassName property
              }[] = [];

              console.log("Came here1");
              console.log(`=======pcItem?.proposedChange?.where?.type: ${pcItem?.proposedChange?.where?.type}`);

              const physicalProductDetailsResponse = await this.fetchPhysicalProductDetails(proposedItem, headers, pcItem?.proposedChange?.where?.type);
              classificationAttributes.member.forEach((member: any) => {
                const mbomValue = physicalProductDetailsResponse.member[0]["dseno:EnterpriseAttributes"].EMR_hasMBOM;
                //To check 'PlantAssignmentClass' attribute is present and value shold be 'true'
                const plantAssignmentClass = member.Attributes.find(attr => attr.name === "PlantAssignmentClass" && attr.value === true);
                if (plantAssignmentClass) {
                  classificationAttributeData.push({
                    ClassId: member.ClassID,
                    MbomValue: mbomValue,
                    ProposedChange: pcItem.proposedChange,
                    ClassName: ''
                  });
                }
              });

              console.log("classificationAttributeData::::", classificationAttributeData);

              //Update the 'Seq' and 'PlantStatus' classificationAttributes to newVersionEngItem - START
              const { classifyProdToClassURL } = urlConfig;
              /* const classifyClassToProductPromises = classificationAttributeData.map(async (item) => {
                if (item.ClassId) {
                  try {
                    const payload = {
                      "ClassID": item.ClassId,
                      "ObjectsToClassify": [
                        {
                          "source": baseURL,
                          "type": "dseng:EngItem",
                          "identifier": newVersionEngItem[0]?.identifier,
                          "relativePath": `/resources/v1/modeler/dseng/dseng:EngItem/${newVersionEngItem[0]?.identifier}`
                        }
                      ]
                    };
                    console.log(`===payload of classifyClassToProductResponse: ${JSON.stringify(payload)}`);
                    console.log(`===headers of classifyClassToProductResponse: ${JSON.stringify(headers)}`);
                    headers.SecurityContext = 'VPLMAdmin.Company Name.Default';
                    console.log(`===headers of classifyClassToProductResponse After: ${JSON.stringify(headers)}`);


                    const classifyClassToProductResponse = await axios.post(
                      `${classifyProdToClassURL}`,
                      payload,
                      {
                        headers,
                        httpsAgent: agent,
                      }
                    );
                    console.log(`===classifyClassToProductResponse: ${JSON.stringify(classifyClassToProductResponse.data)}`);
                  } catch (error) {
                    console.error(`Error when classifying class to product ${newVersionEngItem[0]?.identifier}:`, error);
                    throw error;
                  }
                }
              });
              await Promise.all(classifyClassToProductPromises); */

              //Above is the process of classifyClassToProduct using Promise.all, which is not working

              for (const item of classificationAttributeData) {
                if (item.ClassId) {
                  try {
                    const payload = {
                      "ClassID": item.ClassId,
                      "ObjectsToClassify": [
                        {
                          "source": baseURL,
                          "type": "dseng:EngItem",
                          "identifier": newVersionEngItem[0]?.identifier,
                          "relativePath": `/resources/v1/modeler/dseng/dseng:EngItem/${newVersionEngItem[0]?.identifier}`
                        }
                      ]
                    };
                    console.log(`===payload of classifyClassToProductResponse: ${JSON.stringify(payload)}`);
                    console.log(`===headers of classifyClassToProductResponse: ${JSON.stringify(headers)}`);

                    const classifyClassToProductResponse = await axios.post(
                      `${classifyProdToClassURL}`,
                      payload,
                      {
                        headers,
                        httpsAgent: agent,
                      }
                    );
                    console.log(`===classifyClassToProductResponse: ${JSON.stringify(classifyClassToProductResponse.data)}`);
                  } catch (error) {
                    console.error(`Error when classifying class to product ${newVersionEngItem[0]?.identifier}:`, error);
                    throw error;
                  }
                }
              }

              const classificationAttrResOfNewVersionUpdated = await this.fetchClassificationAttribute(newVersionEngItem[0]?.identifier,headers);
              const classificationAttributesNewVersionUpdated = classificationAttrResOfNewVersionUpdated?.member?.[0]?.ClassificationAttributes.member || [];

              const categorizationAttributePayload = classificationAttributesNewVersionUpdated
              .filter(classItem =>
                classItem.Attributes.some(attr => attr.name === "PlantAssignmentClass" && attr.value === true)
              )
              .map(classItem => {
                const seqAttr = classItem.Attributes.find(attr => attr.name === "Seq");
                //const updatedSeq = seqAttr ? String(Number(seqAttr.value) + 1) : "1";
                const updatedSeq = String(Number(seqAttr.value) + 1)
            
                return {
                  classId: classItem.ClassID,
                  attributes: {
                    Seq: updatedSeq
                  }
                };
              });  

              console.log("===Matching ClassID and Seq:", JSON.stringify(categorizationAttributePayload));

              //update the Classification Attributes (Seq) to PhysicalProd
              const { updateClassAttributeForPhysicalProdNewURL } = urlConfig;
              const payload = [
                {
                  referencedObject: {
                    source: process.env.SAAS_BASE_URL,
                    type: "dslib:CategorizationClassifiedItem",
                    identifier: newVersionEngItem[0]?.identifier,
                    relativePath: `resources/v1/modeler/dslib/dslib:CategorizationClassifiedItem/${newVersionEngItem[0]?.identifier}`
                  },
                  categorizationAttributes: categorizationAttributePayload
                }
              ];
              
              console.log(`====payload of update ClassAttribute For PhysicalProd: ${JSON.stringify(payload)}`); 
                            
              try {
                const response = await axios.post(updateClassAttributeForPhysicalProdNewURL, payload, {
                  headers,
                  httpsAgent: agent,
                });
                console.log("Response of updateClassAttributeForPhysicalProd:", response.data);
              } catch (error) {
                console.error("Error while updateClassAttributeForPhysicalProd:", error);
              }
              //Update the 'Seq' and 'PlantStatus' classificationAttributes to newVersionEngItem - END

              const fetchClassNamePromises = classificationAttributeData.map(async (item) => {
                if (item.ClassId) {
                  try {
                    const classNameResponse = await this.fetchClassName(item.ClassId, headers);
                    const className = classNameResponse?.member?.[0]?.title.replace(/^Plant\s*/, "");
                    if (className) {
                      item.ClassName = className; // Update the item with ClassName
                    } else {
                      console.log(`ClassName not found for ClassID: ${item.ClassId}`);
                    }
                  } catch (error) {
                    console.error(`Error fetching ClassName for ClassID ${item.ClassId}:`, error);
                    throw error;
                  }
                }
              });
              
              await Promise.all(fetchClassNamePromises);

              //Store all proposed item data into proposedItemsDetails object
              proposedItemsDetails[proposedItem] = {
                classificationAttributes: classificationAttributeData,
              };

              console.log("proposedItemsDetails (If rev item has no class)::::::",JSON.stringify(proposedItemsDetails));
            }

          } 
          //If Classification attributes of new version item is greater than '0'
          else {
            const classificationAttributeData: {
              ClassId: string;
              MbomValue: boolean;
              ProposedChange: any;
              ClassName: string; // Add an optional ClassName property
            }[] = [];

            console.log(`=======pcItem?.proposedChange?.where?.type: ${pcItem?.proposedChange?.where?.type}`);
            console.log("Came here2");

            const physicalProductDetailsResponse = await this.fetchPhysicalProductDetails(proposedItem, headers, pcItem?.proposedChange?.where?.type);
            /* classificationAttributes.member.forEach((member: any) => {
              const mbomValue = physicalProductDetailsResponse.member[0]["dseno:EnterpriseAttributes"].EMR_hasMBOM;
              //To check 'PlantAssignmentClass' attribute is present and value shold be 'true'
              const plantAssignmentClass = member.Attributes.find(attr => attr.name === "PlantAssignmentClass" && attr.value === true);
              if (plantAssignmentClass) {
                classificationAttributeData.push({
                  ClassId: member.ClassID,
                  MbomValue: mbomValue,
                  ProposedChange: pcItem.proposedChange,
                  ClassName: ''
                });
              }
            }); */

            // First, find if there is any member with AllPlantsRemoved = true
            const allPlantsRemovedMember = classificationAttributes.member.find(member =>
              member.Attributes.some(attr => attr.name === "AllPlantsRemoved" && attr.value === true));

            if (allPlantsRemovedMember) {
              // Filter out the member(s) which have AllPlantsRemoved = true to get the "other" members
              const otherMembers = classificationAttributes.member.filter(member =>
                !member.Attributes.some(attr => attr.name === "AllPlantsRemoved" && attr.value === true)
              );

              // Only proceed if other members exist
              if (otherMembers.length > 0) {
                otherMembers.forEach((member: any) => {
                  // Check if PlantAssignmentClass attribute exists and its value is true
                  const plantAssignmentClass = member.Attributes.find(attr => attr.name === "PlantAssignmentClass" && attr.value === true);

                  if (plantAssignmentClass) {
                    foundValidClassificationAttribute = true;
                    // You will need mbomValue and pcItem.proposedChange from your context
                    const mbomValue = physicalProductDetailsResponse.member[0]["dseno:EnterpriseAttributes"].EMR_hasMBOM;

                    classificationAttributeData.push({
                      ClassId: member.ClassID,
                      MbomValue: mbomValue,
                      ProposedChange: pcItem.proposedChange,
                      ClassName: ''
                    });
                  }
                });
              }
            }
            
            console.log("classificationAttributeData::::", classificationAttributeData);

            //To Update the item with thier respective ClassName
            const fetchClassNamePromises = classificationAttributeData.map(async (item) => {
              if (item.ClassId) {
                try {
                  const classNameResponse = await this.fetchClassName(item.ClassId, headers);
                  const className = classNameResponse?.member?.[0]?.title.replace(/^Plant\s*/, "");
                  if (className) {
                    item.ClassName = className; // Update the item with ClassName
                  } else {
                    console.log(`ClassName not found for ClassID: ${item.ClassId}`);
                  }
                } catch (error) {
                  console.error(`Error fetching ClassName for ClassID ${item.ClassId}:`, error);
                  throw error;
                }
              }
            });
            
            await Promise.all(fetchClassNamePromises);

            //Store all proposed item data into proposedItemsDetails object
            proposedItemsDetails[proposedItem] = {
              classificationAttributes: classificationAttributeData,
            };

            console.log("proposedItemsDetails (If rev item has class)::::::",JSON.stringify(proposedItemsDetails));
          }

        } else {

          const classificationAttrRes = await this.fetchClassificationAttribute(proposedItem,headers);
          if (!classificationAttrRes) {
            continue; // Skip to the iteration if no data found
          }
          classificationAttributes = classificationAttrRes?.member?.[0]?.ClassificationAttributes;
          if (classificationAttributes?.totalItems <= 0) {
            console.log(`No classificationAttributes found for proposedItem: ${proposedItem}`);
            continue; // Skip to the next iteration if ClassificationAttribute is undefined
          }

          foundValidClassificationAttribute = true;

          //Array of objects to store classification Attribute data of each ProposedChange items
          const classificationAttributeData: {
            ClassId: string;
            MbomValue: boolean;
            ProposedChange: any;
            ClassName: string; // Add an optional ClassName property
          }[] = [];

          console.log(`=======pcItem?.proposedChange?.where?.type: ${pcItem?.proposedChange?.where?.type}`);
          const physicalProductDetailsResponse = await this.fetchPhysicalProductDetails(proposedItem, headers, pcItem?.proposedChange?.where?.type);
          classificationAttributes.member.forEach((member: any) => {
            //const mbomValue = physicalProductDetailsResponse.member[0]?.isManufacturable;
            const mbomValue = physicalProductDetailsResponse.member[0]["dseno:EnterpriseAttributes"].EMR_hasMBOM;
            //To check 'PlantAssignmentClass' attribute is present and value shold be 'true'
            const plantAssignmentClass = member.Attributes.find(attr => attr.name === "PlantAssignmentClass" && attr.value === true);
            if (plantAssignmentClass) {
              classificationAttributeData.push({
                ClassId: member.ClassID,
                MbomValue: mbomValue,
                ProposedChange: pcItem.proposedChange,
                ClassName: ''
              });
            }
          });

          const fetchClassNamePromises = classificationAttributeData.map(async (item) => {
            if (item.ClassId) {
              try {
                const classNameResponse = await this.fetchClassName(item.ClassId, headers);
                const className = classNameResponse?.member?.[0]?.title.replace(/^Plant\s*/, "");
                if (className) {
                  item.ClassName = className; // Update the item with ClassName
                } else {
                  console.log(`ClassName not found for ClassID: ${item.ClassId}`);
                }
              } catch (error) {
                console.error(`Error fetching ClassName for ClassID ${item.ClassId}:`, error);
                throw error;
              }
            }
          });
          
          await Promise.all(fetchClassNamePromises);

          //Store all proposed item data into proposedItemsDetails object
          proposedItemsDetails[proposedItem] = {
            classificationAttributes: classificationAttributeData,
          };

        }
      
      }

      console.log(`=====proposedItemsDetails: ${JSON.stringify(proposedItemsDetails)}`);

      if(!foundValidClassificationAttribute) {
        console.log(`No classificationAttributes found for any proposedItem`);
        throw error;
      }

      // Filter out objects with empty classificationAttributes and assign back to proposedItemsDetails
      const filteredProposedItemsDetails = Object.fromEntries(
        Object.entries(proposedItemsDetails).filter(
          ([key, value]) => value.classificationAttributes.length > 0
        )
      );

      proposedItemsDetails = filteredProposedItemsDetails;

      console.log("===========FinalproposedItemsDetails:", JSON.stringify(proposedItemsDetails));

      interface OutputData {
        id: string;
        PlantName: string;
        Mbom: boolean;
        ProposedChange: any;
        PlantAssignmentDetails: {
          ClassId: string;
          ClassName: string;
        }[];
      }
      const output: OutputData[] = [];

      for (const key in proposedItemsDetails) {
        try{
          if (proposedItemsDetails.hasOwnProperty(key)) {
              output.push({
                  id: key,
                  PlantName: proposedItemsDetails[key].classificationAttributes.map(attr => attr.ClassName).join(", "),
                  Mbom: proposedItemsDetails[key].classificationAttributes[0].MbomValue,
                  ProposedChange: proposedItemsDetails[key].classificationAttributes[0].ProposedChange,
                  PlantAssignmentDetails: proposedItemsDetails[key].classificationAttributes.map(attr => ({
                    ClassId: attr.ClassId,
                    ClassName: attr.ClassName
                  }))
            });
          }
        } catch(error) {
          console.log(error);
        }
      }

      console.log(`====output: ${JSON.stringify(output)}\nTimestamp: ${new Date().toLocaleString()}`);

      if(!upstreamCaData.description) {
        upstreamCaData.description = `FlowDownCA for CA-${upstreamCaData.name.split('-')[2]}`;
      }

      console.log(`---REQUEST the createFlowDownCA function to create FlowDownCA:: Timestamp: ${new Date().toLocaleString()}`);
      if(!createdFdcaId) {
        const createFdcaResponse: any = await this.createFlowDownCANew(headers,framedFdcaName,framedFdcaName,upstreamCaData.description,upstreamCaData.severity);
        console.log(`---RESPONSE of createFlowDownCAResponse function with retry:: Timestamp: ${new Date().toLocaleString()}\n${JSON.stringify(createFdcaResponse)}`);
        var { id: fdCaId, name: fdcaName } = createFdcaResponse || {};
      } else {
        const fdcaDetails = await this.fetchCaDetails(createdFdcaId, headers);
        var { id: fdCaId, name: fdcaName } = fdcaDetails;
      }

      if(!connectedFdcaId){
        //const modifyCaResponse = await this.modifyCAPrivate(headers,mulesoftData.CAID,fdCaId);
        const modifyCaResponse = await this.modifyCA(headers,mulesoftData.CAID,fdCaId);
        console.log(`---RESPONSE of modifyCA function: ${JSON.stringify(modifyCaResponse)}`);
      } 

      //Create an object to store input data to MR_Automation
      const inputAttributeToMrAutomation: {
        UpstreamCAID: string;
        FlowdownCAID: string;
        FlowdownCAName: string;
        Owner: string;
        Organization: string;
        CollabSpace: string;
        ProductDetails: any;
      } = {
        UpstreamCAID: mulesoftData.CAID,
        FlowdownCAID: fdCaId,
        FlowdownCAName: fdcaName,
        Owner: upstreamCaData.owner,
        Organization: upstreamCaData.organization,
        CollabSpace: upstreamCaData.collabSpace,
        ProductDetails: output,
      };

      console.log(`---REQUEST to MRAutomation: ${JSON.stringify(inputAttributeToMrAutomation)}`);
      const mrAutomationResponse = await this.callMrAutomation(headers, inputAttributeToMrAutomation);
      console.log(`---RESPONSE of MRAutomation: ${JSON.stringify(mrAutomationResponse)}`);
      if (mrAutomationResponse && mrAutomationResponse.success) {
        console.log(`MR automation completed successfully`);
      } else {
        console.error(`MR automation failed with message: ${mrAutomationResponse.message}`);
        throw error;
      }
      console.timeEnd('API Execution Time');
      res.status(200).json({status: `success`, msg: `ObsoletePart Creation request is successfull`});
    } catch (error) {
      console.timeEnd('API Execution Time');
      res.status(200).json({status: `failed`, msg: `ObsoletePart Creation request failed` });
    }
  }



  public async reverseAutomationProcess(req: Request, res: Response): Promise<void> {
    try {
      const {searchCaURL, expandProductURL, getMfgItemByScopeURL, mfgItemURL, baseURL, getGraphURL, searchRouteURL}=urlConfig;
      const { expandChildItemReqBody, caUrlParams, expandMfgItemReqBody, mfgParentItemURLParams,mfgParentItemReqBody} = API_CONFIG;

      const csrfTokenAndHeaders = await this.getAuthenticationToken();
      const headers: AxiosHeaders = {
        Cookie: csrfTokenAndHeaders.Cookie,
        SecurityContext: csrfTokenAndHeaders.SecurityContext,
        ENO_CSRF_TOKEN: csrfTokenAndHeaders.ENO_CSRF_TOKEN,
        "Content-Type": csrfTokenAndHeaders["Content-Type"],
      };


      interface MulesoftData {
        CAID: string;
        CABussinessGroup: string;
        CAState: string;
        CADescription: string;
        CAOwner: string;
      }

      interface UpstreamCAData {
        id: string;
        name: string;
        title: string;
        description: string;
        severity: string;
        owner: string;
        organization: string;
        collabSpace: string;
        flowDownCaId: string;
        upstreamCaProposedChanges: any;
        upstreamCaRealizedChanges: any;
      }

      const mulesoftData: MulesoftData = req.body;
      console.log(`---RECIEVED request from MuleSoft for ReverseAutomation: CAId: ${mulesoftData.CAID}`);
      //Fetch UpstreamCA Details
      const upstreamCaDetailsResponse = await this.fetchCaDetails(mulesoftData.CAID, headers);

      //Update the SecurityContext of 3dxServiceusers to align the Organization and CollabSpace section with those of the Upstream CA's owner
      headers.SecurityContext = headers.SecurityContext.replace(headers.SecurityContext?.split('.')[1], upstreamCaDetailsResponse?.organization);
      headers.SecurityContext = headers.SecurityContext.replace(headers.SecurityContext?.split('.')[2], upstreamCaDetailsResponse?.collabSpace);

      const flowDownCaId = upstreamCaDetailsResponse.isFlowedDownIn[0]?.identifier || '';
      const upstreamCaProposedChanges = upstreamCaDetailsResponse.proposedChanges || '';
      const upstreamCaRealizedChanges = upstreamCaDetailsResponse.realizedChanges || '';
      const { id, name, title, description, severity, owner, organization, collabSpace } = upstreamCaDetailsResponse;
      const upstreamCaData: UpstreamCAData = { id, name, title, description, severity, owner, organization, collabSpace, flowDownCaId, upstreamCaProposedChanges, upstreamCaRealizedChanges};
      
      // Create a set of identifiers from upstreamData(including both proposedChange and realizedChange)
      const identifierSet = Array.from(new Set(
        upstreamCaData.upstreamCaProposedChanges
          .map(item => item.where.identifier)
          .concat(upstreamCaData.upstreamCaRealizedChanges.map(item => item.where.identifier))
      ));

      // Create a set of identifiers and internalid from flowDownCA(proposedChange items)
      const flowDownCaDetailsResponse = await this.fetchCaDetails(upstreamCaData.flowDownCaId, headers);
      const flowDownCAProposedChangeItems = flowDownCaDetailsResponse.proposedChanges.map(item => ({
        internalid: item.internalid,
        identifier: item.where.identifier
      }));

      console.log(`=====flowDownCAProposedChangeItems: ${JSON.stringify(flowDownCAProposedChangeItems)}`);

      const expandPhysicalProduct = upstreamCaData.upstreamCaProposedChanges.map(async (product) => {
        try {
          let engItemId: any;
          let oldEngItemId: any;
          let mfgItemId: any;
          let oldEngItemMbom: boolean = true;

          interface ChildMfgItemDetail {
            childMfgItemId: string;
            childEngItemId: string;
            childMfgInstanceId: string;
          }

          let mfgItemChildData: ChildMfgItemDetail[] = [];

          if(product?.target == 'NewVersion') {
            const payload = {
              "data": [
                {
                  id: product?.where?.identifier,
                  identifier: product?.where?.identifier,
                  type: product?.where?.type,
                  source: baseURL,
                  relativePath: `/resources/v1/modeler/dseng/dseng:EngItem/${product?.where?.identifier}`
                }
              ]
            }
            //To get the new_rev_eng_item of the revised eng item(NewVersion)
            const engItemGraphResponse = await axios.post(`${getGraphURL}`, payload,{headers,httpsAgent: agent,});
            let newRevisionEngItemFilteredData = engItemGraphResponse?.data?.results[0]?.versions?.filter((item: any) => item?.ancestors);

            if(!newRevisionEngItemFilteredData || newRevisionEngItemFilteredData.length === 0) {
              console.log(`==========No new_rev_eng_item found for eng_item: ${product?.where?.identifier}`);
              return; // Skip to the next iteration if no data found
            }
            oldEngItemId = product?.where?.identifier;
            engItemId = newRevisionEngItemFilteredData[0]?.id;

            //To get the new_rev_mfg_item data by using new_rev_eng_item
            const newRevisionMfgItemData = await axios.post(`${getMfgItemByScopeURL}`,[engItemId],
            {
                params: { "$mask": "dsmfg:MfgItem.NavigateMask.utc" },
                headers,
                httpsAgent: agent,
            });
            if (newRevisionMfgItemData?.data?.member.length === 0) {
              console.log(`==========No new_rev_mfg_item found for new_rev_eng_item: ${engItemId}`);
              return; // Skip to the next iteration
            }
            mfgItemId = newRevisionMfgItemData?.data?.member[0]?.mfgItemId;

            //To expand new_eng_item and get child details if present, as of now this logic is not used(Bom comparision)
            /* const engItemChildDetailsResponse = await axios.post(
              `${expandProductURL}/${engItemId}/expand`,
              expandChildItemReqBody,
              {
                headers,
                httpsAgent: agent,
              }
            );
            const engItemChildData = engItemChildDetailsResponse?.data.member
            .filter((item: any) => item?.Path && item.Path.length === 3)
            .map((child: any) => ({
              newEngChildInstanceId: child.Path[1],
              newEngChildId: child.Path[2]
            })); */

            //To expand new_mfg_item and get child details if present
            const mfgItemChildDetailsResponse = await axios.post(
              `${mfgItemURL}/${mfgItemId}/expand`,
              expandMfgItemReqBody,
              {
                headers,
                httpsAgent: agent,
              }
            );
            mfgItemChildData = mfgItemChildDetailsResponse?.data.member
              .filter((item: any) => item?.path && item.path.length === 3)
              .map((child: any) => ({
                childMfgInstanceId: child.path[1],
                childMfgItemId: child.path[2]
            }));

            //To store mfgItem cummulative data
            let mfgItemCummulativeData = [{
              //...product,
              oldEngItemId: oldEngItemId,
              engItemId: engItemId,
              mfgItemId: mfgItemId,
              childMfgItemDetails: mfgItemChildData.length > 0 ? mfgItemChildData : []
            }];

            //To iterate through each and every child mfg item and get it's scopelinked eng item
            await Promise.all(mfgItemCummulativeData.map(async (item) => {
              if (item.childMfgItemDetails.length > 0) {
                const updatedChildDetails: ChildMfgItemDetail[] = [];
                for (const child of item.childMfgItemDetails) {
                  const getScope = await this.getScopeLink(child.childMfgItemId, headers, mfgItemURL);
                  updatedChildDetails.push({
                    ...child,
                    childEngItemId: getScope?.ScopeEngItem?.identifier
                  });
                }
                item.childMfgItemDetails = updatedChildDetails;
              }
            }));

            console.log(`==========mfgItemCummulativeData: ${JSON.stringify(mfgItemCummulativeData)}`);
            console.log(`==========identifierSet: ${identifierSet}`);
            return mfgItemCummulativeData;
          
          } else {
            if (product?.ProposedChange?.where?.type == "Raw_Material") {
              const manufacturingItemData = {
                ...product,
                childDetails: []
              };

              return manufacturingItemData;
            } else {
                const engItemId = product?.where?.identifier;
                //To get the mfg_item data by using eng_item
                const mfgItemDataResponse = await axios.post(`${getMfgItemByScopeURL}`,[engItemId],
                {
                    params: { "$mask": "dsmfg:MfgItem.NavigateMask.utc" },
                    headers,
                    httpsAgent: agent,
                });
                if (mfgItemDataResponse?.data?.member.length === 0) {
                  console.log(`==========No mfg_item found for eng_item: ${engItemId}`);
                  return; // Skip to the next iteration
                }
                const mfgItemId = mfgItemDataResponse?.data?.member[0]?.mfgItemId;

                //To expand mfg_item and get child details if present
                const mfgChildDetailsResponse = await axios.post(`${mfgItemURL}/${mfgItemId}/expand`,expandMfgItemReqBody,{headers,httpsAgent: agent});
                
                mfgItemChildData = mfgChildDetailsResponse?.data.member
                .filter((item: any) => item?.path && item.path.length === 3)
                .map((child: any) => ({
                  childMfgInstanceId: child.path[1],
                  childMfgItemId: child.path[2]
                }));

                let mfgItemCummulativeData = [{
                  engItemId: engItemId,
                  mfgItemId: mfgItemId,
                  childMfgItemDetails: mfgItemChildData.length > 0 ? mfgItemChildData : []
                }];

                //To iterate through each and every mfg item and get thier scopelinked eng item
                await Promise.all(mfgItemCummulativeData.map(async (item) => {
                  if (item.childMfgItemDetails.length > 0) {
                    const updatedChildDetails: ChildMfgItemDetail[] = [];
                    for (const child of item.childMfgItemDetails) {
                      const getScope = await this.getScopeLink(child.childMfgItemId, headers, mfgItemURL);
                      updatedChildDetails.push({
                        ...child,
                        childEngItemId: getScope?.ScopeEngItem?.identifier
                      });
                    }
                    item.childMfgItemDetails = updatedChildDetails;
                  }
                }));

                return mfgItemCummulativeData;
              }
          }
        } catch(error) {
          console.error(`Error processing product ${product?.where?.identifier}:`, error?.response?.data);
          throw error; 
        }
      });

      //Use .flatMap() to handle nested arrays and filter out null values.
      let expandedProposedChangeItemsData = (await Promise.all(expandPhysicalProduct)).flatMap(item => item ? item : []);
      console.log(`======expandedProposedChangeItemsData: ${JSON.stringify(expandedProposedChangeItemsData)}`);

      // Collect all mfgItem's Id from expandedProposedChangeItemsData
      /* const allMfgItemIds = expandedProposedChangeItemsData.map(item => item.mfgItemId);
      console.log(`All mfgItemIds: ${JSON.stringify(allMfgItemIds)}`); */

      // Filter out objects where any childMfgItemId matches any mfgItemId in the collected list of mfgItem's
      /* expandedProposedChangeItemsData = expandedProposedChangeItemsData.filter(item => {
        const hasMatchingChild = item.childMfgItemDetails.some(child => {
          const isMatch = allMfgItemIds.includes(child.childMfgItemId);
          console.log(`Checking childMfgItemId ${child.childMfgItemId} against all mfgItemIds: ${isMatch ? 'Match' : 'No Match'}`);
          return isMatch;
        });
        console.log(`Filtering item with mfgItemId ${item.mfgItemId}: ${hasMatchingChild ? 'Keeping' : 'Removing'}`);
        return hasMatchingChild;
      }); */

      // Filter out objects where the mfgItemId is found in any childMfgItemId
      expandedProposedChangeItemsData = expandedProposedChangeItemsData.filter(item => {
        const isFoundInChildren = expandedProposedChangeItemsData.some(otherItem => 
            otherItem.childMfgItemDetails.some(child => child.childMfgItemId === item.mfgItemId)
        );
        console.log(`Filtering item with mfgItemId ${item.mfgItemId}: ${isFoundInChildren ? 'Removing' : 'Keeping'}`);
        return !isFoundInChildren;
      });

      console.log(`After filtering expandedProposedChangeItemsData: ${JSON.stringify(expandedProposedChangeItemsData)}`);

      if (expandedProposedChangeItemsData.length === 0 || expandedProposedChangeItemsData.every(item => item === null)) {
        console.log(`No data found for reverse automation`);
        throw new Error('No data found for reverse automation');
      }

      //To store all mfgItem and childMfgItems in an array
      const allMfgItemIds: any = [];
      expandedProposedChangeItemsData.forEach(item => {
        allMfgItemIds.push({ id: item.mfgItemId });
        item.childMfgItemDetails.forEach(child => {
            allMfgItemIds.push({ id: child.childMfgItemId });
        });
      });

      console.log(`allMfgItemIds: ${JSON.stringify(allMfgItemIds)}`);

      //To transfer ownership of all mfgItems and childMfgItems
      await this.transferOwnershipOfMfgItems(upstreamCaData,headers,allMfgItemIds);
      await this.transferOwnershipOfCA(upstreamCaData,headers);

      //To remove Manufacturing Instances and detach scopelinks
      for (const item of expandedProposedChangeItemsData) {
        try {
          if (item.engItemId) {
            if(identifierSet.includes(item.engItemId.trim())) {
              console.log(`Processing engItemId: ${item.engItemId}`);
              if (item.childMfgItemDetails.length > 0) {
                for (const child of item.childMfgItemDetails) {
                  if (identifierSet.includes(child.childEngItemId)) {
                    console.log(`romoving mfgChildInstanceId: ${child.childMfgInstanceId}`);
                    await this.removeMfgInstance(child.childMfgInstanceId, headers, upstreamCaData.flowDownCaId);
                    console.log(`detaching Scopelink between: ${child.childMfgItemId} and ${child.childEngItemId}`);
                    await this.detachScopeLink(child.childMfgItemId, headers, child.childEngItemId, upstreamCaData.flowDownCaId);
                    if (flowDownCAProposedChangeItems.some(data => data.identifier === child.childMfgItemId)) {
                      console.log(`removing proposedChange item from mfgCA: ${child.childMfgItemId}`);
                      const internalid = flowDownCAProposedChangeItems.find(data => data.identifier === child.childMfgItemId).internalid;
                      await this.removeProposedChangeItemsFromMfgCA(internalid, headers, upstreamCaData.flowDownCaId);
                    }
                    console.log(`delete childMfgId: ${child.childMfgItemId}`);
                    await this.deleteMfgItem(child.childMfgItemId, headers);
                  } else {
                    console.log(`removing mfgChildInstanceId: ${child.childMfgInstanceId}`);
                    await this.removeMfgInstance(child.childMfgInstanceId, headers, upstreamCaData.flowDownCaId);
                  }
                }
              }
              console.log(`detaching Scopelink between: ${item.mfgItemId} and ${item.engItemId}`);
              await this.detachScopeLink(item.mfgItemId, headers, item.engItemId, upstreamCaData.flowDownCaId);
              if (flowDownCAProposedChangeItems.some(data => data.identifier === item.mfgItemId)) {
                console.log(`removing proposedChange item from mfgCA: ${item.mfgItemId}`);
                const internalid = flowDownCAProposedChangeItems.find(data => data.identifier === item.mfgItemId).internalid;
                await this.removeProposedChangeItemsFromMfgCA(internalid, headers, upstreamCaData.flowDownCaId);
              } else {

              }
              console.log(`delete mfgId: ${item.mfgItemId}`);
              await this.deleteMfgItem(item.mfgItemId, headers);
            }
          }
        } catch (error) {
            console.error(`Error when processing mfgItemId ${item.mfgItemId}:`, error);
          }
      }

      //To remove left over proposedChange items from mfgCA. For NewVersion items, in mfgCA proposedChange section we are getting old version
      //  mfgItem and the new version(AB) mfgItem will be present in realisedChange section. If we try to get AB version mfgItem by using graphAPI
      // we will not get the internalId, we will get only identifier, to removeProposedChangeFromMfgCA API we need to pass internalId not identifier
      const flowDownCaDetailsRes = await this.fetchCaDetails(upstreamCaData.flowDownCaId, headers);
      const flowDownCAProposedChangeItemsRemained = flowDownCaDetailsRes.proposedChanges.map(item => ({
        internalid: item.internalid,
        identifier: item.where.identifier
      }));
      if (flowDownCAProposedChangeItemsRemained.length > 0) {
        await Promise.all(flowDownCAProposedChangeItemsRemained.map(async (item) => {
            try {
                console.log(`removeRemainingProposedChangeItemsFromMfgCA: ${item.identifier}`);
                await this.removeProposedChangeItemsFromMfgCA(item.internalid, headers, upstreamCaData.flowDownCaId);
            } catch (error) {
                console.error(`Error removeRemainingProposedChangeItemsFromMfgCA: ${item.identifier}:`, error);
            }
        }));
      }

      //To search the routes based on mfgCA(MCO) and delete if found
      const listOfRoutes = await this.searchRoutePrivate(upstreamCaData.flowDownCaId, headers);
      if (listOfRoutes.items > 0 && listOfRoutes.data.length > 0) {
        await Promise.all(listOfRoutes.data.map(async (item) => {
            try {
                console.log(`delete route: ${item?.identifier}`);
                await this.deleteRoute(item?.identifier, headers);
            } catch (error) {
                console.error(`Error deleting route: ${item?.identifier}:`, error);
            }
        }));
      }

      //To remove flowDownCA connection from upstreamCA
      console.log(`removeMfgCAConnectionFromEngCA: ${upstreamCaData.flowDownCaId}`);
      await this.removeMfgCAConnectionFromEngCA(upstreamCaData,headers);

      //To delete the mfgCA
      console.log(`delete mfgCA: ${upstreamCaData.flowDownCaId}`);
      await this.deleteCa(upstreamCaData.flowDownCaId,headers);

      res.status(200).json({status: `success`, msg: `Reverse automation is successfull`});
    } catch (error) {
      res.status(200).json({status: `failed`, msg: `Reverse automation failed: ${error.message}`});
    }
  }


  
  public async createMFGCA(req: Request, res: Response): Promise<void> {
    try {
      const requestData = req.body;
      const csrfTokenAndHeaders = await this.getAuthenticationToken();
      const headers: AxiosHeaders = {
        Cookie: csrfTokenAndHeaders.Cookie,
        SecurityContext: csrfTokenAndHeaders.SecurityContext,
        ENO_CSRF_TOKEN: csrfTokenAndHeaders.ENO_CSRF_TOKEN,
        "Content-Type": csrfTokenAndHeaders["Content-Type"],
      };

      const { searchMFGItem,mfgItemURL,connectMbomItemToFdcaURL,promoteFdcaToAnyStateURL,updateOwnerURL ,baseURL} = urlConfig;
      const { searchmfgItemEINParams } = API_CONFIG;
      const { CAOwner, CATitle, CAOrganization, CACollabSpace, ParentPlants  } = requestData;
      const CADescription = "Created from Automation";
      const CASeverity = "Low";
      
      headers.SecurityContext = headers.SecurityContext.replace(headers.SecurityContext?.split('.')[1], CAOrganization);
      headers.SecurityContext = headers.SecurityContext.replace(headers.SecurityContext?.split('.')[2], CACollabSpace);
      
      let processedItems = 0;
      let failedItems = 0;
      let processedItemsList: string[] = [];  
      let failedItemsList: { Name: string; Error: string }[] = [];  
      let proposedItemsPayload: any[] = [];

      const PropagateChilds: any[] = [];
      // Create MFG CA
      const MFGCAResponse: any = await this.createFlowDownCANew(headers, "",CATitle, CADescription, CASeverity);
      var { id: MGFCAID, name: MFGCAName, cestamp: MFGCACstamp } = MFGCAResponse || {};
        MFGCAName = MFGCAName?.replace(/^CA-/, 'MCO-');
      for (const Item of requestData.Items) {
        try {
          const mgfItemDetails = await this.searchMfgItem(Item.name, headers);  
          const mgfItemId = mgfItemDetails.id;
          if (mgfItemId) {

            const checkScopeLick = await caService.getScopeLink(mgfItemId, headers, mfgItemURL);
            const engItmID = checkScopeLick?.ScopeEngItem?.identifier
            if (engItmID) { 

              // Classify eng Items
              const ClassedtobeClassified  = await this.classifyParentandChilds(MFGCAName,engItmID,checkScopeLick?.ScopeEngItem?.type,Item.plants,ParentPlants,headers);
              if (ClassedtobeClassified.length > 0){                
                PropagateChilds.push({"Id":engItmID,"Plants":ClassedtobeClassified});
              }
              
              proposedItemsPayload.push(await this.addProposedItemToPayload(baseURL, mgfItemDetails.type, mgfItemId));
              processedItems++;  
              processedItemsList.push(Item.name);
            } else {
              failedItems++;  
              failedItemsList.push({ Name: Item.name, Error: 'Not Found' });
            }
          } else {
            failedItems++;  
            failedItemsList.push({ Name: Item.name, Error: 'Not Found' });  
          }
        } catch (error) {
          failedItems++; 
          failedItemsList.push({ Name: Item.name, Error: error.message || 'Unknown error' });  
        }
      }

      if(proposedItemsPayload){
        //call child propagate childs classes
        if(PropagateChilds.length >0 ){
          await this.propagateChilds(MFGCAName,PropagateChilds,ParentPlants,headers);
        }

        //call method to update Proposed changes
        const details = await this.addProposedChangestoMFGCA(MGFCAID,MFGCAName,MFGCACstamp,connectMbomItemToFdcaURL,proposedItemsPayload,headers);
        
        //Prepare Unique plants for Routes
        const uniquePlants: string[] = [];
        requestData.Items.forEach(item => {
          if (!failedItemsList.some(failedItem => failedItem.Name === item.name)) {
            item.plants.forEach(plant => {
              if (!uniquePlants.includes(plant)) {
                uniquePlants.push(plant); // Add plant only if it's not already in the list
              }
            });
          }
        });

        //Promote CA to Inwork Before Adding Routes
        await this.promoteFdcaToInWork(MGFCAID, headers, promoteFdcaToAnyStateURL);
        
        //Create Routes for MFGCA
        await this.createRoutesforMFGCA(MFGCAName,MGFCAID,uniquePlants,headers);
      
        //change Owner 
        const ChangeRes =  await this.transferOwnership(CAOwner,CAOrganization,CACollabSpace,MGFCAID,headers,updateOwnerURL);
      }
      
      res.json({
        CAName:MFGCAName,
        CAID : MGFCAID,
        ProcessedItems: {
          Count: processedItems,
          Items: processedItemsList,  
        },
        FailedItems: {
          Count: failedItems,
          Items: failedItemsList,  
        },
      });
      console.log("Completed->");
    } catch (error) {
      console.error('Error in creating MFGCA:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }


  private async addProposedItemToPayload(
    baseURL: any,
    mgfItemType: any,
    mgfItemId: any
  ): Promise<any> {
    const newItem = {
      where: {
        source: baseURL,
        type: mgfItemType,
        identifier: mgfItemId,
        relativePath: `/resources/v1/modeler/dsmfg/dsmfg:MfgItem/${mgfItemId}`,
      },
      target: "CurrentVersion",
      whats: [
        {
          what: "Modify",
          why: ""
        }
      ]
    };

    // Return the newly created object
    return newItem;
  }


  private async addProposedChangestoMFGCA(getFdcaId: any,MFGCAName:any, getCestamp: any, getConnectMbomItemToFdcaURL: string, proposedItemsPayload: any[], headers: AxiosHeaders): Promise<any> {
    try {
      const payload = {
        cestamp: getCestamp,
        title : MFGCAName,
        add: [{proposedChanges: proposedItemsPayload}],
      };
      const response = await axios.patch(`${getConnectMbomItemToFdcaURL}/${getFdcaId}`,
        payload,
        {
          headers,
          httpsAgent: agent,
        }
      );
      return response.data;
    } catch (error) {
      const errorMessage = error.response.data.errorMessage;
      console.error(`Error when Adding Propsed changes to MFGCA`);
      throw error;
    }
  }


  private async transferOwnership(owner: any,organization:any,collabspace:any,mfgCAId:any, headers: AxiosHeaders, updateOwnerURL: string): Promise<any> {
    try {
      const payload = {
        "owner": owner,
        "organization": organization,
        "collabspace": collabspace,
        "data": [
          {
            "id": mfgCAId,
          }
        ]
      }
      const response = await axios.post(`${updateOwnerURL}`, payload, {
        headers,
        httpsAgent: agent,
      });
      return response.data;
    } catch (error) {
      const errorMessage = error?.response?.data;
      console.error(`Error while transfer ownership for flow down CA : ${errorMessage},${mfgCAId}`);
      throw error;

    }
  }

  //------------MFG Item---

  private async searchMfgItem(name: any, headers: AxiosHeaders): Promise<any> {
    try {
      const { searchMFGItem } = urlConfig;
      const { searchmfgItemEINParams } = API_CONFIG;
      searchmfgItemEINParams.$searchStr = name;

      const response = await axios.get(`${searchMFGItem}`, {
        params: searchmfgItemEINParams,
        headers,
        httpsAgent: agent,
      });
      if (response.data && response.data.member) {
        for (const item of response.data.member) {
          if (item["dseng:EnterpriseReference"] && item["dseng:EnterpriseReference"].partNumber === name) {
            return item;
          }
        }
      }
      return "";
    } catch (error) {
      console.error(`Error while searching manufacturing Item:`, error);
      return "";
    }
  }

  //-----Expand and get Childs--
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

  //-----------Plants and classificaiton--
  private async classifyParentandChilds(MFGCAName:any,engItmId: any, engItmtype: any, plants: any[], ParentPlants:any[], headers: AxiosHeaders): Promise<any> {
    try {
      //find assigned classes
      const classificationAttrRes = await this.fetchClassificationAttribute(engItmId, headers);
      const classificationAttributes = classificationAttrRes?.member?.[0]?.ClassificationAttributes?.member || [];
      const classifiedPlants:any = [];
      const { baseURL } = urlConfig;
      for (const item of classificationAttributes) {       
        const plantAssignmentClass = item.Attributes?.find(attr => attr.name === 'EMRPlantAssignmentClass' && attr.value === true);
        if (plantAssignmentClass) {
          const plantId = item.ClassID;
          const classNameResponse = await this.fetchClassName(plantId, headers);
          const className = classNameResponse?.member?.[0]?.title.replace(/^Plant\s*/, "");
          // const plantFlowDownCA = item.Attributes?.find(attr => attr.name.includes('EMRMCOName'));
          // const plantSeq = item.Attributes?.find(attr => attr.name.includes('EMRPlantSequence'));
          // const plantAddSeq = item.Attributes?.find(attr => attr.name.includes('EMRPlantAddSequence'));

          //---
          const FlowDownCA = item.Attributes?.find(attr => attr.name.includes('EMRMCOName'));
          const PlantStatus = item.Attributes?.find(attr => attr.name.includes('EMRPlantStatus'));
          const Template  = item.Attributes?.find(attr => attr.name.includes('EMRPlantTemplate'));
          const MBOM  = item.Attributes?.find(attr => attr.name.includes('EMRPlantMBOM'));
          const plantSeq = item.Attributes?.find(attr => attr.name.includes('EMRPlantSequence'));
          const plantAddSeq = item.Attributes?.find(attr => attr.name.includes('EMRPlantAddSequence'));
          const PlantPrevSeq = item.Attributes?.find(attr => attr.name.includes('EMRPlantPreviousSequence'));


          if (className) {
            classifiedPlants.push({
              "PlantName" :className,
              "MCOName" :FlowDownCA.value,
              "Sequence" :plantSeq.value,
              "plantId" : plantId,
              "AddSequence" : plantAddSeq.value,
              "Template": Template?.value,
              "Status": PlantStatus?.value,
              "MBOM" : MBOM?.value,
              "PreviousSequence" : PlantPrevSeq?.value
            });
          }
        }
      }
      const ClassesToBeClassified = plants.filter(plant => 
        !classifiedPlants.some(classified => classified.PlantName === plant)
      );
      const AlreadyClassifiedClasses = plants.filter(plant => 
        classifiedPlants.some(classified => classified.PlantName === plant)
      );
      console.log("AlreadyClassifiedClasses--------",AlreadyClassifiedClasses);
      // let ItemDetails = await this.fetchPhysicalProductDetails(engItmId, headers,engItmtype);
      // const isManufacturable = ItemDetails.member[0]?.isManufacturable;

      const Payload = [
        {
          "referencedObject": {
            "source": baseURL,
            "type": "dslib:CategorizationClassifiedItem",
            "identifier": engItmId,
            "relativePath": `resources/v1/modeler/dslib/dslib:CategorizationClassifiedItem/${engItmId}`
          },
          "categorizationAttributes" : []
        }
      ];
      const categorizationAttributes: any = [];

      for (const plant of ClassesToBeClassified) {
        
        const PlantID = ParentPlants.find(p => p.PlantName === plant)?.PlantID;
        const attributeUpdatePayload = {"classId": PlantID,"attributes":{}};
        let FlowDownCAKey: any = "EMRMCOName";
        let PlantStatusKey: any = "EMRPlantStatus";
        let SeqKey: any = "EMRPlantSequence"; 
        if (PlantID) {
          //classify plant to item
          const classifyresponse = await this.classifyItem(engItmId,engItmtype,PlantID,headers);
          // update attribute update Payload.
          attributeUpdatePayload.attributes[FlowDownCAKey] = "MCO-" + MFGCAName.split("-").pop() + "-" + plant;
          attributeUpdatePayload.attributes[PlantStatusKey] = "Current";

          categorizationAttributes.push(attributeUpdatePayload);
        } 
      }

      //update attribuets for already assigned Classes
      for (const plant of AlreadyClassifiedClasses) { 
        let FlowDownCAKey: any = "EMRMCOName";
        let PlantStatusKey: any = "EMRPlantStatus";
        let SeqKey: any = "EMRPlantSequence"; 
        let AddSeqKey: any = "EMRPlantAddSequence";
        let PreSeqKey: any = "EMRPlantPreviousSequence";

        const classifiedPlant = classifiedPlants.find(classified => classified.PlantName === plant);
        const attributeUpdatePayload = {"classId": classifiedPlant.plantId,"attributes":{}};
        attributeUpdatePayload.attributes[FlowDownCAKey] = "MCO-" + MFGCAName.split("-").pop() + "-" + plant;
        attributeUpdatePayload.attributes[PlantStatusKey] = "Current";
        attributeUpdatePayload.attributes[SeqKey] = String(Number(classifiedPlant.Sequence) + 1);
        attributeUpdatePayload.attributes[AddSeqKey] = String(Number(classifiedPlant.AddSequence) + 1);
        attributeUpdatePayload.attributes[PreSeqKey] = classifiedPlant.PreviousSequence
  ? classifiedPlant.PreviousSequence + "," + classifiedPlant.MCOName + "-" + classifiedPlant.Template + "-" + classifiedPlant.MBOM + "-" + classifiedPlant.Sequence + "-" + classifiedPlant.AddSequence
  : classifiedPlant.MCOName + "-" + classifiedPlant.Template + "-" + classifiedPlant.MBOM + "-" + classifiedPlant.Sequence + "-" + classifiedPlant.AddSequence;

        categorizationAttributes.push(attributeUpdatePayload);
        //Need to update old status and FlowDown CA -------------------->
      }
      
      const ItemDetails = await this.fetchPhysicalProductDetails(engItmId, headers,engItmtype);
      const Itemcestamp = ItemDetails.member[0]?.cestamp ;
      const mbomValue = ItemDetails.member[0]["dseno:EnterpriseAttributes"].EMR_hasMBOM;
      //attributeUpdatePayload["cestamp"] = Itemcestamp

      //update classification Attributes.
      Payload[0].categorizationAttributes = categorizationAttributes;
      
      const updateAttributeToPPResponse: any = await updateClassAttrToPhysicalProduct(headers,engItmId,Payload);
      
      if(mbomValue && engItmtype !== "Raw_Material" && ClassesToBeClassified.length > 0){
        return ClassesToBeClassified;
      }
      return "";
      
    } catch (error) {
      console.error(`Error while classifyParentandChilds:`, error);
      return "";
    }
  }

  private async classifyItem(
    ItmId: string,
    ItmType: string,
    classId: string,
    headers: AxiosHeaders
  ): Promise<any> {  
    const { engClassificationURL,baseURL } = urlConfig; 
    try {
      const body = {
        ClassID: classId,
        ObjectsToClassify: [
          {
            source: baseURL,
            type: ItmType,
            identifier: ItmId,
            relativePath: `/resources/v1/modeler/${
              ItmType === "Raw_Material"
                ? "dsrm/dsrm:RawMaterial"
                : "dseng/dseng:EngItem"
            }/${ItmId}`,
          },
        ],
      };
      const response = await axios.post(
        `${engClassificationURL}`,
        body,
        {
          headers,
          httpsAgent: agent, 
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error while clasifying Item:`, error);
      return []; 
    }
  }

  private async propagateChilds(MFGCAName: String, childDetails,AllPlants:any[],headers: AxiosHeaders): Promise<any> {
      
      try {
        
      const { baseURL } = urlConfig;

        for (const engItm of childDetails){
          const engItmId = engItm.Id;
          const Plants = engItm.Plants;
          const childs = await this.getItemChilds(engItmId,headers);
          for (const childItem of childs) {
              const classifiedPlants:any = []; 
              const childID = childItem.Id
              const childType = childItem.type
              const classificationAttrRes = await this.fetchClassificationAttribute(childID, headers);
              const classificationAttributes = classificationAttrRes?.member?.[0]?.ClassificationAttributes?.member || [];
              for (const item of classificationAttributes) {       
                const plantAssignmentClass = item.Attributes?.find(attr => attr.name === 'EMRPlantAssignmentClass' && attr.value === true);
                if (plantAssignmentClass) {
                  const plantId = item.ClassID;
                  const classNameResponse = await this.fetchClassName(plantId, headers);
                  const className = classNameResponse?.member?.[0]?.title.replace(/^Plant\s*/, "");
                  //const plantIdAttr = item.Attributes?.find(attr => attr.name.includes('PlantId'));
                  //const plantFlowDownCA = item.Attributes?.find(attr => attr.name.includes('EMRMCOName'));
                  //const plantSeq = item.Attributes?.find(attr => attr.name.includes('EMRPlantSequence'));
                    classifiedPlants.push({
                      "PlantName" :className,
                      //"FlowDownCA" :plantFlowDownCA.value,
                      //"Seq" :plantSeq.value
                    });
                }
              }

              let ItemDetails = await this.fetchPhysicalProductDetails(childID, headers,childType);
              const isManufacturable = ItemDetails.member[0]?.isManufacturable;
              

              const childtype = ItemDetails.member[0]?.type ;
              const attributeUpdatePayload = {};

              const ClassesToBeClassified = Plants.filter(plant => 
                !classifiedPlants.some(classified => classified.PlantName === plant)
              );

              const Payload = [
                {
                  "referencedObject": {
                    "source": baseURL,
                    "type": "dslib:CategorizationClassifiedItem",
                    "identifier": engItmId,
                    "relativePath": `resources/v1/modeler/dslib/dslib:CategorizationClassifiedItem/${engItmId}`
                  },
                  "categorizationAttributes" : []
                }
              ];
              const categorizationAttributes: any = [];
              
              for (const plant of ClassesToBeClassified) {
                const PlantID = AllPlants.find(p => p.PlantName === plant)?.PlantID;      
                if (PlantID) {
                  //classify plant to item
                  const classifyresponse = await this.classifyItem(childID,childtype,PlantID,headers);
                  // update attribute update Payload.
                  attributeUpdatePayload["EMRMCOName"] = MFGCAName;
                  attributeUpdatePayload["EMRPlantStatus"] = "Current";
                  //attributeUpdatePayload[plant+"MBOM"] = isManufacturable;
                  //Need to update old status and FlowDown CA -------------------->
                  categorizationAttributes.push(attributeUpdatePayload);
                } 
              }
              // ItemDetails = await this.fetchPhysicalProductDetails(childID, headers,childType);        
              // const Itemcestamp = ItemDetails.member[0]?.cestamp ;
              // attributeUpdatePayload["cestamp"] = Itemcestamp
              // //Update attribute--->
              // const updateAttributeToPPResponse: any = await updateClassAttrToPhysicalProduct(headers,childID,attributeUpdatePayload);
              //update classification Attributes.
              
              Payload[0].categorizationAttributes = categorizationAttributes;
              const updateAttributeToPPResponse: any = await updateClassAttrToPhysicalProduct(headers,engItmId,Payload);
      
            }
          }
      } catch (error) {
        console.error(`Error while propagateChilds:`, error);
        return "";
      }
  }

  //---------Route Methods-----

  private async createRoutesforMFGCA(MFGCAName: any, MGFCAID: any, plants: any[],headers: AxiosHeaders): Promise<void> {
    
    try {
      const routeName = MFGCAName.split("-").pop();
      headers.SecurityContext = headers.SecurityContext.replace(headers.SecurityContext?.split('.')[0], 'VPLMProjectLeader');
        for (const item of plants) {
          //Create Route
          const createRouteResponse = await this.createRoute(headers, routeName, item);
          //Assign Route to MFGCA
          const updateRouteResponse = await this.updateRoute(headers, createRouteResponse?.data?.[0]?.id, MGFCAID);
        }
        const createPreRouteResp = await this.createPrerequisiteRoute(headers, routeName);
        const updateRouteResponse = await this.updateRoute(headers, createPreRouteResp?.data?.[0]?.id, MGFCAID);
      headers.SecurityContext = headers.SecurityContext.replace(headers.SecurityContext?.split('.')[0], 'VPLMProjectAdministrator');
    
      } catch (error) {
        console.error("Error in createRoutesforMFGCA:", error);
    }
  }

  private async createRoute(
    headers: AxiosHeaders,
    CANumber: any,
    Plantname: string,

  ): Promise<any> {
    try {
      const { createRouteURL } = urlConfig;
      const payload = {
        "data": [
          {
            "title": `MCO-${CANumber}-${Plantname}`,
            "name": `MCO-${CANumber}-${Plantname}`,
            "description": "engineering approval route",
            "routeBasePurpose": "Approval",
            "AutoStopOnRejection": "Immediate",
            "routeCompletionAction": "Promote Connected Object",
            "DemoteOnRejection": "No",
            "attRestrictMembers": "Organization",
            "preserveTaskOwner": "False",
            "requiresEsign": "False",
            "templateId": "6B8F27BD75FF0D0067B2B917000041B2",
            // "contentIds": fdcaId,
            "tasks": [
              {
                "allowDelegation": "TRUE",
                "assigneeSetDueDate": "Yes",
                "instructions": "approve the task if all approvals are done",
                "parallelNodeProcessionRule": "All",
                "taskAction": "Approve",
                "taskOrder": "1",
                "title": "Review task",
                "needsOwnerReview": "No",
                "taskAssigneeUsername": "3dxserviceuser 3dxserviceuser",
                "assigneeId": "60841A3F5CF61400677B8364001A82F8"
              },
              {
                "allowDelegation": "TRUE",
                "assigneeSetDueDate": "Yes",
                "instructions": "approve the task if all approvals are done",
                "parallelNodeProcessionRule": "All",
                "taskAction": "Approve",
                "taskOrder": "2",
                "title": "Complete task",
                "needsOwnerReview": "No",
                "taskAssigneeUsername": "3dxserviceuser 3dxserviceuser",
                "assigneeId": "60841A3F5CF61400677B8364001A82F8"
              }
            ]
          }
        ]
      };
      const response = await axios.post(`${createRouteURL}`, payload, {
        headers,
        httpsAgent: agent,
      });
      return response.data;
    } catch (error) {
      console.error(`Error when Creating Route:`, error?.response?.data);
      throw error?.response?.data;
    }
  }

  private async createPrerequisiteRoute(
  headers: AxiosHeaders,
  CANumber: any
  ): Promise<any> {
  try {
    const { createRouteURL } = urlConfig;
    const payload = {
      "data": [
        {
          "title": "MCO Prerequisite Route",
          "name": `MCO-${CANumber}`,
          "description": "engineering approval route",
          "routeBasePurpose": "Standard",
          "AutoStopOnRejection": "Immediate",
          "routeCompletionAction": "Notify Route Owner",
          "DemoteOnRejection": "No",
          "attRestrictMembers": "Organization",
          "preserveTaskOwner": "False",
          "requiresEsign": "False",
          "templateId": "474D0026BAA60F0067B320000000884C",
          "tasks": [
            {
              "allowDelegation": "TRUE",
              "assigneeSetDueDate": "Yes",
              "instructions": "approve the task if all approvals are done",
              "parallelNodeProcessionRule": "All",
              "taskAction": "Approve",
              "taskOrder": "1",
              "title": "Validation Route",
              "needsOwnerReview": "No",
              "taskAssigneeUsername": "3dxserviceuser 3dxserviceuser",
              "assigneeId": "60841A3F5CF61400677B8364001A82F8"
            },

          ]
        }
      ]
    };
    const response = await axios.post(`${createRouteURL}`, payload, {
      headers,
      httpsAgent: agent,
    });
    return response.data;
  } catch (error) {
    console.error(`Error when Creating Route:`, error?.response?.data);
    throw error?.response?.data;
  }
  }

  private async updateRoute(
  headers: AxiosHeaders,
  routeId: string,
  fdcaId: string
  ): Promise<any> {
  try {
    const { createRouteURL } = urlConfig;
    const payload = {
      "data": [
        {
          "identifier": fdcaId,
          "type": "Change Action",
          "source": "https://oi000186152-us1-space.3dexperience.3ds.com:443/enovia",
          "relativePath": `/resources/v1/modeler/dslc/changeaction/${fdcaId}`,
          "updateAction": "CREATE",
          "RouteBaseState": "state_InApproval",
          "RouteTargetState": "state_Approved"
        }
      ]
    };
    const response = await axios.put(`${createRouteURL}/${routeId}/contents`, payload, {
      headers,
      httpsAgent: agent,
    });
    return response.data;
  } catch (error) {
    console.error(`Error when updating Route:`, error?.response?.data);
    throw error?.response?.data;
  }
}

  public async processMFGCA(req: Request, res: Response): Promise<void> {
    try {
      const requestData = req.body;
      const csrfTokenAndHeaders = await this.getAuthenticationToken();
      const headers: AxiosHeaders = {
        Cookie: csrfTokenAndHeaders.Cookie,
        SecurityContext: csrfTokenAndHeaders.SecurityContext,
        ENO_CSRF_TOKEN: csrfTokenAndHeaders.ENO_CSRF_TOKEN,
        "Content-Type": csrfTokenAndHeaders["Content-Type"],
      };
      const { CATitle, CAId, CAOrganization, CACollabSpace,CAOwner,Items} = requestData;
      const { updateClassAttributeForPhysicalProdURL , baseURL} = urlConfig;
      headers.SecurityContext = headers.SecurityContext.replace(headers.SecurityContext?.split('.')[1], CAOrganization);
      headers.SecurityContext = headers.SecurityContext.replace(headers.SecurityContext?.split('.')[2], CACollabSpace);
      
      const RouteUniquePlants: Set<string> = new Set<string>();
      //Loop over Items and classify new plants
      for (const item of Items) {
          console.log("Item Title:", item.ItemTitle);
          const ItemId = item.ItemId;
          const ItemType = item.ItemType;
          
          const classificationAttrRes = await this.fetchClassificationAttribute(ItemId, headers);
          const classificationAttributes = classificationAttrRes?.member?.[0]?.ClassificationAttributes?.member || [];
          const Payload = [
            {
              "referencedObject": {
                "source": baseURL,
                "type": "dslib:CategorizationClassifiedItem",
                "identifier": ItemId,
                "relativePath": `resources/v1/modeler/dslib/dslib:CategorizationClassifiedItem/${ItemId}`
              },
              "categorizationAttributes" : []
            }
          ];
          const categorizationAttributes: any = [];
          //Loop over Item Plants
          for (const plant of item.ItemPlants) {
            
            console.log("plaCATitlent:", CATitle);
            const PlantName = plant.PlantName.replace(/Plant|\s/g, "");
            const PlantID = plant.PlantID;
            const PlantType = plant.PlantType;
            const attributeUpdatePayload = {"classId": PlantID,"attributes":{}};
            const MCORouteName = `MCO-${CATitle.split("-").pop()}-${PlantName}`;
            let FlowDownCAKey: any = "EMRMCOName";
            let PlantStatusKey: any = "EMRPlantStatus";
            let SeqKey: any = "EMRPlantSequence";
            let AddSeqKey: any = "EMRPlantAddSequence";
            let PreviousSeqKey : any = "EMRPlantPreviousSequence";
            let TemplateKey : any = "EMRPlantTemplate";

            if(PlantType === "New"){
              const classifyresponse = await this.classifyItem(ItemId,ItemType,PlantID,headers);
              attributeUpdatePayload.attributes[FlowDownCAKey] = MCORouteName;
              attributeUpdatePayload.attributes[PlantStatusKey] = "Current";
              RouteUniquePlants.add(PlantName); //prepare unique plants
            } else if(PlantType === "old"){ 
                for (const item of classificationAttributes) {       
                  const plantAssignmentClass = item.Attributes?.find(attr => attr.name === 'EMRPlantAssignmentClass' && attr.value === true);
                  if (plantAssignmentClass) {
                    const clssID = item.ClassID;
                    const classNameResponse = await this.fetchClassName(clssID, headers);
                    const className = classNameResponse?.member?.[0]?.title.replace(/^Plant\s*/, "");
                    //const plantIdAttr = item.Attributes?.find(attr => attr.name.includes('PlantId'));
                    const FlowDownCA = item.Attributes?.find(attr => attr.name.includes('EMRMCOName'));
                    const PlantStatus = item.Attributes?.find(attr => attr.name.includes('EMRPlantStatus'));
                    const Template  = item.Attributes?.find(attr => attr.name.includes('EMRPlantTemplate'));
                    const MBOM  = item.Attributes?.find(attr => attr.name.includes('EMRPlantMBOM'));
                    const plantSeq = item.Attributes?.find(attr => attr.name.includes('EMRPlantSequence'));
                    const plantAddSeq = item.Attributes?.find(attr => attr.name.includes('EMRPlantAddSequence'));
                    const PlantPrevSeq = item.Attributes?.find(attr => attr.name.includes('EMRPlantPreviousSequence'));
                    if (className===PlantName) {
                      attributeUpdatePayload.attributes[FlowDownCAKey] = MCORouteName;
                      attributeUpdatePayload.attributes[PlantStatusKey] = "Current";
                      attributeUpdatePayload.attributes[SeqKey] = String(Number(plantSeq.value) + 1);
                      attributeUpdatePayload.attributes[AddSeqKey] = String(Number(plantAddSeq.value) + 1);
                      //attributeUpdatePayload.attributes[PreviousSeqKey] = classifiedPlant.PreviousSeq+","+classifiedPlant.FlowDownCA+"--"+classifiedPlant.Seq;
                      attributeUpdatePayload.attributes[PreviousSeqKey] = PlantPrevSeq
                        ? PlantPrevSeq + "," + FlowDownCA + "-" + Template + "-" + MBOM + "-" + plantSeq + "-" + plantAddSeq
                        : FlowDownCA + "-" + Template + "-" + MBOM + "-" + plantSeq + "-" + plantAddSeq;
                    }
                  }
                }
                RouteUniquePlants.add(PlantName); //prepare unique plants
            }
            categorizationAttributes.push(attributeUpdatePayload);
        }
        console.log("Payload:", Payload);
          Payload[0].categorizationAttributes = categorizationAttributes;
          console.log("Payload:", Payload);
          //Update Item Body---
          //const ItemDetails = await this.fetchPhysicalProductDetails(ItemId, headers,ItemType);        
          //const Itemcestamp = ItemDetails.member[0]?.cestamp ;
         // attributeUpdatePayload["cestamp"] = Itemcestamp
          const updateAttributeToPPResponse: any = await updateClassAttrToPhysicalProduct(headers,ItemId,Payload);
      }

      //--Get Routes connected to CA
      const RoutesList = await this.searchRoutePrivate(CAId, headers);
      const RouteTitles :any[]= [];
      for (const Route of RoutesList.data) {
        const RouteTitle = Route?.dataelements?.name;
        if (RouteTitle !== null && RouteTitle !== undefined && RouteTitle !== "") {
          RouteTitles.push(RouteTitle);
        }
      }

      // --create and connect routes to MFGCA
      headers.SecurityContext = headers.SecurityContext.replace(headers.SecurityContext?.split('.')[0], 'VPLMProjectLeader');
      console.log(RouteUniquePlants.size);
      for (const uniquePlant of Array.from(RouteUniquePlants)) {
        const matchedTitle = RouteTitles.find(title => title.includes(uniquePlant));
        if (!matchedTitle) {
          const createRouteResponse = await this.createRoute(headers, CATitle.split("-").pop(), uniquePlant);
          const updateRouteResponse = await this.updateRoute(headers, createRouteResponse?.data?.[0]?.id, CAId);
        }
      };
      headers.SecurityContext = headers.SecurityContext.replace(headers.SecurityContext?.split('.')[0], 'VPLMProjectAdministrator');
          

      res.json({
        Status: "Success"
      });
      console.log("Completed->");

    } catch (error) {
      console.error('Error in processMFGCA MFGCA:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

}

export default getFlowDownCAService;

export async function updateClassAttrToPhysicalProduct(
  headers: AxiosHeaders,
  getPhysicalProdId: any,
  getPayload: any
): Promise<any> {
  try {
    console.log(`====updateClassAttrToPhysicalProduct_Payload: ${JSON.stringify(getPayload)}`);
    const { updateClassAttributeForPhysicalProdURL , baseURL} = urlConfig;
    const payload = getPayload

    const response = await axios.post(`${updateClassAttributeForPhysicalProdURL}`,
      payload,
      {
        headers,
        httpsAgent: agent,
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error while updating classification attribute to physical product: ${getPhysicalProdId}:`,error);
    throw error;
  }
}