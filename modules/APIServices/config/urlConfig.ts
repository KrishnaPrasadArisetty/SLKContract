// const baseURL = "https://oi000186152-us1-space.3dexperience.3ds.com/enovia";
const baseURL = process.env.SAAS_BASE_URL||"";
const EMRPDH_URL   = process.env.EMRPDH_URL||"";
const EMRPDH_NODE_URL   = process.env.EMRPDH_NODE_URL||"";

export const urlConfig = {
  baseURL,
  caDetailsURL: `${baseURL}/resources/v1/modeler/dslc/changeaction`,
  mfgItemURL: `${baseURL}/resources/v1/modeler/dsmfg/dsmfg:MfgItem`,
  mfgChildItemURL: `${baseURL}/resources/v1/modeler/dsmfg/dsmfg:MfgItem`,
  expandProductURL: `${baseURL}/resources/v1/modeler/dseng/dseng:EngItem`,
  engClassificationURL: `${baseURL}/resources/v1/modeler/dslib/dslib:CategorizationClassifiedItem`,
  engClassificationNewURL: `${baseURL}/resources/v1/modeler/dslib/dslib:CategorizationClassifiedItem`,
  engClassificationIdURL: `${baseURL}/resources/v1/modeler/dslib/dslib:Class`,
  mfgParentItemURL: `${baseURL}/resources/v1/modeler/dsmfg/dsmfg:MfgItem/locate`,
  itemSpecURL: `${baseURL}/resources/v1/modeler/documents/parentId`,
  createCAURL: `${baseURL}/resources/v1/modeler/dslc/changeaction`,
  modifyCaURL: `${baseURL}/resources/v1/modeler/dslc/changeaction`,
  connectMbomItemToFdcaURL: `${baseURL}/resources/v1/modeler/dslc/changeaction`,
  promoteFdcaToAnyStateURL: `${baseURL}/resources/v1/modeler/dslc/maturity/changeState`,
  mrAutomationURL: `${EMRPDH_NODE_URL}/ca/mrAutomation`,
  modifyCaPrivateURL: `${baseURL}/resources/modeler/change/flowdown?tenant=OI000186152&xrequestedwith=xmlhttprequest`,
  updateClassAttributeForPhysicalProdURL: `${baseURL}/resources/v1/modeler/dslib/dslib:CategorizationClassifiedItem/modify`,
  updateClassAttributeForPhysicalProdNewURL: `${baseURL}/resources/v1/modeler/dslib/dslib:CategorizationClassifiedItem/modify`,
  classifyProdToClassURL: `${baseURL}/resources/v1/modeler/dslib/dslib:CategorizationClassifiedItem`,
  classificationAttrUpdateURL: `${baseURL}/resources/v1/modeler/dslib/dslib:CategorizationClassifiedItem/modify`,
  declassifyProdToClassURL: `${baseURL}/resources/v1/modeler/dslib/dslib:CategorizationClassifiedItem/remove`,
  searchCaURL: `${baseURL}/resources/v1/modeler/dslc/changeaction/search`,
  createRouteURL: `${baseURL}/resources/v1/modeler/dsrt/routes`,
  searchRouteURL: `${baseURL}/resources/v1/modeler/dsrt/routes/search`,
  searchRoutePrivateURL: `${baseURL}/resources/v1/modeler/routes`,
  deleteRouteURL: `${baseURL}/resources/v1/modeler/dsrt/routes/delete`,
  deleteCaURL: `${baseURL}/resources/v1/modeler/dslc/changeaction`,
  removeProposedChangeURL: `${baseURL}/resources/v1/modeler/dslc/changeaction`,
  customRevision: `${baseURL}/resources/v1/dslc/addversions`,
  promoteMfgItemLifecyclePrivateURL: `${baseURL}/resources/lifecycle/maturity/promote`,

  getPhysicalProductInfoURL: `${baseURL}/resources/v1/modeler/dseng/dseng:EngItem`,
  engItemURL: `${baseURL}/resources/v1/modeler/dseng/dseng:EngItem`,
  getInstanceURL: `${baseURL}/resources/v1/modeler/dseng/dseng:EngItem`,
  engClassificationTitleURL: `${baseURL}/resources/v1/modeler/dslib/dslib:Class`,
  companyUrl: `${baseURL}/resources/v1/modeler/organizations/host`,
  companyPlantsUrl: `${baseURL}/resources/v1/modeler/organizations`,
  getMfgItemByScopeURL: `${baseURL}/resources/v1/modeler/dsmfg/invoke/dsmfg:getMfgItemsFromEngItem`,
  getCADetialsByPrivateURL:`${baseURL}/resources/v1/chguxservices/changeaction/9310187E1FEB0E00679872420001B903/realizedChanges?realizedFilter=TRACKED&lastIndexedTime=1738059745&tenant=OI000186152&timestamp=1738059882364&xrequestedwith=xmlhttprequest`,
  removeMfgInstanceURL: `${baseURL}/resources/v1/modeler/dsmfg/invoke/dsmfg:detachMfgItemInstances`,

  // START : Revision FLoat Urls
  cadSearchURL: `${baseURL}/resources/v1/modeler/dsxcad/dsxcad:Product/search`,
  getDocumentInfoURL: `${baseURL}/resources/v1/modeler/documents`,
  getAllRevisions: `${baseURL}/resources/v1/modeler/dslc/version/getGraph`,
  getRawMaterialInfoURL: `${baseURL}/resources/v1/modeler/dsrm/dsrm:RawMaterial`,
  getPhyProdWhereUsedURL: `${baseURL}/resources/v1/modeler/dseng/dseng:EngItem/locate`,
  getDocumentWhereUsedURL: `${baseURL}/resources/v1/modeler/documents/parentId`,
  replaceItemURL: (itemID: string, instanceID: string) => `${baseURL}/resources/v1/modeler/dseng/dseng:EngItem/${itemID}/dseng:EngInstance/${instanceID}/replace`,
  replaceDocumentURL: `${baseURL}/resources/v1/modeler/documents`,
  getCadObjDetails: `${baseURL}/resources/v1/modeler/dsxcad/dsxcad:Product`,
  // END : Revision Float URLS
  getGraphURL: `${baseURL}/resources/v1/modeler/dslc/version/getGraph`,
  getRawMaterialDetailsURL: `${baseURL}/resources/v1/modeler/dsrm/dsrm:RawMaterial`,
  getRawMaterialDetailsByInstanceURL: `${baseURL}/resources/v1/ContinuousQuantity/PhysicalProduct/QtyInstance:ContinuousQuantities`,
  updateOwnerURL: `${baseURL}/resources/v1/modeler/dslc/ownership/transfer`,
  bosSpecUpdateURL:`${EMRPDH_URL}/specCreation/specAssignment`,

  //Krishna Create MGFCA Automation
  searchENGItem :`${baseURL}/resources/v1/modeler/dseng/dseng:EngItem/search`,
  searchMFGItem :`${baseURL}/resources/v1/modeler/dsmfg/dsmfg:MfgItem/search`,
  // START : Mass Upload URLS
  //Public API
  updatePhysicalProductURL:`${baseURL}/resources/v1/modeler/dseng/dseng:EngItem`,
  transferOwnerShipURL:`${baseURL}/resources/v1/modeler/dslc/ownership/transfer`,
  searchLibraryURL:`${baseURL}/resources/v1/modeler/dslib/dslib:Library/search`,
  libraryDetailsURL:`${baseURL}/resources/v1/modeler/dslib/dslib:Library`,
  searchPhysicalProductURL:`${baseURL}/resources/v1/modeler/dseng/dseng:EngItem/search`,
  PhysicalProductsLibrary:"ProductFamilyClassificationFields",
  createRawMaterialURL:`${baseURL}/resources/v1/modeler/dsrm/dsrm:RawMaterial`,
  classificationTypeList:"Parts",
  rawMaterialSearchURL:`${baseURL}/resources/v1/modeler/dsrm/dsrm:RawMaterial/search`,
  rawMaterialModifyAttributeURL:`${baseURL}/resources/v1/modeler/dsrm/dsrm:RawMaterial`,
  connectEngItemUrl:(parentId:any)=>`${baseURL}/resources/v1/modeler/dseng/dseng:EngItem/${parentId}/dseng:EngInstance`,
  connectRawMaterialUrl:(parentId:any)=>`${baseURL}/resources/v1/modeler/dsrm/dsrm:RawMaterial/${parentId}/dsrm:RawMaterialInstance`,
  whereUsedEngItemUrl:`${baseURL}/resources/v1/modeler/dseng/dseng:EngItem/locate`,
  modifyEngInstanceAttributeURL:(parentId,instanceId)=>`${baseURL}/resources/v1/modeler/dseng/dseng:EngItem/${parentId}/dseng:EngInstance/${instanceId}`,
  rawMaterialType:"Raw_Material",
  physicalProductType:"VPMReference",
  documentType: "Document",

  //Private API
  modifyAttrQuantityForRawMaterial:(itemId:string,instanceId:string,securityContext:string)=>`${baseURL}/resources/v1/ContinuousQuantity/PhysicalProduct/${itemId}/QtyInstance:ContinuousQuantity/${instanceId}?tenant=OI000186152&SecurityContext=${securityContext}`,
  // END : Mass Upload URLS

   // START : Mass upload document URLS
   searchDocumentURL: `${baseURL}/resources/v1/modeler/documents/search`,
   createDocumentURL: `${baseURL}/resources/v1/modeler/documents`,
   updateDocumentURL: `${baseURL}/resources/v1/modeler/documents`
};
