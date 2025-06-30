import { Request, Response } from "express";
import AuthService from "../authentication/authService";
import API_CONFIG from "../config/APIConfig";
import axios, { AxiosHeaders } from "axios";
import { urlConfig } from "../config/urlConfig";

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
class CAService {
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
    console.log('csrf token in getAuth function', csrfToken);
    return csrfToken;
  }

  public async getSaasCADetails(req: Request, res: Response): Promise<void> {
    try{
      const {
        caUrlParams,
        caUrlParamsForBasicdata        
      } = API_CONFIG;
      const {
        baseURL
      } = urlConfig;
      console.log("before token")     
      const csrfTokenAndHeaders = await this.getAuthenticationToken();
      const queryParams = req.query;
      const caId = queryParams?.caId;
      const routeId = queryParams?.routeId;
      const caParam = queryParams?.isBasics || "";
      const caHeaderParams = caParam ? caUrlParamsForBasicdata : caUrlParams;
      console.log('csrfTokenAndHeaders', csrfTokenAndHeaders);
      console.log('queryParams caService SaaS Details line 46', queryParams);
      console.time('CASaaSAPIExecutionTime');
      const headers: IHeaders = {
        Cookie: csrfTokenAndHeaders.Cookie,
        SecurityContext: csrfTokenAndHeaders.SecurityContext,
        ENO_CSRF_TOKEN: csrfTokenAndHeaders.ENO_CSRF_TOKEN,
        "Content-Type": csrfTokenAndHeaders["Content-Type"],
        // Cookie: "JSESSIONID=BC54F42BAB265B09EA08C360274DDCDB;SERVERID=MT_Metadata_0_7025", 
        // SecurityContext: "VPLMProjectLeader.0000000001.Micro Motion", 
        // ENO_CSRF_TOKEN: '4NIG-EXZK-8TND-RUIZ-RVSX-PTLE-OOZ0-0QD4', 
        // "Content-Type": "application/json" 
      };
      // Make an axios GET request with the caId, query parameters, and headers
      //const baseURL = "https://oi000186152-us1-space.3dexperience.3ds.com/enovia";
      // console.log('base url', baseURL);
      // console.log('URL', `${baseURL}/resources/v1/modeler/dsrt/routes/${routeId}`)
      console.log('get CASaaS details headers', headers);
      console.log('CA SaaS Details API URL', `${baseURL}/resources/v1/modeler/dsrt/routes/${routeId}?$include=tasks`);
      const caSaasResponse = await axios.get(`${baseURL}/resources/v1/modeler/dsrt/routes/${routeId}?$include=tasks`, {
        params: caHeaderParams,
        headers,
        httpsAgent: agent,
      });
      console.timeEnd('CASaaSAPIExecutionTime');
      console.time('CADetailsInSaaSAPIExecutionTime');
      const caDetailsResponse = await this.getCADetails(req, res)
      console.timeEnd('CADetailsInSaaSAPIExecutionTime');    
      console.log('caDetailsResponse', caDetailsResponse);
      console.log('caSaasResponse with data', caSaasResponse.data);
      console.log('caSaasResponse', caSaasResponse.data.data[0]);
      caDetailsResponse['state'] = "Create";
      if(caSaasResponse.data){
        caSaasResponse.data.data[0].tasks.map((task)=>{
            if( task.type == "Inbox Task" && task.title == "Complete task" && task.current == "Complete") {
              return caDetailsResponse['state'] = "Release"
            } 
            if( task.type == "Inbox Task" && task.title == "Review task" && task.current == "Complete") {
              return caDetailsResponse['state'] = "Review"
            }
        })
      }
      console.log('caDetailsResponse state', caDetailsResponse['state']); 
      caDetailsResponse['mcoId'] = caDetailsResponse['id'];
      caDetailsResponse['mcoName'] = caDetailsResponse['title'];
      caDetailsResponse['mcoTitle'] = caDetailsResponse['name'];
      caDetailsResponse['id'] = caSaasResponse.data.data[0].id;
      caDetailsResponse['title'] = caSaasResponse.data.data[0].title;
      caDetailsResponse['name'] = caSaasResponse.data.data[0].title;
      let filteredPlantName = caDetailsResponse['name'].split("-").pop();
      caDetailsResponse['plantName'] = filteredPlantName;
      console.log('final CA SaaS response before send', caDetailsResponse);
      res.send(caDetailsResponse)
    }catch (error){
      if (!res.headersSent) {
        console.log("Exception in route details", error);
        res.status(500).json({ error: "Failed to fetch CA details." });
      } else {
        console.log("Error after headers sent:", error);
      }
    }
  }

  public async getCADetails(req: Request, res: Response): Promise<void> {
    try {
      const {
        caUrlParams,
        caUrlParamsForBasicdata,
        mfgItemUrlParams,
        mfgChildItemURLParams,
        mfgChildItemReqBody,
        mfgParentItemReqBody,
        engClassificationURLParams,
        engClassificationTitleURLParams,
        mfgParentItemURLParams,
        itemSpecURLParams,
        engItemUrlParams,
      } = API_CONFIG;
      const {
        caDetailsURL,
        mfgItemURL,
        mfgChildItemURL,
        engClassificationTitleURL,
        engClassificationURL,
        mfgParentItemURL,
        itemSpecURL,
        baseURL,
        engItemURL,
      } = urlConfig;
      const csrfTokenAndHeaders = await this.getAuthenticationToken();
      const queryParams = req.query;
      const caId = queryParams?.caId;
      const caParam = queryParams?.isBasics || "";
      const caHeaderParams = caParam ? caUrlParamsForBasicdata : caUrlParams;
      console.log('csrfTokenAndHeaders CA Service CA Details', csrfTokenAndHeaders);
      console.log('queryParams CA Details', queryParams);
      console.log('caParam CA Details', caParam);
      console.log('caUrlParamsForBasicdata', caUrlParamsForBasicdata);
      console.log('caUrlParams', caUrlParams);
      console.log('caHeaderParams', caHeaderParams);
      console.time('CADetailsAPIExecutionTime');
      const headers: AxiosHeaders = {
        Cookie: csrfTokenAndHeaders.Cookie,
        SecurityContext: csrfTokenAndHeaders.SecurityContext,
        ENO_CSRF_TOKEN: csrfTokenAndHeaders.ENO_CSRF_TOKEN,
        "Content-Type": csrfTokenAndHeaders["Content-Type"],
      };
      console.log('CA Details headers', headers);
      console.log('CA Details API URL', `${caDetailsURL}/${caId}`);
      // Make an axios GET request with the caId, query parameters, and headers
      const caRawResponse = await axios.get(`${caDetailsURL}/${caId}`, {
        params: caHeaderParams,
        headers,
        httpsAgent: agent,
      });
      console.timeEnd('CADetailsAPIExecutionTime');
      console.log('CA Details caRawResponse data', caRawResponse?.data)
      const caResponseData = caRawResponse?.data;
      const tenantId = process.env.NODE_API_TENANT_ID;
      console.log('CA Details tenantId', tenantId);
      caResponseData.source = { url: tenantId };
      console.log('caResponseData?.organization', caResponseData?.organization);
      //assign plant name to ca Response
      console.time('CADetailsPlantInfoAPIExecutionTime');
      const plantName = await this.assignPlantInfo(
        caResponseData?.organization,
        headers
      );
      console.timeEnd('CADetailsPlantInfoAPIExecutionTime');
      console.log('ca details plantName', plantName);
      caResponseData.plantName = plantName;
      console.log('caResponseData?.proposedChanges', caResponseData?.proposedChanges);
      if (caResponseData?.proposedChanges)
        delete caResponseData.proposedChanges;
      console.log('caResponseData after deleting proposed changes', caResponseData);
      if (
        caResponseData?.isFlowedDownIn &&
        caResponseData?.isFlowedDownIn?.length > 0
      ) {
        if(queryParams.hasOwnProperty('routeId')){
          return caRawResponse.data;
        } else {
          res.send(caRawResponse.data);
          return;
        }        
      }
      console.log('caResponseData?.realizedChanges', caResponseData?.realizedChanges);
      const proposedItems =
        caResponseData?.realizedChanges?.map(
          (item: any) => item.where.identifier
        ) || [];
      console.log('proposedItems after filter', proposedItems);
      const manufacturingItemsData: any = [];
      for (const mfgItem of proposedItems) {
        const manufacturingItemData = {};
        // Make API request for each item
        console.time('CADetailsMFGItemBasicInfoAPIExecutionTime');
        const mfgItemBasicResponse = await axios.get(
          `${mfgItemURL}/${mfgItem}`,
          {
            params: mfgItemUrlParams,
            headers,
            httpsAgent: agent,
          }
        );
        console.timeEnd('CADetailsMFGItemBasicInfoAPIExecutionTime');
        console.log('mfgItemBasicResponse', mfgItemBasicResponse.data);
        delete mfgItemBasicResponse.data.nlsLabel;
        //make or buy updates to manufacturing items
        const mfgItemBasicData = mfgItemBasicResponse?.data?.member[0];
        if (
          mfgItemBasicData &&
          configurations.MAKETYPES.includes(mfgItemBasicData?.type)
        ) {
          mfgItemBasicData.makeBuy = "make";
        } else if (
          mfgItemBasicData &&
          configurations.BUYTYPES.includes(mfgItemBasicData?.type)
        ) {
          mfgItemBasicData.makeBuy = "buy";
        }
        manufacturingItemData["basicInfo"] = mfgItemBasicResponse.data;

        const scopeEngItem =
          mfgItemBasicResponse?.data?.member[0]?.ScopeEngItem?.identifier;
        //getting parent details
        console.log('scopeEngItem', scopeEngItem);
        mfgParentItemReqBody.objectReferences[0].identifier = mfgItem;
        console.time('CADetailsMFGItemParentInfoAPIExecutionTime');
        const mfgItemParentDetails = await axios.post(
          `${mfgParentItemURL}`,
          mfgParentItemReqBody,
          {
            params: mfgParentItemURLParams,
            headers,
            httpsAgent: agent,
          }
        );
        console.timeEnd('CADetailsMFGItemParentInfoAPIExecutionTime');
        const parentsData = mfgItemParentDetails?.data?.member[0]?.[
          "dsmfg:MfgItemInstance"
        ].member.map((item: any) => item.parentObject.identifier);
        console.log('parentsData', parentsData);
        console.time('CADetailsMFGItemParentBasicInfoAPIExecutionTime');
        const requestedPromises = parentsData.map(async (parentId: any) => {
          const parentBasicResponse = await axios.get(
            `${mfgItemURL}/${parentId}`,
            {
              params: mfgItemUrlParams,
              headers,
              httpsAgent: agent,
            }
          );
          delete parentBasicResponse.data.nlsLabel;
          return parentBasicResponse.data;
        });
        console.timeEnd('CADetailsMFGItemParentBasicInfoAPIExecutionTime');
        console.log('requestedPromises', requestedPromises);
        const parentData = await Promise.all(requestedPromises);
        console.log('parentData', parentData);
        manufacturingItemData["parentDetails"] = parentData;

        //getting child details
        console.time('CADetailsMFGItemChildInfoAPIExecutionTime');
        const mfgItemChildDetails = await axios.post(
          `${mfgChildItemURL}/${mfgItem}/expand`,
          mfgChildItemReqBody,
          {
            params: mfgChildItemURLParams,
            headers,
            httpsAgent: agent,
          }
        );
        console.timeEnd('CADetailsMFGItemChildInfoAPIExecutionTime');
        console.log('mfgItemChildDetails', mfgItemChildDetails.data);
        const childData = mfgItemChildDetails?.data?.member?.filter(
          (item: any) => {
            if (
              item?.id !== mfgItem &&
              item?.type !== "DELFmiFunctionIdentifiedInstance"
            ) {
              return item;
            }
          }
        );
        console.log('childData', childData);
        manufacturingItemData["childDetails"] = childData || [];
        //getting engineering item details
        console.log('scopeEngItem condition', scopeEngItem);
        if (scopeEngItem) {
          https: console.log("scope link", `${engItemURL}/${scopeEngItem}`);
          console.time('CADetailsMFGIEngItemBasicInfoAPIExecutionTime');
          const engDataBasic = await axios.get(
            `${engItemURL}/${scopeEngItem}`,
            {
              params: engItemUrlParams,
              headers,
              httpsAgent: agent,
            }
          );
          console.timeEnd('CADetailsMFGIEngItemBasicInfoAPIExecutionTime');
          console.log('engDataBasic', engDataBasic.data);
          delete engDataBasic.data.nlsLabel;
          manufacturingItemData["engItemBasicInfo"] = engDataBasic.data;
          //getting classification details
          // console.log("scope link", `${engClassificationURL}/${scopeEngItem}`);
          console.time('CADetailsMFGClassificationInfoAPIExecutionTime');
          const clsDataEngItem = await axios.get(
            `${engClassificationURL}/${scopeEngItem}`,
            {
              params: engClassificationURLParams,
              headers,
              httpsAgent: agent,
            }
          );
          console.timeEnd('CADetailsMFGClassificationInfoAPIExecutionTime');
          console.log('clsDataEngItem data', clsDataEngItem.data);
          delete clsDataEngItem.data.nlsLabel;
          manufacturingItemData["classificationInfo"] = clsDataEngItem.data;

          //processing classification data
          const classificationData =
            clsDataEngItem?.data?.member[0]?.ClassificationAttributes?.member;
          console.log('classificationData', classificationData);
          const classIds =
            classificationData?.map((item: any) => item?.ClassID) || [];
          const partTypesClass =
            classificationData?.filter((item: any) =>
              item?.Attributes?.some(
                (attr: any) => attr.name === "PartTypesClass"
              )
            ) || [];
          const plantAssignmentClass =
            classificationData?.filter((item: any) =>
              item?.Attributes?.some(
                (attr: any) => attr.name === "PlantAssignmentClass"
              )
            ) || [];
          const ProductHierarchyClass =
            classificationData?.filter((item: any) =>
              item?.Attributes?.some(
                (attr: any) => attr.name === "ProductHierarchyClass"
              )
            ) || [];
          //getting class titles
          console.time('CADetailsMFGClassTitlesAPIExecutionTime');
          const requestedPromisesForClassTitle = classIds.map(
            async (classId: any) => {
              const classTitleData = await axios.get(
                `${engClassificationTitleURL}/${classId}`,
                {
                  params: engClassificationTitleURLParams,
                  headers,
                  httpsAgent: agent,
                }
              );
              delete classTitleData.data.nlsLabel;
              delete classTitleData.data.member[0].ParentClassification;
              return classTitleData?.data?.member[0];
            }
          );
          console.timeEnd('CADetailsMFGClassTitlesAPIExecutionTime');
          const classTitleData = await Promise.all(
            requestedPromisesForClassTitle
          );

          // Add titles to ProductHierarchyClassData
          ProductHierarchyClass.forEach((item) => {
            const matchingTitle = classTitleData.find(
              (titleItem) => titleItem.id === item.ClassID
            );
            if (matchingTitle) {
              item.title = matchingTitle.title;
            }
          });

          // Add titles to PlantAssignmentClassData
          plantAssignmentClass.forEach((item) => {
            const matchingTitle = classTitleData.find(
              (titleItem) => titleItem.id === item.ClassID
            );
            if (matchingTitle) {
              item.title = matchingTitle.title;
            }
          });

          // Add titles to PartTypesClassData
          partTypesClass.forEach((item) => {
            const matchingTitle = classTitleData.find(
              (titleItem) => titleItem.id === item.ClassID
            );
            if (matchingTitle) {
              item.title = matchingTitle.title;
            }
          });

          const displayType = partTypesClass.map((item) => item.title);

          const manufacturingResponsibility = plantAssignmentClass.map(
            (item) => item.title
          );
          const engItemBasicInfo =
            manufacturingItemData["engItemBasicInfo"]?.member[0];
          if (engItemBasicInfo)
            engItemBasicInfo.displayType =
              displayType && displayType.length > 0 ? displayType[0] : "";
          if (engItemBasicInfo)
            engItemBasicInfo.manufacturingResponsibility =
              manufacturingResponsibility;
          console.time('CADetailsMFGSpecDataAPIExecutionTime');
          const specDataEngItem = await axios.get(
            `${itemSpecURL}/${scopeEngItem}`,
            {
              params: itemSpecURLParams,
              headers,
              httpsAgent: agent,
            }
          );
          console.timeEnd('CADetailsMFGSpecDataAPIExecutionTime');
          const specFilterData = specDataEngItem?.data?.data?.map(
            (item: any) => item.dataelements
          );
          manufacturingItemData["specData"] = specFilterData;
        }
        manufacturingItemsData.push(manufacturingItemData);
      }
      caResponseData.proposedItems = manufacturingItemsData;
      delete caResponseData.realizedChanges;
      if(queryParams.hasOwnProperty('routeId')){
        return caRawResponse.data;
      } else {
        res.send(caRawResponse.data);
        return;
      }
    } catch (error) {
      // console.log("Exception in CA details", error);
    }
  }

  private async assignPlantInfo(
    organizationName: any,
    headers: IHeaders
  ): Promise<void> {
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
    const plantsData = await axios.get(
      `${companyPlantsUrl}/${companyId}/plants`,
      {
        params: companyPlantsUrlParams,
        headers,
        httpsAgent: agent,
      }
    );

    const plantData = plantsData.data.data;
    const foundPlant =
      plantData && plantData.find((item) => item.name === organizationName);
    return foundPlant?.title || "";
  }

  public async createCA(req: Request, res: Response): Promise<void> {
    try {
      //  res.send("hello")
      // Your code for creating a new CA in the controller
    } catch (error) {
      // Handle error
    }
  }

  public async updateCA(req: Request, res: Response): Promise<void> {
    try {
      // Your code for updating a CA in the controller
    } catch (error) {
      // Handle error
    }
  }

  public async deleteCA(req: Request, res: Response): Promise<void> {
    try {
      // Your code for deleting a CA in the controller
    } catch (error) {
      // Handle error
    }
  }


  public async mrAutomation(req: Request, res: Response): Promise<void> {
    try {
      const { mfgItemURL, getPhysicalProductInfoURL, getInstanceURL, expandProductURL, getMfgItemByScopeURL, caDetailsURL, connectMbomItemToFdcaURL, promoteFdcaToAnyStateURL, getGraphURL, getRawMaterialDetailsURL, getRawMaterialDetailsByInstanceURL, updateOwnerURL, removeMfgInstanceURL, baseURL, mfgParentItemURL, searchRouteURL, getRawMaterialInfoURL } = urlConfig;
      const { expandChildItemReqBody, caUrlParams, expandMfgItemReqBody, mfgParentItemURLParams, mfgParentItemReqBody, mfgItemUrlParams, searchRouteParams } = API_CONFIG;

      // Get authentication token only once
      const csrfTokenAndHeaders = await this.getAuthenticationToken();

      const headers: IHeaders = {
        Cookie: csrfTokenAndHeaders.Cookie,
        SecurityContext: csrfTokenAndHeaders.SecurityContext,
        ENO_CSRF_TOKEN: csrfTokenAndHeaders.ENO_CSRF_TOKEN,
        "Content-Type": csrfTokenAndHeaders["Content-Type"]
      };
      interface Product {
        id: string;
        ProposedChange: {
          where: {
            type: string;
          };
          target: string;
          whats: string[];
        };
        Mbom?: boolean;
        oldEngChildData?: any[];
        childDetails?: any[];
      }

      interface ProductDetails {
        ProductDetails: Product[];
        Organization: string;
        FlowdownCAID: string;
        Owner: string;
        CollabSpace: string;
        UpstreamCAID: string;
      }

      const productDetails: ProductDetails = req.body;
      const rawData = req.body;
      const manufacturingItemsData: any[] = [];

      if (!Array.isArray(productDetails?.ProductDetails)) {
        throw new Error("Invalid ProductDetails format");
      }

      const plantName: any = productDetails?.Organization;

      headers.SecurityContext = headers.SecurityContext.replace(headers.SecurityContext?.split('.')[1], plantName);
      headers.SecurityContext = headers.SecurityContext.replace(headers.SecurityContext?.split('.')[2], productDetails?.CollabSpace);
      const expandProduct = productDetails.ProductDetails.map(async (product: Product) => {
        try {
          // expand product for new revision
          if (product?.ProposedChange?.target == 'NewVersion') {
            if (product?.ProposedChange?.where?.type == "Raw_Material") {
              const manufacturingItemData = {
                ...product,
                childDetails: []
              };

              return manufacturingItemData;
            } else {
              const mfgItemChildDetails = await axios.post(
                `${expandProductURL}/${product?.id}/expand`,
                expandChildItemReqBody,
                {
                  headers,
                  httpsAgent: agent,
                }
              );

              const childData = mfgItemChildDetails?.data.member
                .filter((item: any) => item?.Path && item.Path.length === 3)
                .map((child: any) => ({
                  instanceId: child.Path[1],
                  childProductId: child.Path[2]
                }));
              //store the child details of old eng item into product.oldEngChildData  
              const manufacturingItemData = {
                ...product,
                oldEngChildData: childData.length > 0 ? childData : []
              };

              return manufacturingItemData;
            }  
          } else {
            // expand product for new release
            // check for raw material
            if (product?.ProposedChange?.where?.type == "Raw_Material") {
              const manufacturingItemData = {
                ...product,
                childDetails: []
              };

              return manufacturingItemData;
            }
            else {
              // check for physical product
              const mfgItemChildDetails = await axios.post(
                `${expandProductURL}/${product?.id}/expand`,
                expandChildItemReqBody,
                {
                  headers,
                  httpsAgent: agent,
                }
              );

              const childData = mfgItemChildDetails?.data.member
                .filter((item: any) => item?.Path && item.Path.length === 3)
                .map((child: any) => ({
                  instanceId: child.Path[1],
                  childProductId: child.Path[2]
                }));

              const manufacturingItemData = {
                ...product,
                childDetails: childData.length > 0 ? childData : []
              };

              return manufacturingItemData;
            }
          }
        } catch (error) {
          console.error(`Error processing product ${product?.id}:`, error?.response?.data);
          throw error; // Return null to continue processing other products
        }
      });

      const expandProductData = await Promise.all(expandProduct);
      manufacturingItemsData.push(...expandProductData.filter(item => item !== null));

      console.log(`========manufacturingItemsData: ${JSON.stringify(manufacturingItemsData)}`);

      const createMfgItemsPromises = manufacturingItemsData.map(async (product) => {
        try {
          let mfgItemId: any;
          let oldEngItemId: any;
          let oldMfgItemId: any;
          let oldMbom: boolean = true;
          let newPhysicalProductDetail: any;
          let oldPhysicalProductDetail: any;

          // find and create mfg item for revison
          if (product?.ProposedChange?.target == 'NewVersion') {
            const payload = {
              "data": [
                {
                  id: product?.id,
                  identifier: product?.id,
                  type: product?.ProposedChange?.where?.type,
                  source: baseURL,
                  relativePath: `/resources/v1/modeler/dseng/dseng:EngItem/${product?.id}`
                }
              ]
            }
            console.log("check for new version");
            //Get the new version engitem by using Graph API
            const getEgnItem = await axios.post(
              `${getGraphURL}`,
              payload,
              {
                headers,
                httpsAgent: agent,
              }
            );

            let filterEngItem = getEgnItem?.data?.results[0]?.versions?.filter((item: any) => item?.ancestors);
            console.log("newVersionEngItem: ", filterEngItem);
            //Added by SHA - START
            if (product?.ProposedChange?.where?.type == "Raw_Material") {
              oldEngItemId = product?.id;
              product.id = filterEngItem[0]?.id;
              oldMbom = product.Mbom;
              //oldMbom =  false;
              const getMfgItem = await axios.post(
                `${getMfgItemByScopeURL}`,
                [oldEngItemId],
                {
                  params: { "$mask": "dsmfg:MfgItem.NavigateMask.utc" },
                  headers,
                  httpsAgent: agent,
                }
              );
              oldMfgItemId = getMfgItem.data?.member[0]?.mfgItemId;
              let filterScopeLink: any[] = [];
              await Promise.all(getMfgItem?.data?.member?.map(async (item: any) => {
                const response = await axios.get(`${mfgItemURL}/${item.mfgItemId}`, { headers, httpsAgent: agent });
                filterScopeLink.push(...response.data.member);
              }));
              console.log("oldVersionMfgItemData", filterScopeLink)
              let filteredItems: any[] = [];
              if (product?.ProposedChange?.where?.type == "Raw_Material") {
                filteredItems = filterScopeLink.filter((el: any) => el.organization == plantName && el.type == (product?.Mbom ? 'ProcessContinuousCreateMaterial' : 'ProcessContinuousProvide'));
              } else {
                filteredItems = filterScopeLink.filter((el: any) => el.organization == plantName && el.type == (product?.Mbom ? 'CreateAssembly' : 'Provide'));
              }
              mfgItemId = filteredItems[0]?.id;

            } else { 
              //Added by SHA - END
              newPhysicalProductDetail = await this.getProductDetails(filterEngItem[0]?.id, headers, getPhysicalProductInfoURL);
              oldPhysicalProductDetail = await this.getProductDetails(product?.id, headers, getPhysicalProductInfoURL);
              oldEngItemId = product?.id;
              product.id = filterEngItem[0]?.id;
              oldMbom = product.Mbom;
              //product.Mbom = newPhysicalProductDetail[0]?.isManufacturable;
              product.Mbom = newPhysicalProductDetail[0]["dseno:EnterpriseAttributes"].EMR_hasMBOM;

              if (filterEngItem[0]?.id) {
                //Expand the new engItem
                const mfgItemChildDetails = await axios.post(
                  `${expandProductURL}/${filterEngItem[0]?.id}/expand`,
                  expandChildItemReqBody,
                  {
                    headers,
                    httpsAgent: agent,
                  }
                );
                //store the child details of new eng item into product.childDetails
                product.childDetails = mfgItemChildDetails?.data.member
                  .filter((item: any) => item?.Path && item.Path.length === 3)
                  .map((child: any) => ({
                    instanceId: child.Path[1],
                    childProductId: child.Path[2]
                  }));
              }

              //if (newPhysicalProductDetail[0]?.isManufacturable == oldPhysicalProductDetail[0]?.isManufacturable) {
              if (newPhysicalProductDetail[0]["dseno:EnterpriseAttributes"].EMR_hasMBOM == oldPhysicalProductDetail[0]["dseno:EnterpriseAttributes"].EMR_hasMBOM) {
                // Get MfgItem of old eng item by using old eng item
                const getMfgItem = await axios.post(
                  `${getMfgItemByScopeURL}`,
                  [oldEngItemId],
                  {
                    params: { "$mask": "dsmfg:MfgItem.NavigateMask.utc" },
                    headers,
                    httpsAgent: agent,
                  }
                );
                console.log("======getMfgItem: ", getMfgItem.data);
                oldMfgItemId = getMfgItem.data?.member[0]?.mfgItemId;
                // mfgItemId = getMfgItem?.data?.member[0]?.mfgItemId;
                let filterScopeLink: any[] = [];
                await Promise.all(getMfgItem?.data?.member?.map(async (item: any) => {
                  //To get the detailed info of mfg item of old eng item
                  const response = await axios.get(`${mfgItemURL}/${item.mfgItemId}`, { headers, httpsAgent: agent });
                  filterScopeLink.push(...response.data.member);
                }));
                console.log("filterScopeLink123", filterScopeLink)
                let filteredItems: any[] = [];
                if (product?.ProposedChange?.where?.type == "Raw_Material") {
                  filteredItems = filterScopeLink.filter((el: any) => el.organization == plantName && el.type == (product?.Mbom ? 'ProcessContinuousCreateMaterial' : 'ProcessContinuousProvide'));
                } else {
                  filteredItems = filterScopeLink.filter((el: any) => el.organization == plantName && el.type == (product?.Mbom ? 'CreateAssembly' : 'Provide'));
                }
                mfgItemId = filteredItems[0]?.id;
                console.log("mfgItemId: ", mfgItemId);

              } else {
                console.log("Came here becouse old hasMBOM and new hasMBOM are not equal");
                console.log("New Version EngItem Id: ", newPhysicalProductDetail[0]?.id);
                console.log("check for new release");
                // Get MfgItem by Scope
                const getMfgItem = await axios.post(
                  `${getMfgItemByScopeURL}`,
                  [newPhysicalProductDetail[0]?.id],
                  {
                    params: { "$mask": "dsmfg:MfgItem.NavigateMask.utc" },
                    headers,
                    httpsAgent: agent,
                  }
                );
                /* const getMfgItem = await axios.post(
                  `${getMfgItemByScopeURL}`,
                  [oldEngItemId],
                  {
                    params: { "$mask": "dsmfg:MfgItem.NavigateMask.utc" },
                    headers,
                    httpsAgent: agent,
                  }
                ); */
                console.log("oldEngItemId:",oldEngItemId);
                console.log("RevisedVersion MfgItem Details: ", getMfgItem?.data?.member)
                let filterScopeLink: any[] = [];
                await Promise.all(getMfgItem?.data?.member?.map(async (item: any) => {
                  const response = await axios.get(`${mfgItemURL}/${item.mfgItemId}`, { headers, httpsAgent: agent });
                  filterScopeLink.push(...response.data.member);
                }));
                console.log("filterScopeLink123", filterScopeLink)
                let filteredItems: any[] = [];
                if (product?.ProposedChange?.where?.type == "Raw_Material") {
                  filteredItems = filterScopeLink.filter((el: any) => el.organization == plantName && el.type == (product?.Mbom ? 'ProcessContinuousCreateMaterial' : 'ProcessContinuousProvide'));
                } else {
                  filteredItems = filterScopeLink.filter((el: any) => el.organization == plantName && el.type == (product?.Mbom ? 'CreateAssembly' : 'Provide'));
                }

                console.log("filteredItems: ", JSON.stringify(filteredItems));
                mfgItemId = filteredItems[0]?.id;
                console.log("mfgItemId: ",mfgItemId);
                if (mfgItemId) {
                  console.log("mfg item id", mfgItemId, product?.id)
                  const checkScopeLick = await this.getScopeLink(mfgItemId, headers, mfgItemURL);
                  if (checkScopeLick?.ScopeEngItem?.identifier != product?.id) {
                    console.log("create scope link", product?.id)
                    await this.createScopeLinkInitial(mfgItemId, headers, product?.id, mfgItemURL, product?.ProposedChange?.where?.type);
                  }
                }
                else {
                  if (product?.ProposedChange?.where?.type == "Raw_Material") {
                    const instanceId = await this.getInstanceId(manufacturingItemsData, product?.id);
                    mfgItemId = await this.processItemForRawMaterial(product, headers, productDetails?.Organization, instanceId, { mfgItemURL, getRawMaterialDetailsURL, getRawMaterialDetailsByInstanceURL });
                    await this.createScopeLinkInitial(mfgItemId, headers, product?.id, mfgItemURL, product?.ProposedChange?.where?.type);
                  }
                  /* else {
                    console.log("create new item")
                    console.log(`===============product: ${JSON.stringify(product)}`);
                    mfgItemId = await this.processItem(product, headers, productDetails?.Organization, { mfgItemURL, getPhysicalProductInfoURL });
                    await this.createScopeLinkInitial(mfgItemId, headers, product?.id, mfgItemURL, product?.ProposedChange?.where?.type);
                  } */
                  else {
                    console.log("create new revision mfgItem for new revision Eng item");
                    console.log(`===============product: ${JSON.stringify(product)}`);
                    mfgItemId = await this.processItem(product, headers, productDetails?.Organization, { mfgItemURL, getPhysicalProductInfoURL });
                    await this.promoteMfgItemLifeCycle(mfgItemId,headers,promoteFdcaToAnyStateURL, 'RELEASED');
                    //await this.createScopeLinkInitial(mfgItemId, headers, product?.id, mfgItemURL, product?.ProposedChange?.where?.type);
                    //Logic to update the custom revision on parent mfg Item - START
                    const {customRevision} = urlConfig;
                    //const modifiedHeadersForCustomRevision = { ...headers, 'SecurityContext': `VPLMAdmin.Company%20Name.Default` };
                    const customRevisionReqBody = {
                      "addRequests": [
                        {
                          "copyId": mfgItemId,
                          "ancestors": [
                              {
                                  "semantic": "LAST",
                                  "id": mfgItemId
                              }
                          ],
                          "attributes": [],
                          "code": newPhysicalProductDetail[0].revision,
                        }
                      ]
                    };
                    console.log(`=====modifiedHeadersForCustomRevision: ${JSON.stringify(headers)}`);
                    console.log(`=====customRevisionReqBody: ${JSON.stringify(customRevisionReqBody)}`);
                    try {
                      const customRevisionResponse = await axios.post(
                        `${customRevision}`,
                        customRevisionReqBody,
                        {
                          params: {
                            "withAttributes": "1",
                            "withCopyFrom": "1",
                            "credentials": "include"
                          },
                          headers,
                          httpsAgent: agent
                        }
                      );
                      console.log(`=====Response of customRevisionResponse: ${JSON.stringify(customRevisionResponse.data)}`);
                      mfgItemId = customRevisionResponse.data.addRequests[0].id;
                    } catch(error) {
                      console.log(error);
                    }
                    //Logic to update the custom revision on parent mfg Item - END
                    await this.createScopeLinkInitial(mfgItemId, headers, product?.id, mfgItemURL, product?.ProposedChange?.where?.type);
                  }
                }

              }

            }
          }
          // create mfg item for new release
          else {
            // Get MfgItem by Scope
            const getMfgItem = await axios.post(
              `${getMfgItemByScopeURL}`,
              [product?.id],
              {
                params: { "$mask": "dsmfg:MfgItem.NavigateMask.utc" },
                headers,
                httpsAgent: agent,
              }
            );
            console.log("check for new release", getMfgItem?.data?.member)
            let filterScopeLink: any[] = [];
            await Promise.all(getMfgItem?.data?.member?.map(async (item: any) => {
              const response = await axios.get(`${mfgItemURL}/${item.mfgItemId}`, { headers, httpsAgent: agent });
              filterScopeLink.push(...response.data.member);
            }));
            console.log("filterScopeLink123", filterScopeLink)
            let filteredItems: any[] = [];
            if (product?.ProposedChange?.where?.type == "Raw_Material") {
              filteredItems = filterScopeLink.filter((el: any) => el.organization == plantName && el.type == (product?.Mbom ? 'ProcessContinuousCreateMaterial' : 'ProcessContinuousProvide'));
            }
            else {
              filteredItems = filterScopeLink.filter((el: any) => el.organization == plantName && el.type == (product?.Mbom ? 'CreateAssembly' : 'Provide'));
            }
            console.log("======filteredItems: ", filteredItems);
            mfgItemId = filteredItems[0]?.id;

            if (mfgItemId) {
              console.log("mfg item id", mfgItemId, product?.id)
              const checkScopeLick = await this.getScopeLink(mfgItemId, headers, mfgItemURL);
              if (checkScopeLick?.ScopeEngItem?.identifier != product?.id) {
                console.log("create scope link", product?.id)
                await this.createScopeLinkInitial(mfgItemId, headers, product?.id, mfgItemURL, product?.ProposedChange?.where?.type);
              }
            }
            else {
              // create mfg item for raw material
              if (product?.ProposedChange?.where?.type == "Raw_Material") {
                const instanceId = await this.getInstanceId(manufacturingItemsData, product?.id);
                mfgItemId = await this.processItemForRawMaterial(product, headers, productDetails?.Organization, instanceId, { mfgItemURL, getRawMaterialDetailsURL, getRawMaterialDetailsByInstanceURL });
                await this.createScopeLinkInitial(mfgItemId, headers, product?.id, mfgItemURL, product?.ProposedChange?.where?.type);
              }
              else {
                // create mfg item for physical product
                console.log("create new item")
                mfgItemId = await this.processItem(product, headers, productDetails?.Organization, { mfgItemURL, getPhysicalProductInfoURL });
                await this.createScopeLinkInitial(mfgItemId, headers, product?.id, mfgItemURL, product?.ProposedChange?.where?.type);
              }
            }
          }
          return {
            ...product,
            mfgItemId,
            ...(product?.ProposedChange?.target === 'NewVersion' && { oldEngItemId, oldMbom, oldMfgItemId }),
          };
        } catch (error) {
          throw error;
        }
      });

      const manufacturingItems = await Promise.all(createMfgItemsPromises);
      console.log(`=========manufacturingItems: ${JSON.stringify(manufacturingItems)}`);
      const uniqueManufacturingItems = manufacturingItems.filter(item => item !== null);

      const output = uniqueManufacturingItems.map(product => {
        if (product?.childDetails?.length > 0) {
          product.childDetails = product.childDetails.map(child => {
            const matchingChild = uniqueManufacturingItems.find(item => item.id === child.childProductId);
            return {
              ...child,
              mfgItemId: matchingChild ? matchingChild.mfgItemId : null,
              type: matchingChild ? matchingChild?.ProposedChange?.where?.type : null,
              Mbom: matchingChild ? matchingChild?.Mbom : null
            };
          });
        }
        return product;
      });

      console.log(`=========output: ${JSON.stringify(output)}`);

      //  add add and cut action for revision process
      //here filterData is a result of the object of items which having oldEngItemId, thay means item which have got revised
      const filterData = output?.filter((item: any) => item?.oldEngItemId);
      console.log(`=========FilterData_BeforeAddingAddCut: ${JSON.stringify(filterData)}`)
      console.log("=======filterData: ", JSON.stringify(filterData));
      if (filterData?.length > 0) {
        filterData?.forEach(item => {
          if (item?.oldEngItemId) {
            const childDetailsIds = new Set(item?.childDetails?.map(child => child.childProductId));
            const oldEngChildDataIds = new Set(item?.oldEngChildData?.map(child => child.childProductId));

            // Add action as Cut in oldEngChildData's object when data is not found in childDetails
            item?.oldEngChildData?.forEach(async (oldChild) => {
              const payloadOldChild = {
                "data": [
                  {
                    id: oldChild.childProductId,
                    identifier: oldChild.childProductId,
                    type: 'VPMReference',
                    source: baseURL,
                    relativePath: `/resources/v1/modeler/dseng/dseng:EngItem/${oldChild.childProductId}`
                  }
                ]
              }
              // call graph api to get the new version eng item
              const getEgnItem = await axios.post(
                `${getGraphURL}`,
                payloadOldChild,
                {
                  headers,
                  httpsAgent: agent,
                }
              );
              const findAncestors = getEgnItem?.data?.results[0]?.versions?.filter((item: any) => item?.ancestors);
              // console.log("findAncestors",findAncestors[0]?.id)
              if (findAncestors?.length > 0) {
                //If childDetailsIds doesn't contain the ancestors, then that item is cut
                if (!childDetailsIds.has(findAncestors[0]?.id)) {
                  oldChild.action = 'Cut';
                }
              }
              else {
                item.oldEngChildData.forEach(item => {
                  if (!childDetailsIds.has(item.childProductId)) {
                    item.action = 'Cut';
                  }
                });
              }
            });

            // // // Add action as Add in childDetails's object when data is not found in oldEngChildData
            item?.childDetails?.forEach(async (newChild) => {
              const payloadNewChild = {
                "data": [
                  {
                    id: newChild.childProductId,
                    identifier: newChild.childProductId,
                    type: 'VPMReference',
                    source: baseURL,
                    relativePath: `/resources/v1/modeler/dseng/dseng:EngItem/${newChild.childProductId}`
                  }
                ]
              }
              // call graph api to get the data
              const getEgnItem = await axios.post(
                `${getGraphURL}`,
                payloadNewChild,
                {
                  headers,
                  httpsAgent: agent,
                }
              );
              const findAncestors1 = getEgnItem?.data?.results[0]?.versions?.filter((item: any) => item?.ancestors);
              //  console.log("findAncestors1",findAncestors1[0]?.ancestors?.[0]?.id)
              if (findAncestors1?.length > 0) {
                if (!oldEngChildDataIds.has(findAncestors1[0]?.ancestors?.[0]?.id)) {
                  newChild.action = 'Add';
                }
              }
              else {
                item.childDetails.forEach(item => {
                  if (!oldEngChildDataIds.has(item.childProductId)) {
                    item.action = 'Add';
                  }
                });
              }

            });
          }
        });

        console.log(`=========FilterData_AfterAddingAddCut: ${JSON.stringify(filterData)}`)

        const axiosRetry = async (url, data, headers, agent, maxRetries = 3, delay = 3000) => {
          let retries = 0;
          let success = false;
          let response;
        
          while (retries < maxRetries && !success) {
            try {
              // Try the request
              response = await axios.post(url, data, {
                headers,
                httpsAgent: agent,
              });
              
              // Check if the response is successful (you can modify the check as needed)
              if (response.status === 200) {
                success = true;
              }
            } catch (error) {
              retries++;
              console.error(`Attempt ${retries} failed: ${error.message}`);
              
              // Wait for the delay before retrying
              if (retries < maxRetries) {
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
              } else {
                console.log('Max retries reached. Giving up.');
              }
            }
          }
        
          return response;
        };

        // expand the old mfg item
        await Promise.all(filterData.map(async (filterItem: any) => {
          console.log(`========expand1`);
          /* const expandOldMfgItem = await axios.post(
            `${mfgItemURL}/${filterItem?.mfgItemId}/expand`,
            expandMfgItemReqBody,
            {
              headers,
              httpsAgent: agent,
            }
          ); */
          // Use the retry function
          const expandOldMfgItem = await axiosRetry(
            `${mfgItemURL}/${filterItem?.mfgItemId}/expand`, 
            expandMfgItemReqBody,
            headers,
            agent,
            3, // maxRetries
            3000 // delay in ms between retries
          );

          if (!expandOldMfgItem) {
            console.error(`Failed to fetch data for mfgItemId: ${filterItem?.mfgItemId}`);
            return; // Optionally handle failure
          }

          const filteredData = expandOldMfgItem.data?.member?.filter(item => item.path && item.path.length === 3);

          const childMfgData: { childProductId: string | undefined, childMfgItemId: string | undefined, childMfgInstanceId: string | undefined }[] = [];
          console.log("===filteredData", JSON.stringify(filteredData))

          await Promise.all(filteredData.map(async (item: { path: string[] }) => {
            const getScope = await this.getScopeLink(item.path[2], headers, mfgItemURL);
            childMfgData.push({
              childProductId: getScope?.ScopeEngItem?.identifier,
              childMfgItemId: getScope?.id,
              childMfgInstanceId: item.path[1]
            });
          }));
          if (filterItem?.oldEngChildData?.length > 0) {
            filterItem.oldEngChildData.forEach(dataItem => {
              const matchingArrayItem = childMfgData.find(arrayItem => arrayItem.childProductId === dataItem.childProductId);
              if (matchingArrayItem) {
                dataItem.childMfgItemId = matchingArrayItem.childMfgItemId;
                dataItem.childMfgInstanceId = matchingArrayItem.childMfgInstanceId;
              }
            });
          }
        }));
      }

      console.log("========filterData2", JSON.stringify(filterData));

      // call get ca details
      const getFdcaDetails = await this.fetchCaDetails(productDetails?.FlowdownCAID, headers, caDetailsURL, caUrlParams);
      const { cestamp: getCestamp, proposedChanges, state } = getFdcaDetails || {};
      console.log(`=====getCestamp: ${getCestamp}, proposedChanges: ${JSON.stringify(proposedChanges)}, state: ${state}`);
      // connect mfg item to fdca
      const connectMbomItem = async (item: any, headers: any, getCestamp: string, connectMbomItemToFdcaURL: string, baseURL: string) => {
        try {
          console.log("item", JSON.stringify(item))
          let target: string = '';
          let what: string = '';
          // to handle new eng item manufacturable false for new revision
          if (item.Mbom != item.oldMbom && item?.ProposedChange?.target == 'NewVersion') {
            target = "CurrentVersion";
            what = "ChangeMaturityRelease";
          }
          else {
            target = item?.ProposedChange?.target;
            what = item?.ProposedChange?.whats[0]?.what;
          }

          let type: string = '';
          if (item?.ProposedChange?.where?.type == "Raw_Material") {
            type = item.Mbom ? 'ProcessContinuousCreateMaterial' : 'ProcessContinuousProvide';
          } else {
            type = item.Mbom ? 'CreateAssembly' : 'Provide';
          }
          await this.connectMbomItemToFdca(productDetails?.FlowdownCAID, item.mfgItemId, type, headers, getCestamp, connectMbomItemToFdcaURL, target, what, baseURL);
        } catch (error) {
          console.log(`---Error for call flow data ca ${item.mfgItemId}: ${error}`);
          throw error;

        }
        return true
      };
      console.log("proposedChanges", JSON.stringify(proposedChanges))
      //Initially there will not be any proposedChange items, here in if-block is for reprocessing
      if (proposedChanges && proposedChanges.length > 0) {
        const result = await Promise.all(output.map(async (item) => {
          console.log("check proposed changes", item?.mfgItemId, item.id);
          const checkProposedChanges = proposedChanges.filter((proposedItem: any) => proposedItem?.where?.identifier === item?.mfgItemId);
          console.log("checkProposedChanges", checkProposedChanges)
          if (checkProposedChanges.length === 0) {
            console.log("create new proposed changes");
            return connectMbomItem(item, headers, getCestamp, connectMbomItemToFdcaURL, baseURL);
          }
          return true;
        }));

        if (result.every(success => success) && state == 'Prepare') {
          console.log("call promote to in work state")
          await this.promoteFdcaToInWork(productDetails?.FlowdownCAID, headers, promoteFdcaToAnyStateURL, 'In Work');
        }
      } else {
        console.log("create proposed changes");
        const fdcaDetailsPromises = await Promise.all(output.map(item => connectMbomItem(item, headers, getCestamp, connectMbomItemToFdcaURL, baseURL)));

        if (fdcaDetailsPromises.every(success => success)) {
          await this.promoteFdcaToInWork(productDetails?.FlowdownCAID, headers, promoteFdcaToAnyStateURL, 'In Work');
        } else {
          console.log('Not all mfgItemId connections were successful. Skipping promotion to "In Work".');
        }
      }

      // get ca deatils from upstream id
      const upstreamCaData = await this.fetchCaDetails(productDetails?.UpstreamCAID, headers, caDetailsURL, caUrlParams);
      const plantNamesSet = new Set<string>();
      // get plant names

      output.forEach(item => {
      const plantNames = item.PlantName.split(',').map(name => name.trim());
      plantNames.forEach(name => plantNamesSet.add(name));
      });

      const plantNames = Array.from(plantNamesSet);
      
      const fetchSearchRoute = await axios.get(`${searchRouteURL}`, 
      { 
      params: { "searchStr": `%5BName%5D%3A(MCO-${upstreamCaData.name.split('-')[2]}*)` }, 
      headers, httpsAgent: agent 
      });
      // check the route exist or not
      const createRoutesIfNotExist = async (plantNames: string[], headers: IHeaders, upstreamCaData: any, productDetails: any) => {
        await Promise.all(plantNames.map(async (item) => {
          const filter = fetchSearchRoute?.data?.data?.filter((route: any) => route.name === `MCO-${upstreamCaData.name.split('-')[2]}-${item}`);
          if (filter.length === 0) {
            headers.SecurityContext = headers.SecurityContext.replace(headers.SecurityContext?.split('.')[0], 'VPLMProjectLeader');
            const createRouteResponse = await this.createRoute(headers, upstreamCaData, item,productDetails?.FlowdownCAID);
            console.log("updateRouteResponse2", createRouteResponse);
          //  const updateRouteResponse = await this.updateRoute(headers, createRouteResponse?.data?.[0]?.id, productDetails?.FlowdownCAID);
            headers.SecurityContext = headers.SecurityContext.replace(headers.SecurityContext?.split('.')[0], 'VPLMProjectAdministrator');
          }
        }));
      };

      await createRoutesIfNotExist(plantNames, headers, upstreamCaData, productDetails);
      console.log("headers for remaining ===>", headers);
      // create prerequisite route  
      const filterPrerequisteRoute = fetchSearchRoute?.data?.data?.filter((route: any) => route.name === `MCO-${upstreamCaData.name.split('-')[2]}`);
      console.log("filterPrerequisteRoute", filterPrerequisteRoute)
      if (filterPrerequisteRoute.length === 0) {
      // console.log("filterPrerequisteRoute123", filterPrerequisteRoute)
        headers.SecurityContext = headers.SecurityContext.replace(headers.SecurityContext?.split('.')[0], 'VPLMProjectLeader');
        try {
          const response = await this.createPrerequisiteRoute(headers, upstreamCaData,productDetails?.FlowdownCAID);
          console.log(`===response of create prerequisite route: ${JSON.stringify(response)}`);
        } catch (error) {
          console.log(error);
        }
        headers.SecurityContext = headers.SecurityContext.replace(headers.SecurityContext?.split('.')[0], 'VPLMProjectAdministrator');
      }

      //Update Classification Attribute to each physical product
      const { updateClassAttributeForPhysicalProdNewURL } = urlConfig;
      const updateClassAttributePromises = rawData.ProductDetails.map(async product => {
        const productPayload: any[] = [];
        product.PlantAssignmentDetails.forEach(detail => {
          productPayload.push({
            classId: detail.ClassId,
            attributes: {
              FlowDownCA: `MCO-${upstreamCaData.name.split('-')[2]}-${detail.ClassName}`
            }
          });
        });
        console.log(`payload of item: ${product.id}\n productPayload: ${JSON.stringify(productPayload)}`);
        const payload = [
          {
            "referencedObject": {
              "source": process.env.SAAS_BASE_URL,
              "type": "dslib:CategorizationClassifiedItem",
              "identifier": product.id,
              "relativePath": `resources/v1/modeler/dslib/dslib:CategorizationClassifiedItem/${product.id}`
            },
            "categorizationAttributes": productPayload
          }
        ];
        try {
          const response = await axios.post(`${updateClassAttributeForPhysicalProdNewURL}`, payload, {
            headers,
            httpsAgent: agent,
          });
          console.log(`======response: ${JSON.stringify(response.data)}`);
        } catch (error) {
          console.error(`Error updating classification attribute of item ${product.id}:`, error);
        }
      });

      await Promise.all(updateClassAttributePromises);

      function delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
      }
      
      async function retry<T>(
        fn: () => Promise<T>,
        retries: number = 3,
        delayMs: number = 3000
      ): Promise<T> {
        let lastError: any;
        console.log("------Came Here inside retry function");
        for (let attempt = 1; attempt <= retries; attempt++) {
          try {
            console.log(`Here is attempt ${attempt}`);
            return await fn();
          } catch (error) {
            lastError = error;
            console.warn(`Attempt ${attempt} failed. Retrying in ${delayMs}ms...`);
            if (attempt < retries) {
              await delay(delayMs);
            }
          }
        }
        throw lastError;
      }

    
      // get realized data, this block is only for revision scenario
      const getRealizedData = await this.fetchCaDetails(productDetails?.FlowdownCAID, headers, caDetailsURL, { $fields: "realizedChanges" });
      const getRealizedDataArray = getRealizedData?.realizedChanges;
      console.log("plantNames", getRealizedDataArray)
      if (getRealizedDataArray?.length > 0) {
        await Promise.all(getRealizedDataArray.map(async (item: any) => {
          if (item?.operations.includes("NewVersion")) {
            let newMfgItemId = item?.where?.identifier;
            //To get the scopelinked eng item of new mfg item
            const getScopeLinkData = await this.getScopeLink(newMfgItemId, headers, mfgItemURL);
            let oldEngItemId = getScopeLinkData?.ScopeEngItem?.identifier;
            console.log("check scope link data", oldEngItemId, newMfgItemId)
            //outputFilterData will srore object's which matches thier oldEngItemId with scopelinked oldEngItemId
            const outputFilterData = output.filter((outputItem: any) => outputItem?.oldEngItemId === oldEngItemId);
            console.log("========output", JSON.stringify(output))
            console.log("========outputFilterData", JSON.stringify(outputFilterData))
            if (outputFilterData.length > 0) {
              // update title and description of new mfg item from new eng item
              if (outputFilterData[0]?.Mbom == outputFilterData[0]?.oldMbom) {

                //Added by SHA - START
                //Here we are getting details of new eng item (outputFilterData[0]?.id - is id of new engItem)
                let physicalProductDetails: any;
                if(outputFilterData[0]?.ProposedChange.where.type == 'Raw_Material') {
                  physicalProductDetails = await this.getRawMaterialDetails(outputFilterData[0]?.id, headers, getRawMaterialInfoURL);
                } else {
                  physicalProductDetails = await this.getProductDetails(outputFilterData[0]?.id, headers, getPhysicalProductInfoURL);
                }
                //Added by SHA - END

                const mfgItemDetails = await this.getMfgDetails(newMfgItemId, headers, mfgItemURL);
                console.log("physicalProductDetails", physicalProductDetails[0]?.title, physicalProductDetails[0]?.description)
                console.log("mfgItemDetails", mfgItemDetails[0]?.title, mfgItemDetails[0]?.description)
                //update the new eng item title and description to mfg item, if it is updated in new revision 
                if (physicalProductDetails[0]?.title != mfgItemDetails[0]?.title || physicalProductDetails[0]?.description != mfgItemDetails[0]?.description) {
                  await this.updateMfgItem(mfgItemDetails[0]?.cestamp, physicalProductDetails[0]?.title, physicalProductDetails[0]?.description, newMfgItemId, headers, mfgItemURL);
                }
              }
              // Remove the scope link between newMfgItem and oldEngItem
              //await this.removeScopeLink(newMfgItemId, headers, outputFilterData[0]?.oldEngItemId, mfgItemURL, productDetails?.FlowdownCAID);
              await retry(() => this.removeScopeLink(newMfgItemId, headers, outputFilterData[0]?.oldEngItemId, mfgItemURL, productDetails?.FlowdownCAID), 3, 3000);
              // Create the scope link between newMfgItem and newEngItem
              const createScopeLink = await this.createScopeLink(newMfgItemId, headers, outputFilterData[0]?.id, mfgItemURL, productDetails?.FlowdownCAID);
              if (createScopeLink.status === 200) {
                const objectToUpdate = output.find(outputItem => outputItem.id === outputFilterData[0]?.id);
                if (objectToUpdate) {
                  objectToUpdate.mfgItemId = newMfgItemId;
                }
              }
            }
            else {
              console.log("check ====>")
              const objectToUpdate = output.find(outputItem => outputItem.id === oldEngItemId);
              if (objectToUpdate) {
                objectToUpdate.mfgItemId = newMfgItemId;
              }
            }
          }
        }));
      }

      console.log("=======output final: ", JSON.stringify(output));
      // update new mfg item id of new eng item, if childEngItemId present as seperate object then we are already generated the mfgItem for that, so we will resuse
      const result = output.map(product => {
        if (product?.childDetails?.length > 0) {
          product.childDetails = product.childDetails.map((child: any) => {
            const matchingChild = output.find(item => item.id === child.childProductId);
            if (matchingChild) {
              return {
                ...child,
                mfgItemId: matchingChild ? matchingChild.mfgItemId : null,
              };
            } else {
              return child;
            }
          });
        }
        return product;
      });

      console.log(`==========result: ${JSON.stringify(result)}`);

      // update mfg item id of old eng item
      const newOutput = await Promise.all(result.map(async (product) => {
        if (product?.oldEngChildData?.length > 0) {
          product.oldEngChildData = await Promise.all(product.oldEngChildData.map(async (child: any) => {
            const matchingChild = result.find(item => item.oldEngItemId === child.childProductId);
            if (matchingChild) {
              return {
                ...child,
                //childMfgItemId: matchingChild ? matchingChild.mfgItemId : null,
                childMfgItemId: matchingChild ? matchingChild.oldMfgItemId : null,

              };
            }
            else {
              //Added by SHA-START
              //Get mfgItem from engItem
              const getMfgItem = await axios.post(
                `${getMfgItemByScopeURL}`,
                [child.childProductId],
                {
                  params: { "$mask": "dsmfg:MfgItem.NavigateMask.utc" },
                  headers,
                  httpsAgent: agent,
                }
              );
              console.log("============getMfgItem", JSON.stringify(getMfgItem.data));
              return {
                ...child,
                childMfgItemId: getMfgItem.data.member.length > 0 ? getMfgItem.data.member[0]?.mfgItemId : null,
              };
              //Added by SHA-END
              //return child;
            }
          }));
        }
        return product;
      }));

      console.log(`==========newOutput: ${JSON.stringify(newOutput)}`);

      const newOutput2 = await Promise.all(newOutput.map(async (product) => {
        if (product?.childDetails?.length > 0 && product?.oldEngChildData?.length > 0) {
            product.childDetails = await Promise.all(product.childDetails.map(async (child) => {
                if (!child?.mfgItemId) {
                    const matchingChild = product.oldEngChildData.find(item => item.childProductId === child.childProductId);
                    if (matchingChild) {
                        const newPhysicalProductDetail = await this.getProductDetails(matchingChild.childProductId, headers, getPhysicalProductInfoURL);
                        return {
                            ...child,
                            mfgItemId: matchingChild ? matchingChild.childMfgItemId : null,
                            type: newPhysicalProductDetail[0]?.type,
                            Mbom: newPhysicalProductDetail[0]["dseno:EnterpriseAttributes"]?.EMR_hasMBOM,
                        };
                    } else {
                        return child;
                    }
                } else {
                    return child;
                }
            }));
        }
        return product;
      }));

      console.log(`==========newOutput2: ${JSON.stringify(newOutput2)}`);

      const newOutput3 = await Promise.all(newOutput2.map(async (product) => {
        if (product?.childDetails?.length > 0) {
          product.childDetails = await Promise.all(product.childDetails.map(async (child) => {
            if (!child?.mfgItemId) {
              const physicalProductDetail = await this.getProductDetails(child.childProductId, headers, getPhysicalProductInfoURL);
              const getMfgItem = await axios.post(`${getMfgItemByScopeURL}`,[child.childProductId],
                {
                  params: { "$mask": "dsmfg:MfgItem.NavigateMask.utc" },
                  headers,
                  httpsAgent: agent,
                }
              );
              return {
                ...child,
                mfgItemId: getMfgItem.data.member.length > 0 ? getMfgItem.data.member[0]?.mfgItemId : null,
                type: physicalProductDetail[0]?.type,
                Mbom: physicalProductDetail[0]["dseno:EnterpriseAttributes"]?.EMR_hasMBOM,
              };
            } else {
                return child;
            }
          }));
        }
        return product;
      }));
      

      console.log(`==========newOutput3: ${JSON.stringify(newOutput3)}`);


      //Logic to promote all mfgItem's to FROZEN state - START
      const promoteMfgItemToFrozenState = async (item: any, headers: any, promoteMfgItemLifecyclePrivateURL: string, fdcaId: string) => {
        try {
          console.log("Came here2");
          const mfgItemDetails = await this.getMfgDetails(item.mfgItemId, headers, mfgItemURL);
          console.log(`mfgItemDetails.data.member[0].name: ${mfgItemDetails[0].name} \n mfgItemDetails.data.member[0].type: ${mfgItemDetails[0].type} \n mfgItemDetails.data.member[0].revision: ${mfgItemDetails[0].revision}`);
          
          const payload = {
            "data": [
              {
                "physicalid": item.mfgItemId,
                "tostate": "FROZEN",
                "fromstate": "IN_WORK",
                "type": mfgItemDetails[0].type,
                "revision": mfgItemDetails[0].revision,
                "policy": "VPLM_SMB_Definition_MajorRev",
                "name": mfgItemDetails[0].name,
                "coretype": "Reference",
                "signature": "ToFreeze"
              }
            ],
            "metrics": {
              "UXName": "Maturity",
              "client_app_domain": "3DEXPERIENCE 3DDashboard",
              "client_app_name": "DELMFNS_AP"
            },
            "notificationTimeout": 3600
          };

          const modifiedHeaders = { ...headers, 'DS-Change-Authoring-Context': `pid:${fdcaId}` };

          console.log("=======payloadOfPromoteMfgItemLifeCycle", payload); 
          console.log("=======modifiedHeadersOfPromoteMfgItemLifeCycle", modifiedHeaders); 

          const responseOfPromoteMfgItemLifeCycle = await axios.post(`${promoteMfgItemLifecyclePrivateURL}`, payload, 
            { params: { "tenant": "OI000186152" }, 
            headers: modifiedHeaders, 
            httpsAgent: agent }
          );
          console.log("=======responseOfPromoteMfgItemLifeCycle", responseOfPromoteMfgItemLifeCycle.data) ; 

        } catch (error) {
          console.log(`Error whe promoting mfgItem to FROZEN state: mfgItemId: ${item.mfgItemId}: ${JSON.stringify(error.response.data.error)}`);
          //throw error;
        }
        return true
      };
      //Logic to promote all mfgItem's to FROZEN state - END

      const result2 = await Promise.all(newOutput3.map(async (item) => {
        if (newOutput3.length > 0) {
          const {promoteMfgItemLifecyclePrivateURL} = urlConfig;
          return promoteMfgItemToFrozenState(item, headers, promoteMfgItemLifecyclePrivateURL, productDetails?.FlowdownCAID);
        }
        return true;
      }));

      //create MBOM for physical product and raw material 
      await Promise.all(newOutput3.map(async (parent: any) => {
        try {
          const newVersionStatus = parent?.ProposedChange?.target == 'NewVersion' ? true : false;
          await this.processChildDetails(parent, headers, productDetails, mfgItemURL, getInstanceURL, baseURL, mfgParentItemURL, mfgParentItemReqBody, mfgParentItemURLParams, newVersionStatus, getRawMaterialDetailsByInstanceURL, expandMfgItemReqBody);
        } catch (error) {
          console.error("Error processing parent", parent.id, error?.response?.data);
          throw error;
        }
      }));
      
      const filtersData = newOutput3?.filter((item: any) => item?.oldEngItemId && item?.oldEngChildData?.length > 0);

      // remove the mfg instance
      await Promise.all(filtersData.map(async (item: any) => {
        for (const child of item.oldEngChildData) {
          if (child.action === 'Cut' && child.childMfgItemId) {
            mfgParentItemReqBody.objectReferences[0].identifier = child.childMfgItemId;
            console.log("mfgParentItemReqBody", JSON.stringify(mfgParentItemReqBody));
            const mfgItemParentDetails = await axios.post(
              `${mfgParentItemURL}`,
              mfgParentItemReqBody,
              {
                params: mfgParentItemURLParams,
                headers,
                httpsAgent: agent,
              }
            );

            const mbomData = mfgItemParentDetails?.data?.member[0]?.['dsmfg:MfgItemInstance'].member.filter(items => items.parentObject.identifier === item.mfgItemId);
            console.log("parentsData====>", JSON.stringify(mbomData));

            if (mbomData?.length > 0) {
              await this.removeMfgInstance(mbomData[0].id, headers, removeMfgInstanceURL, productDetails?.FlowdownCAID);
            }
          }
        }
      }));

      //Transfer ownership of FDCA to plant
      /* if (getRealizedData?.owner != productDetails?.Owner) {
        //   call owner as approver
        await this.addApprover(productDetails?.FlowdownCAID, headers, productDetails?.UpstreamCAID, productDetails?.Owner);
        //Transfer ownership of FDCA
        await this.transferOwnership(productDetails, headers, updateOwnerURL, plantName);             
      } */

      //Update owner as approver of flowdownCA
      await this.addApprover(productDetails?.FlowdownCAID, headers, productDetails?.UpstreamCAID, productDetails?.Owner);
      //Transfer ownership of flowdownCA back to the owner of upstreamCA
      await this.transferOwnership(productDetails, headers, updateOwnerURL, plantName);

      //call transfer ownership for manufacturing items
      let mfgData: { id: any }[] = [];
      await Promise.all(newOutput3.map(async (parent: any) => {
        try {
          const mfgItemBasicResponse = await axios.get(
            `${mfgItemURL}/${parent?.mfgItemId}`,
            {
              params: mfgItemUrlParams,
              headers,
              httpsAgent: agent,
            }
          );
          delete mfgItemBasicResponse.data.nlsLabel;
          //make or buy updates to manufacturing items
          const mfgItemBasicData = mfgItemBasicResponse?.data?.member[0];
          if(mfgItemBasicData?.owner != productDetails?.Owner){
            mfgData.push({ id: parent?.mfgItemId });
          }
        } catch (error) {
          console.error("Error processing parent", parent.mfgItemId);
          throw error;
        }
      }));

      console.log("mfgData", mfgData);

      if(mfgData.length > 0){
        await this.transferOwnershipForMfg(productDetails, headers, updateOwnerURL, plantName, mfgData);
      }

      res.status(200).send({
        success: true,
        message: "MR Automation has been successful",
        output: output
      });

    } catch (error) {
      console.error("error=====>", error);
      res.status(200).send({
        success: false,
        message: "MR Automation has been failed",
      });
    }
  }


  // update mfg item details
  private async updateMfgItem(cestamp: any, title: string, description: string, mfgItemId: string, headers: IHeaders, mfgItemURL: string,): Promise<any> {
    try {
      const payload = {
        "cestamp": cestamp,
        "title": title,
        "description": description
      }
      const response = await axios.patch(`${mfgItemURL}/${mfgItemId}`, payload, {
        headers,
        httpsAgent: agent,
      });
      console.log("updateMfgItem", response.data);
      return response.data;
    } catch (error) {
      const errorMessage = error?.response?.data?.errorMessage;
      console.error(`Error while update mfg item details : ${errorMessage},${mfgItemId}`);
      throw error;

    }
  }

  private async createPrerequisiteRoute(
    headers: IHeaders,
    upstreamCaData: any,
    fdcaId: string
  ): Promise<any> {
    try {
      const { createRouteURL } = urlConfig;
      const payload = {
        "data": [
          {
            "title": `MCO-${upstreamCaData.name.split('-')[2]}`,
             "name": `MCO-${upstreamCaData.name.split('-')[2]}`,
            "description": "engineering approval route",
            "routeBasePurpose": "Standard",
            "AutoStopOnRejection": "Immediate",
            "routeCompletionAction": "Notify Route Owner",
            "DemoteOnRejection": "No",
            "attRestrictMembers": "Organization",
            "preserveTaskOwner": "False",
            "requiresEsign": "False",
            "templateId": "474D0026BAA60F0067B320000000884C",
            "contentIds": fdcaId,
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
                "taskAssigneeUsername": "emrserviceuser",
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
      return;
     // console.error(`Error when Creating Route:`, error?.response?.data);
    //  throw error?.response?.data;
    }
  }

  private async updateRoute(
    headers: IHeaders,
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

  private async createRoute(
    headers: IHeaders,
    upstreamCaData: any,
    item: string,
    fdcaId: string  
  ): Promise<any> {
    try {
      const { createRouteURL } = urlConfig;
      const payload = {
        "data": [
          {
            "title": `MCO-${upstreamCaData.name.split('-')[2]}-${item}`,
             "name": `MCO-${upstreamCaData.name.split('-')[2]}-${item}`,
            "description": "engineering approval route",
            "routeBasePurpose": "Approval",
            "AutoStopOnRejection": "Immediate",
            "routeCompletionAction": "Promote Connected Object",
            "DemoteOnRejection": "No",
            "attRestrictMembers": "Organization",
            "preserveTaskOwner": "False",
            "requiresEsign": "False",
            "templateId": "6B8F27BD75FF0D0067B2B917000041B2",
            "contentIds": fdcaId,
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
                "taskAssigneeUsername": "emrserviceuser",
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
                "taskAssigneeUsername": "emrserviceuser",
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
      return;
    //  console.error(`Error when Creating Route:`, error?.response?.data);
     // throw error?.response?.data;
    }
  }

  private async addApprover(
    getFdcaId: string,
    headers: IHeaders,
    upstreamCaId: any,
    ownerId: string
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
        "cestamp": fdcaDetailsResponse.data.cestamp,
        "add": [
          {
            "members": [
              {
                "reviewers": ["emrserviceuser"],
              },
              {
                "followers": [ownerId]
              }
            ]
          }
        ]
        // "remove": [
        //   {
        //     "members": [
        //       {
        //         "followers": ["emrserviceuser"]
        //         // fdcaDetailsResponse.data.owner

        //       }
        //     ]
        //   }
        // ]
      };
      console.log("payload of approver", JSON.stringify(payload));
      const response = await axios.patch(`${modifyCaURL}/${getFdcaId}`,
        payload,
        {
          headers,
          httpsAgent: agent,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error while adding owner as approver for: ${getFdcaId}:`, error?.response?.data);
      throw error?.response?.data;
    }
  }



  private async getInstanceId(productDetails: any, productId: string): Promise<any> {
    try {
      let instanceId: string = '';
      productDetails?.forEach((item: any) => {
        if (item.childDetails?.length > 0) {
          item.childDetails?.forEach((child: any) => {
            if (child.childProductId == productId) {
              instanceId = child.instanceId;
            }
          });
        }
      });
      return instanceId;
    } catch (error) {
      console.error(`Error creating manufacturing item for product ${productId}:`, error?.response?.data);
      throw error;
    }
  }

  private async processChildDetails(parent: any, headers: IHeaders, productDetails: any, mfgItemURL: string, getInstanceURL: string, baseURL: string, mfgParentItemURL: string, mfgParentItemReqBody: any, mfgParentItemURLParams: any, newVersionStatus: boolean, getRawMaterialDetailsByInstanceURL: string, expandMfgItemReqBody): Promise<void> {
    if (parent.childDetails && parent.childDetails.length > 0) {
      console.log(`---Processing child details for parent ${parent.id}-${parent.mfgItemId}`);
      await Promise.all(parent.childDetails.map(async (child: any) => {
        try {
          console.log(`======parent.Mbom: ${parent.Mbom}, child.mfgItemId: ${child.mfgItemId}, newVersionStatus: ${newVersionStatus}, child.action: ${child.action}`);

          // when product is make then need to create MBOM
          //SHA-here if newVersionStatus = true, then child.action should be 'Add', or if newVersionStatus = false, it will return true
          if (parent.Mbom && child.mfgItemId != null && (newVersionStatus ? child?.action === 'Add' : true)) {

            mfgParentItemReqBody.objectReferences[0].identifier = child.mfgItemId;
            //Get the parent Mfg Item details of child mfgItem using Locate API
            const mfgItemParentDetails = await axios.post(
              `${mfgParentItemURL}`,
              mfgParentItemReqBody,
              {
                params: mfgParentItemURLParams,
                headers,
                httpsAgent: agent,
              }
            );
            const parentsData = mfgItemParentDetails?.data?.member[0]?.['dsmfg:MfgItemInstance'].member.filter(items => items.parentObject.identifier === parent.mfgItemId);
            console.log("parentsData", parentsData);
            let reqBody: any;
            //This block is for reprocess, if mbom is already created means child mfgItem has been created
            if (parentsData?.length > 0) {
              child.mbomData = parentsData[0];
              if (child.type == "Raw_Material") {
                //Here, child.id is not valid, but that value is no where used, fix it later
                const getRawMaterailDetails = await this.getProductDetailsForRawMaterialByInstance(child.id, headers, getRawMaterialDetailsByInstanceURL, child.instanceId);
                reqBody = {
                  quantity: {
                    inputUnit: getRawMaterailDetails[0]?.quantityUOM?.dbName,
                    inputValue: getRawMaterailDetails[0]?.quantity,
                    magnitude: getRawMaterailDetails[0]?.dimensionType
                  },
                };
              }
              const responseEngIstance = await axios.get(`${getInstanceURL}/${parent.id}/dseng:EngInstance/${child?.instanceId}`, {
                params: {
                  "$mask": "dsmveng:EngInstanceMask.Filterable",
                  "$fields": "dsmveno:CustomerAttributes,dsmvcfg:attribute.hasConfiguredInstance,dsmvxcad:attribute.XCADGenericInstExtension.FindNumber"
                },
                headers,
                httpsAgent: agent
              });
              const responseMfgInstance = await axios.get(`${mfgItemURL}/${parent.mfgItemId}/dsmfg:MfgItemInstance/${child?.mbomData?.id}`, {
                params: {
                  "$mask": "dsmfg:MfgItemInstanceMask.Details",
                  "$fields": "dsmveno:CustomerAttributes"
                },
                headers,
                httpsAgent: agent
              });
              for (let key in responseEngIstance?.data?.member[0]?.customerAttributes) {
                if (key.startsWith("MBOMAttributes__")) {
                  let mbomAttributes = responseEngIstance?.data?.member[0]?.customerAttributes[key];
                  /* for (let attrKey in mbomAttributes) {
                    if (attrKey.includes("MBOMReferenceDesignator")) {
                      mbomAttributes[attrKey] = responseEngIstance?.data?.member[0]?.name;
                    }
                  } */
                }
              }
              const engKey = Object.keys(responseEngIstance?.data?.member[0]?.customerAttributes).find(key => key.startsWith('MBOMAttributes__'));
              const mfgKey = Object.keys(responseMfgInstance?.data?.member[0]?.customerAttributes).find(key => key.startsWith('MBOMAttributes__'));
              if (engKey && mfgKey) {
                const engAttributes = responseEngIstance?.data?.member[0]?.customerAttributes[engKey];
                const mfgAttributes = responseMfgInstance?.data?.member[0]?.customerAttributes[mfgKey];
                const engName = responseEngIstance?.data?.member[0]?.name;
                const mfgName = responseMfgInstance?.data?.member[0]?.name;
                const areAttributesEqual = Object.keys(engAttributes).every(key => engAttributes[key] === mfgAttributes[key]);
                const areNamesEqual = engName === mfgName;
                const areEqual = areAttributesEqual && areNamesEqual;
                console.log(`Are MBOMAttributes and names equal? ${areEqual}`);
                if (!areEqual) {
                  reqBody = {
                    ...reqBody,
                    "cestamp": responseMfgInstance?.data?.member[0]?.cestamp,
                    "name": responseEngIstance?.data?.member[0]?.name,
                    "customerAttributes": responseEngIstance?.data?.member[0]?.customerAttributes,
                  };
                  console.log("reqBody1", JSON.stringify(reqBody))
                  const modifiedHeaders = { ...headers, 'DS-Change-Authoring-Context': `pid:${productDetails?.FlowdownCAID}` };
                  console.log(`=====modifiedHeaders1: ${JSON.stringify(modifiedHeaders)}`);
                  await axios.patch(`${mfgItemURL}/${parent.mfgItemId}/dsmfg:MfgItemInstance/${child.mbomData?.id}`, reqBody, { headers: modifiedHeaders, httpsAgent: agent });
                }
              } 
              // else {
              //   reqBody = {
              //     ...reqBody,
              //     "cestamp": responseMfgInstance?.data?.member[0]?.cestamp,
              //     "customerAttributes": responseEngIstance?.data?.member[0]?.customerAttributes,
              //   };
              //   console.log("reqBody2", JSON.stringify(reqBody))
              //   const modifiedHeaders = { ...headers, 'DS-Change-Authoring-Context': `pid:${productDetails?.FlowdownCAID}` };
              //    await axios.patch(`${mfgItemURL}/${parent.mfgItemId}/dsmfg:MfgItemInstance/${child.mbomData?.id}`, reqBody, { headers: modifiedHeaders, httpsAgent: agent });
              // }
            } else {
              console.log("create mbom data")
              const result = await this.createMBOM(parent.mfgItemId, headers, child.mfgItemId, mfgItemURL, child.type, child.Mbom, productDetails.FlowdownCAID, baseURL);
              child.mbomData = result?.member[0];

              if (child.type == "Raw_Material") {
                const getRawMaterailDetails = await this.getProductDetailsForRawMaterialByInstance(child.id, headers, getRawMaterialDetailsByInstanceURL, child.instanceId);
                reqBody = {
                  quantity: {
                    inputUnit: getRawMaterailDetails[0]?.quantityUOM?.dbName,
                    inputValue: getRawMaterailDetails[0]?.quantity,
                    magnitude: getRawMaterailDetails[0]?.dimensionType
                  },
                };
              }
              const response = await axios.get(`${getInstanceURL}/${parent.id}/dseng:EngInstance/${child?.instanceId}`, {
                params: {
                  "$mask": "dsmveng:EngInstanceMask.Filterable",
                  "$fields": "dsmveno:CustomerAttributes,dsmvcfg:attribute.hasConfiguredInstance,dsmvxcad:attribute.XCADGenericInstExtension.FindNumber"
                },
                headers,
                httpsAgent: agent
              });
              for (let key in response?.data?.member[0]?.customerAttributes) {
                if (key.startsWith("MBOMAttributes__")) {
                  let mbomAttributes = response?.data?.member[0]?.customerAttributes[key];
                  /* for (let attrKey in mbomAttributes) {
                    if (attrKey.includes("MBOMReferenceDesignator")) {
                      mbomAttributes[attrKey] = response?.data?.member[0]?.name;
                    }
                  } */
                }
              }
              reqBody = {
                ...reqBody,
                "cestamp": child.mbomData?.cestamp,
                "name": response?.data?.member[0]?.name,
                "customerAttributes": response?.data?.member[0]?.customerAttributes,
              };

              console.log("reqBody3", JSON.stringify(reqBody))
              const modifiedHeaders = { ...headers, 'DS-Change-Authoring-Context': `pid:${productDetails?.FlowdownCAID}` };
                await axios.patch(`${mfgItemURL}/${parent.mfgItemId}/dsmfg:MfgItemInstance/${child.mbomData?.id}`, reqBody, { headers: modifiedHeaders, httpsAgent: agent });
            }
          } else {

            if(parent.Mbom && parent.oldMbom) {
              mfgParentItemReqBody.objectReferences[0].identifier = child.mfgItemId;
              //Get the parent Mfg Item details of child mfgItem using Locate API
              const mfgItemParentDetails = await axios.post(
                `${mfgParentItemURL}`,
                mfgParentItemReqBody,
                {
                  params: mfgParentItemURLParams,
                  headers,
                  httpsAgent: agent,
                }
              );
              const parentsData = mfgItemParentDetails?.data?.member[0]?.['dsmfg:MfgItemInstance'].member.filter(items => items.parentObject.identifier === parent.mfgItemId);
              child.mbomData = parentsData[0];
              let reqBody: any;
              if (child.type == "Raw_Material") {
                //Here, child.id is not valid, but that value is no where used, fix it later
                const getRawMaterailDetails = await this.getProductDetailsForRawMaterialByInstance(child.id, headers, getRawMaterialDetailsByInstanceURL, child.instanceId);
                reqBody = {
                  quantity: {
                    inputUnit: getRawMaterailDetails[0]?.quantityUOM?.dbName,
                    inputValue: getRawMaterailDetails[0]?.quantity,
                    magnitude: getRawMaterailDetails[0]?.dimensionType
                  },
                };
              }
              const responseEngIstance = await axios.get(`${getInstanceURL}/${parent.id}/dseng:EngInstance/${child?.instanceId}`, {
                params: {
                  "$mask": "dsmveng:EngInstanceMask.Filterable",
                  "$fields": "dsmveno:CustomerAttributes,dsmvcfg:attribute.hasConfiguredInstance,dsmvxcad:attribute.XCADGenericInstExtension.FindNumber"
                },
                headers,
                httpsAgent: agent
              });
              const responseMfgInstance = await axios.get(`${mfgItemURL}/${parent.mfgItemId}/dsmfg:MfgItemInstance/${child.mbomData?.id}`, {
                params: {
                  "$mask": "dsmfg:MfgItemInstanceMask.Details",
                  "$fields": "dsmveno:CustomerAttributes"
                },
                headers,
                httpsAgent: agent
              });
              for (let key in responseEngIstance?.data?.member[0]?.customerAttributes) {
                if (key.startsWith("MBOMAttributes__")) {
                  let mbomAttributes = responseEngIstance?.data?.member[0]?.customerAttributes[key];
                  /* for (let attrKey in mbomAttributes) {
                    if (attrKey.includes("MBOMReferenceDesignator")) {
                      mbomAttributes[attrKey] = responseEngIstance?.data?.member[0]?.name;
                    }
                  } */
                }
              }
              const engKey = Object.keys(responseEngIstance?.data?.member[0]?.customerAttributes).find(key => key.startsWith('MBOMAttributes__'));
              const mfgKey = Object.keys(responseMfgInstance?.data?.member[0]?.customerAttributes).find(key => key.startsWith('MBOMAttributes__'));
              if (engKey && mfgKey) {
                const engAttributes = responseEngIstance?.data?.member[0]?.customerAttributes[engKey];
                const mfgAttributes = responseMfgInstance?.data?.member[0]?.customerAttributes[mfgKey];
                const engName = responseEngIstance?.data?.member[0]?.name;
                const mfgName = responseMfgInstance?.data?.member[0]?.name;
                const areAttributesEqual = Object.keys(engAttributes).every(key => engAttributes[key] === mfgAttributes[key]);
                const areNamesEqual = engName === mfgName;
                const areEqual = areAttributesEqual && areNamesEqual;
                console.log(`Are MBOMAttributes and names equal? ${areEqual}`);
                if (!areEqual) {
                  reqBody = {
                    ...reqBody,
                    "cestamp": responseMfgInstance?.data?.member[0]?.cestamp,
                    "name": responseEngIstance?.data?.member[0]?.name,
                    "customerAttributes": responseEngIstance?.data?.member[0]?.customerAttributes,
                  };
                  console.log("reqBody1", JSON.stringify(reqBody))
                  const modifiedHeaders = { ...headers, 'DS-Change-Authoring-Context': `pid:${productDetails?.FlowdownCAID}` };
                  console.log(`=====modifiedHeaders2: ${JSON.stringify(modifiedHeaders)}`);
                  await axios.patch(`${mfgItemURL}/${parent.mfgItemId}/dsmfg:MfgItemInstance/${child.mbomData?.id}`, reqBody, { headers: modifiedHeaders, httpsAgent: agent });
                }
              } 
            } else if(parent.Mbom && !parent.oldMbom) { 
              console.log("create mbom data - Parent.mbom = true && parent.oldMbom = false");
              let reqBody: any;

              //Logic to update the custom revision on parent mfg Item - START
              /* const payload = {
                data: [
                  {
                    id: parent.mfgItemId,
                    nextState: "RELEASED",
                  },
                ],
              };
              console.log(`=====Payload of promoteMfgItemToReleasedState: ${JSON.stringify(payload)}`);
              const { promoteFdcaToAnyStateURL } = urlConfig;
              try{
                const promoteMfgItemToReleasedState = await axios.post(`${promoteFdcaToAnyStateURL}`,payload,{ headers, httpsAgent: agent });
                console.log(`=====Response of promoteMfgItemToReleasedState: ${JSON.stringify(promoteMfgItemToReleasedState.data)}`);
              } catch(error){
                console.log(error);
              }
              const {customRevision} = urlConfig;
              const modifiedHeadersForCustomRevision = { ...headers, 'SecurityContext': `VPLMAdmin.Company%20Name.Default` };
              console.log(`=====modifiedHeadersForCustomRevision: ${JSON.stringify(modifiedHeadersForCustomRevision)}`);
              try {
                const customRevisionResponse = await axios.post(`${customRevision}`, {
                  params: {
                    "withAttributes": "1",
                    "withCopyFrom": "1",
                    "credentials": "include"
                  },
                  headers: modifiedHeadersForCustomRevision,
                  httpsAgent: agent
                });
                console.log(`=====Response of customRevisionResponse: ${JSON.stringify(customRevisionResponse.data)}`);
                parent.mfgItemId = customRevisionResponse.data.addRequests[0].id;
              } catch(error) {
                console.log(error);
              } */
              //Logic to update the custom revision on parent mfg Item - END

              const result = await this.createMBOM(parent.mfgItemId, headers, child.mfgItemId, mfgItemURL, child.type, child.Mbom, productDetails.FlowdownCAID, baseURL);
              child.mbomData = result?.member[0];

              if (child.type == "Raw_Material") {
                const getRawMaterailDetails = await this.getProductDetailsForRawMaterialByInstance(child.id, headers, getRawMaterialDetailsByInstanceURL, child.instanceId);
                reqBody = {
                  quantity: {
                    inputUnit: getRawMaterailDetails[0]?.quantityUOM?.dbName,
                    inputValue: getRawMaterailDetails[0]?.quantity,
                    magnitude: getRawMaterailDetails[0]?.dimensionType
                  },
                };
              }
              const response = await axios.get(`${getInstanceURL}/${parent.id}/dseng:EngInstance/${child?.instanceId}`, {
                params: {
                  "$mask": "dsmveng:EngInstanceMask.Filterable",
                  "$fields": "dsmveno:CustomerAttributes,dsmvcfg:attribute.hasConfiguredInstance,dsmvxcad:attribute.XCADGenericInstExtension.FindNumber"
                },
                headers,
                httpsAgent: agent
              });
              for (let key in response?.data?.member[0]?.customerAttributes) {
                if (key.startsWith("MBOMAttributes__")) {
                  let mbomAttributes = response?.data?.member[0]?.customerAttributes[key];
                  /* for (let attrKey in mbomAttributes) {
                    if (attrKey.includes("MBOMReferenceDesignator")) {
                      mbomAttributes[attrKey] = response?.data?.member[0]?.name;
                    }
                  } */
                }
              }
              reqBody = {
                ...reqBody,
                "cestamp": child.mbomData?.cestamp,
                "name": response?.data?.member[0]?.name,
                "customerAttributes": response?.data?.member[0]?.customerAttributes,
              };

              console.log("reqBody3", JSON.stringify(reqBody))
              const modifiedHeaders = { ...headers, 'DS-Change-Authoring-Context': `pid:${productDetails?.FlowdownCAID}` };
              console.log(`=====modifiedHeaders: ${JSON.stringify(modifiedHeaders)}`);
              await axios.patch(`${mfgItemURL}/${parent.mfgItemId}/dsmfg:MfgItemInstance/${child.mbomData?.id}`, reqBody, { headers: modifiedHeaders, httpsAgent: agent });
              
            } else {
              console.log("Update mbom data - Parent.mbom = false && parent.oldMbom = true  Also Parent.mbom = false && parent.oldMbom = false");
              console.log("----Do Nothing----");

              //Logic to update the custom revision on parent mfg Item - START
              /* const payload = {
                data: [
                  {
                    id: parent.mfgItemId,
                    nextState: "RELEASED",
                  },
                ],
              };
              console.log(`=====Payload of promoteMfgItemToReleasedState: ${JSON.stringify(payload)}`);
              const { promoteFdcaToAnyStateURL } = urlConfig;
              try{
                const promoteMfgItemToReleasedState = await axios.post(`${promoteFdcaToAnyStateURL}`,payload,{ headers, httpsAgent: agent });
                console.log(`=====Response of promoteMfgItemToReleasedState: ${JSON.stringify(promoteMfgItemToReleasedState.data)}`);
              } catch(error){
                console.log(error);
              }
              const {customRevision} = urlConfig;
              const modifiedHeadersForCustomRevision = { ...headers, 'SecurityContext': `VPLMAdmin.Company%20Name.Default` };
              console.log(`=====modifiedHeadersForCustomRevision: ${JSON.stringify(modifiedHeadersForCustomRevision)}`);
              try {
                const customRevisionResponse = await axios.post(`${customRevision}`, {
                  params: {
                    "withAttributes": "1",
                    "withCopyFrom": "1",
                    "credentials": "include"
                  },
                  headers: modifiedHeadersForCustomRevision,
                  httpsAgent: agent
                });
                console.log(`=====Response of customRevisionResponse: ${JSON.stringify(customRevisionResponse.data)}`);
                parent.mfgItemId = customRevisionResponse.data.addRequests[0].id;
              } catch(error) {
                console.log(error);
              } */
              //Logic to update the custom revision on parent mfg Item - END

              //const result = await this.createMBOM(parent.mfgItemId, headers, child.mfgItemId, mfgItemURL, child.type, child.Mbom, productDetails.FlowdownCAID, baseURL);
              //child.mbomData = result?.member[0];

             /*  mfgParentItemReqBody.objectReferences[0].identifier = child.mfgItemId;
              //Get the parent Mfg Item details of child mfgItem using Locate API
              const mfgItemParentDetails = await axios.post(
                `${mfgParentItemURL}`,
                mfgParentItemReqBody,
                {
                  params: mfgParentItemURLParams,
                  headers,
                  httpsAgent: agent,
                }
              );
              const parentsData = mfgItemParentDetails?.data?.member[0]?.['dsmfg:MfgItemInstance'].member.filter(items => items.parentObject.identifier === parent.mfgItemId);
              child.mbomData = parentsData[0];
              let reqBody: any;
              if (child.type == "Raw_Material") {
                //Here, child.id is not valid, but that value is no where used, fix it later
                const getRawMaterailDetails = await this.getProductDetailsForRawMaterialByInstance(child.id, headers, getRawMaterialDetailsByInstanceURL, child.instanceId);
                reqBody = {
                  quantity: {
                    inputUnit: getRawMaterailDetails[0]?.quantityUOM?.dbName,
                    inputValue: getRawMaterailDetails[0]?.quantity,
                    magnitude: getRawMaterailDetails[0]?.dimensionType
                  },
                };
              }
              const responseEngIstance = await axios.get(`${getInstanceURL}/${parent.id}/dseng:EngInstance/${child?.instanceId}`, {
                params: {
                  "$mask": "dsmveng:EngInstanceMask.Filterable",
                  "$fields": "dsmveno:CustomerAttributes,dsmvcfg:attribute.hasConfiguredInstance,dsmvxcad:attribute.XCADGenericInstExtension.FindNumber"
                },
                headers,
                httpsAgent: agent
              });
              const responseMfgInstance = await axios.get(`${mfgItemURL}/${parent.mfgItemId}/dsmfg:MfgItemInstance/${child.mbomData?.id}`, {
                params: {
                  "$mask": "dsmfg:MfgItemInstanceMask.Details",
                  "$fields": "dsmveno:CustomerAttributes"
                },
                headers,
                httpsAgent: agent
              });
              for (let key in responseEngIstance?.data?.member[0]?.customerAttributes) {
                if (key.startsWith("MBOMAttributes__")) {
                  let mbomAttributes = responseEngIstance?.data?.member[0]?.customerAttributes[key];
                  for (let attrKey in mbomAttributes) {
                    if (attrKey.includes("MBOMReferenceDesignator")) {
                      mbomAttributes[attrKey] = responseEngIstance?.data?.member[0]?.name;
                    }
                  }
                }
              }
              const engKey = Object.keys(responseEngIstance?.data?.member[0]?.customerAttributes).find(key => key.startsWith('MBOMAttributes__'));
              const mfgKey = Object.keys(responseMfgInstance?.data?.member[0]?.customerAttributes).find(key => key.startsWith('MBOMAttributes__'));
              if (engKey && mfgKey) {
                const engAttributes = responseEngIstance?.data?.member[0]?.customerAttributes[engKey];
                const mfgAttributes = responseMfgInstance?.data?.member[0]?.customerAttributes[mfgKey];
                const areEqual = Object.keys(engAttributes).every(key => engAttributes[key] === mfgAttributes[key]);
                console.log(`Are MBOMAttributes equal? ${areEqual}`);
                if (!areEqual) {
                  reqBody = {
                    ...reqBody,
                    "cestamp": responseMfgInstance?.data?.member[0]?.cestamp,
                    "customerAttributes": responseEngIstance?.data?.member[0]?.customerAttributes,
                  };
                  console.log("reqBody1", JSON.stringify(reqBody))
                  const modifiedHeaders = { ...headers, 'DS-Change-Authoring-Context': `pid:${productDetails?.FlowdownCAID}` };
                    await axios.patch(`${mfgItemURL}/${parent.mfgItemId}/dsmfg:MfgItemInstance/${child.mbomData?.id}`, reqBody, { headers: modifiedHeaders, httpsAgent: agent });
                }
              } */
            }


          }
        } catch (error) {
          console.error(`Error processing child ${child.instanceId} of ${parent?.id}: ${error?.response?.data}`);
          throw error;
        }
      }));
    }
  }



  private async connectMbomItemToFdca(getFdcaId: any, getManufacturingItemId: any, getManufacturingItemType: any, headers: IHeaders, getCestamp: any, getConnectMbomItemToFdcaURL: string, target: string, what: string, baseURL: string): Promise<any> {
    try {
      const payload = {
        cestamp: getCestamp,
        add: [
          {
            proposedChanges: [
              {
                where: {
                  source: baseURL,
                  type: getManufacturingItemType,
                  identifier: getManufacturingItemId,
                  relativePath: `/resources/v1/modeler/dsmfg/dsmfg:MfgItem/${getManufacturingItemId}`,
                },
                target: target,
                whats: [
                  {
                    what: what,
                    why: ""
                  }
                ]
              },
            ],
          },
        ],
      };
      console.log(`---payload of connectMbomItemToFdca: ${JSON.stringify(payload)}`);
      //  console.log("headers",headers)
      const response = await axios.patch(`${getConnectMbomItemToFdcaURL}/${getFdcaId}`,
        payload,
        {
          headers,
          httpsAgent: agent,
        }
      );
      //  console.log("---response of connectMbomItemToFdca", response.data);
      return response.data;
    } catch (error) {
      const errorMessage = error.response.data.errorMessage;
      console.error(`Connect Flow down error message: ${errorMessage},${getManufacturingItemId}`);
      throw error.response.data;
    }
  }

  private async transferOwnership(productDetails: any, headers: IHeaders, updateOwnerURL: string, plantName: string): Promise<any> {
    try {
      const payload = {
        "owner": productDetails?.Owner,
        "organization": plantName,
        "collabspace": productDetails?.CollabSpace,
        "data": [
          {
            "id": productDetails?.FlowdownCAID,
          }
        ]
      }
      const response = await axios.post(`${updateOwnerURL}`, payload, {
        headers,
        httpsAgent: agent,
      });
      return response.data;
    } catch (error) {
      const errorMessage = error?.response?.data?.errorMessage;
      console.error(`Error while transfer ownership for flow down CA : ${errorMessage},${productDetails?.FlowdownCAID}`);
      throw error;

    }
  }

  private async transferOwnershipForMfg(productDetails: any, headers: IHeaders, updateOwnerURL: string, plantName: string, dataArray: any): Promise<any> {
    try {
      const payload = {
        "owner": productDetails?.Owner,
        "organization": plantName,
        "collabspace": productDetails?.CollabSpace,
        "data": dataArray
      }
      console.log("payload", JSON.stringify(payload));
      const response = await axios.post(`${updateOwnerURL}`, payload, {
        headers,
        httpsAgent: agent,
      });

      console.log("response=====>", JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      const errorMessage = error?.response?.data;
      console.error(`Error while transfer ownership for mfg: ${JSON.stringify(errorMessage)}`);
      throw error;
    }
  }
  private async promoteFdcaToInWork(getFdcaId: any, headers: IHeaders, getUpdateFdcaToInWorkURL: string, state: string): Promise<any> {
    try {
      const payload = {
        data: [
          {
            id: getFdcaId,
            nextState: state
          },
        ],
      };
      console.log("payload of promote flowdownca", JSON.stringify(payload));
      const response = await axios.post(`${getUpdateFdcaToInWorkURL}`, payload, {
        headers,
        httpsAgent: agent,
      });
      console.log("response", JSON.stringify(response.data))
      return response.data;

    } catch (error) {
      const errorMessage = error?.response?.data?.errorMessage;
      console.error(`Error while promoting FDCA to In-Work for flowDownCA : ${errorMessage},${getFdcaId}`);
      throw error?.response?.data;
    }
  }

  private async promoteMfgItemLifeCycle(mfgItemId: any, headers: IHeaders, getUpdateFdcaToInWorkURL: string, state: string): Promise<any> {
    try {
      const payload = {
        data: [
          {
            id: mfgItemId,
            nextState: state
          },
        ],
      };
      console.log("payload of promote mfgItem lifecycle", JSON.stringify(payload));
      const response = await axios.post(`${getUpdateFdcaToInWorkURL}`, payload, {
        headers,
        httpsAgent: agent,
      });
      console.log("Response of promote mfgItem Lifecycle", JSON.stringify(response.data))
      return response.data;

    } catch (error) {
      const errorMessage = error?.response?.data?.errorMessage;
      console.error(`Error while promoting mfgItem lifecycle : ${errorMessage},${mfgItemId}`);
      throw error?.response?.data;
    }
  }

  private async fetchCaDetails(caId: any, headers: IHeaders, caDetailsURL: string, caUrlParams: any): Promise<any> {
    try {
      const response = await axios.get(`${caDetailsURL}/${caId}`,
        {
          params: caUrlParams,
          headers,
          httpsAgent: agent,
        });
      return response.data;
    } catch (error) {
      const errorMessage = error?.response?.data?.errorMessage;
      console.error(`Error fetching CA details for ID ${caId}: ${errorMessage}`);
      throw error;
    }
  }

  private async processItem(product: any, headers: IHeaders, Organization: string, urls: any): Promise<any> {
    try {
      const type = product.Mbom ? 'CreateAssembly' : 'Provide';
      const getMembers = await this.getProductDetails(product.id, headers, urls.getPhysicalProductInfoURL);
      const collabspace = getMembers[0]?.collabspace;
      const items = {
        title: getMembers[0]?.title,
        description: getMembers[0]?.description,
        ...(getMembers[0]?.['dseng:EnterpriseReference']?.['partNumber'] && {
          "dsmfg:EnterpriseReference": getMembers[0]?.['dseng:EnterpriseReference']
        }),
        ...(product.Mbom && {
          isLotNumberRequired: true,
          isSerialNumberRequired: true,
          outsourced: "Yes",
          planningRequired: "Yes",
          targetReleaseDate: this.generateFormattedDate(),
          spareManufacturedItem: true
        })
      };
      console.log("items", JSON.stringify(items), type);
      const result = await this.createMfgItem(urls.mfgItemURL, items, headers, type, collabspace, product.id, Organization, product.Operations);
      return result;
    } catch (error) {
      console.error(`Error processing item ${product.id}:`, error?.response?.data);
      throw error;
    }
  }


  private async processItemForRawMaterial(product: any, headers: IHeaders, Organization: string, instanceId: string, urls: any): Promise<any> {
    try {
      const type = product.Mbom ? 'ProcessContinuousCreateMaterial' : 'ProcessContinuousProvide';
      const getMembers = await this.getProductDetailsForRawMaterial(product.id, headers, urls.getRawMaterialDetailsURL);
      const getRawMaterailDetails = await this.getProductDetailsForRawMaterialByInstance(product.id, headers, urls.getRawMaterialDetailsByInstanceURL, instanceId);
      const collabspace = getMembers[0]?.collabspace;
      const items = {
        title: getMembers[0]?.title,
        description: getMembers[0]?.description,
        magnitude: getRawMaterailDetails[0]?.dimensionType,
        ...product.Mbom && {
          refQuantity: {
            inputUnit: getRawMaterailDetails[0]?.quantityUOM?.dbName,
            inputValue: getRawMaterailDetails[0]?.quantity,
            magnitude: getRawMaterailDetails[0]?.dimensionType
          },
        },
        ...(getMembers[0]?.['dseng:EnterpriseReference']?.['partNumber'] && {
          "dsmfg:EnterpriseReference": getMembers[0]?.['dseng:EnterpriseReference']
        }),

      };
      const result = await this.createMfgItem(urls.mfgItemURL, items, headers, type, collabspace, product?.id, Organization, product?.operations);
      return result;
    } catch (error) {
      console.error(`Error processing item ${product.id}:`, error?.response?.data);
      throw error;
    }
  }
  private async createScopeLink(mfgItemId: string, headers: IHeaders, productId: string, mfgItemURL: string, flowDownCAId: string): Promise<any> {
    console.log("Creating scope link for", mfgItemId, productId);
    try {
      console.log(`Request to create scope link between newMfgItemId: ${mfgItemId} and newEngItemId: ${productId}`);
      const payload = {
        "identifier": productId,
        "source": "https://oi000186152-us1-acspace.3dexperience.3ds.com/3DSpace",
        "relativePath": `/resources/v1/modeler/dseng/dseng:EngItem/${productId}`,
        "type": "VPMReference",
        "syncEIN": true
      };
      const modifiedHeaders = { ...headers, 'DS-Change-Authoring-Context': `pid:${flowDownCAId}` };
      const response = await axios.post(`${mfgItemURL}/${mfgItemId}/dsmfg:ScopeEngItem/attach`, payload, { headers: modifiedHeaders, httpsAgent: agent });
      console.log(`Response of create scope link between newMfgItemId: ${mfgItemId} and newEngItemId: ${productId}: `, response?.data);
      return response?.data;
    } catch (error) {
      console.error(`Error while creating scope link between newMfgItemId: ${mfgItemId} and newEngItemId: ${productId}:`, error?.response?.data);
      throw error;
    }
  }

  private async createScopeLinkInitial(mfgItemId: string, headers: IHeaders, productId: string, mfgItemURL: string, type: string): Promise<any> {
    try {
      const payload = {
        "identifier": productId,
        "source": "https://oi000186152-us1-acspace.3dexperience.3ds.com/3DSpace",
        "relativePath": `/resources/v1/modeler/dseng/dseng:EngItem/${productId}`,
        "type": type,
        "syncEIN": true
      };
      console.log("payload of createScopeLinkInitial", JSON.stringify(payload))
      const response = await axios.post(`${mfgItemURL}/${mfgItemId}/dsmfg:ScopeEngItem/attach`, payload, { headers, httpsAgent: agent });
      console.log(`---Scope link created for ${response?.data}`);
      return response?.data;

    } catch (error) {
      console.error(`Error creating scope link for initial ${mfgItemId}:`, error?.response?.data);
      throw error;
    }
  }

  private async removeScopeLink(mfgItemId: string, headers: IHeaders, productId: string, mfgItemURL: string, flowDownCAId: string): Promise<any> {
    try {
      console.log(`Request to remove the scope link between newMfgItemId: ${mfgItemId} and oldEngItemId: ${productId}`);
      const payload = {
        "identifier": productId,
        "source": "https://oi000186152-us1-acspace.3dexperience.3ds.com/3DSpace",
        "relativePath": `/resources/v1/modeler/dseng/dseng:EngItem/${productId}`,
        "type": "VPMReference",
        "syncEIN": true
      };
      const modifiedHeaders = { ...headers, 'DS-Change-Authoring-Context': `pid:${flowDownCAId}` };
      const response = await axios.post(`${mfgItemURL}/${mfgItemId}/dsmfg:ScopeEngItem/detach`, payload, { headers: modifiedHeaders, httpsAgent: agent });
      console.log(`response for remove scope link between NewMfgItemId: ${mfgItemId} and OldEngItemId: ${productId}: `,response?.data);
      return response?.data;
    } catch (error) {
      const errorMessage = error?.response?.data?.message;
      console.error(`Error while removing scope link between NewMfgItemId: ${mfgItemId} and OldEngItemId: ${productId} is: ${errorMessage}`);
      throw error;
    }
  }

  private async removeMfgInstance(mfgItemInstanceId: string, headers: IHeaders, removeMfgInstanceURL: string, flowDownCAId: string): Promise<any> {
    try {
      console.log("Removing mfg Instance link for", mfgItemInstanceId);
      const modifiedHeaders = { ...headers, 'DS-Change-Authoring-Context': `pid:${flowDownCAId}` };
      const response = await axios.post(`${removeMfgInstanceURL}`, [mfgItemInstanceId], { headers: modifiedHeaders, httpsAgent: agent });
      console.log("response for remove mfg Instance link", response?.data);
      return response?.data;
    } catch (error) {
      const errorMessage = error?.response?.data?.message;
      console.error(`Error remove mfg Instance link for ID ${mfgItemInstanceId}: ${errorMessage}`);
      throw error;
    }
  }

  public async getScopeLink(mfgItemId: string, headers: IHeaders, mfgItemURL: string): Promise<any> {
    try {
      console.log("url000---",`${mfgItemURL}/${mfgItemId}/dsmfg:ScopeEngItem`);
      const response = await axios.get(`${mfgItemURL}/${mfgItemId}/dsmfg:ScopeEngItem`, { headers, httpsAgent: agent });
      console.log("response of getScopeLink", response?.data);
      return response?.data?.member?.[0];
    } catch (error) {
      console.error(`Error get scope link for ${mfgItemId}:`, error?.response?.data);
      throw error;
    }
  }

  private async createMBOM(mfgItemId: string, headers: IHeaders, mfgChildItemId: string, mfgItemURL: string, type: string, Mbom: string, flowDownCAId: string, baseURL: string): Promise<any> {
    try {
      let payload: any;
      if (type == "Raw_Material") {
        payload = {
          "instances": [
            {
              "referencedObject": {
                "identifier": mfgChildItemId,
                "source": baseURL,
                "relativePath": `/resources/v1/modeler/dsmfg/dsmfg:MfgItem/${mfgChildItemId}`,
                "type": Mbom ? 'ProcessContinuousCreateMaterial' : 'ProcessContinuousProvide'
              }
            }
          ]
        };
      }
      else {
        payload = {
          "instances": [
            {
              "referencedObject": {
                "identifier": mfgChildItemId,
                "source": baseURL,
                "relativePath": `/resources/v1/modeler/dsmfg/dsmfg:MfgItem/${mfgChildItemId}`,
                "type": Mbom ? 'CreateAssembly' : 'Provide'
              }
            }
          ]
        };
      }

      const modifiedHeaders = { ...headers, 'DS-Change-Authoring-Context': `pid:${flowDownCAId}` };

      console.log("payload of createMBOM", JSON.stringify(payload));
      console.log("headers of createMBOM", JSON.stringify(modifiedHeaders));
      const response = await axios.post(`${mfgItemURL}/${mfgItemId}/dsmfg:MfgItemInstance`, payload, { headers: modifiedHeaders, httpsAgent: agent });
      return response?.data;
    } catch (error) {
      console.error(`Error creating MBOM for ${mfgItemId}:`, error?.response?.data);
      throw error;

    }
  }

  //const response = await axios.get(`${mfgItemURL}/${item.mfgItemId}`, { headers, httpsAgent: agent });

  private async getProductDetails(productId: string, headers: IHeaders, getPhysicalProductInfoURL: string): Promise<any> {
    try {
      const response = await axios.get(`${getPhysicalProductInfoURL}/${productId}`, { params: { "$mask": "dsmveng:EngItemMask.Details" }, headers, httpsAgent: agent });
      return response?.data?.member;
    } catch (error) {
      console.error(`Error getting product details for ${productId}:`, error?.response?.data);
      throw error;
    }
  }

  private async getRawMaterialDetails(productId: string, headers: IHeaders, getRawMaterialInfoURL: string): Promise<any> {
    try {
      const response = await axios.get(`${getRawMaterialInfoURL}/${productId}`, { params: { "$mask": "dsmveng:EngItemMask.Details" }, headers, httpsAgent: agent });
      return response?.data?.member;
    } catch (error) {
      console.error(`Error getting product details for ${productId}:`, error?.response?.data);
      throw error;
    }
  }

  // get mfg item deatils
  private async getMfgDetails(mfgItemId: string, headers: IHeaders, mfgItemURL: string): Promise<any> {
    try {
      const response = await axios.get(`${mfgItemURL}/${mfgItemId}`, { headers, httpsAgent: agent })
      //console.log(response?.data?.member);
      return response?.data?.member;
    } catch (error) {
      console.error(`Error getting product details for ${mfgItemId}:`, error?.response?.data);
      throw error;
    }
  }

  private async getProductDetailsForRawMaterialByInstance(productId: string, headers: IHeaders, getRawMaterialDetailsByInstanceURL: string, instanceId: string): Promise<any> {
    try {
      const payload = { instanceIds: [instanceId] };
      console.log(`=======Payload of getProductDetailsForRawMaterialByInstance: ${JSON.stringify(payload)}`);
      // using private api
      const response = await axios.post(`${getRawMaterialDetailsByInstanceURL}`, payload, { params: { "tenant": "OI000186152", "SecurityContext": headers.SecurityContext }, headers, httpsAgent: agent });
      console.log(`=======response of getProductDetailsForRawMaterialByInstance: ${JSON.stringify(response.data)}`);
      return response?.data?.result;
    } catch (error) {
      console.error(`Error getting product details for ${productId}:`, error?.response?.data);
      throw error;
    }
  }


  private async getProductDetailsForRawMaterial(productId: string, headers: IHeaders, getRawMaterialDetailsURL: string): Promise<any> {
    try {
      const response = await axios.get(`${getRawMaterialDetailsURL}/${productId}`, { params: {}, headers, httpsAgent: agent });
      return response?.data?.member;
    } catch (error) {
      console.error(`Error getting product details for ${productId}:`, error?.response?.data);
      throw error;
    }
  }
  private generateFormattedDate(): string {
    let today = new Date();
    today.setDate(today.getDate() + 5);
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${today.getFullYear()}/${pad(today.getMonth() + 1)}/${pad(today.getDate())}@${pad(today.getHours())}:${pad(today.getMinutes())}:${pad(today.getSeconds())}:GMT`;
  }

  private async createMfgItem(mfgItemURL: string, items: any, headers: IHeaders, type: string, collabspace: string, productId: string, Organization: string, operations: string): Promise<any> {
    try {
      const reqBody = { "items": [{ "type": type, "attributes": items }] };
      console.log("check create mfg item headers", JSON.stringify(headers))
      console.log("check create mfg item payload", JSON.stringify(reqBody))
      const response = await axios.post(mfgItemURL, reqBody, { headers, httpsAgent: agent });
      console.log("check create mfg item response", JSON.stringify(response?.data))

      let mfgItemId = response?.data?.member[0].id;
      return mfgItemId;
    } catch (error) {
      console.error(`Error creating manufacturing item for product ${productId}:`, error?.response?.data);
      throw error;
    }
  }


  private async getPlantInfo(plantName: any, headers: IHeaders): Promise<void> {
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
    const plantsData = await axios.get(
      `${companyPlantsUrl}/${companyId}/plants`,
      {
        params: companyPlantsUrlParams,
        headers,
        httpsAgent: agent,
      }
    );

    const plantData = plantsData.data.data;
    const foundPlant = plantData && plantData.find((item) => item.title === plantName);
    return foundPlant?.name || "";
  }
}

export default CAService;
