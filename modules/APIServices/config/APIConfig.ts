const API_CONFIG = {
  caUrlParams: {
    $fields: "members, proposedChanges, realizedChanges, flowDown",
  },
  caUrlParamsForBasicdata: { $fields: "members" },
  mfgItemUrlParams: {
    $mask: "dsmfg:MfgItemMask.Details",
    $fields:
      "dsmveno:CustomerAttributes, dsmfg:ScopeEngItem.referencedObject, dsmfg:ResultingEngItems, dsmveno:basic.created.utc, dsmveno:basic.modified.utc, dsmfg:EnterpriseReference.Details",
  },
  mfgChildItemURLParams: {},
  mfgChildItemReqBody: {
    expandDepth: -1,
    withPath: false,
  },
  expandChildItemReqBody: {
    expandDepth: 1,
    withPath: true,
    type_filter_rel: ["VPMInstance"],
  },
  expandMfgItemReqBody: {
      expandDepth: 1,
      withPath: true 
  },
  mfgParentItemReqBody: {
    objectReferences: [
      {
        identifier: "",
      },
    ],
    navigateTo: ["dsmfg:MfgItemInstance"],
  },
  mfgScopedEngItemURLParams: {},
  engClassificationURLParams: { $mask: "dslib:ClassificationAttributesMask" },
  engClassificationTitleURLParams: {},
  mfgParentItemURLParams: {},
  itemSpecURLParams: { parentRelName: "SpecificationDocument" },
  engItemUrlParams: { $mask: "dsmveng:EngItemMask.Details" },
  engItemUrlReqBody: {},
  companyUrlParams: {},
  companyPlantsUrlParams: {},

  // RevFLoat URL Params
  cadSearchEINMask: { $searchStr: "" },
  phyProdEINMask: { $mask: "dsmveng:EngItemMask.Details" },
  phyProdCADMask: { $mask: "dsmvxcad:xCADProductMask.Default" },
  rawMaterialEINMask: { $mask: "dsrm:RawMaterialMask.Details" },
  docMask: { $mask: "" },
  docWhereUsedSpecDocParams: {
    parentRelName: "SpecificationDocument",
    parentDirection: "to",
  },
  docWhereUsedAttachmentParams: {
    parentRelName: "Reference Document",
    parentDirection: "to",
  },
  getRevGraphReqBody: {
    data: [
      {
        id: "",
        identifier: "",
        type: "",
        source: "",
        relativePath: "",
      },
    ],
  },
  droppedObjDetails: {
    Title: "",
    Type: "",
    "Maturity State": "",
    Owner: "",
    "Collaborative Space": "",
    "Collaborative Space Title": "",
    Description: "",
    "Dropped Revision": "",
    "Dropped Revision ID": "",
    "Latest Released Revision": "",
    "Latest Released Revision ID": "",
    EIN: "",
    "CAD Format": "",
    imageURL: "",
    relativePath: "",
    Name: "",
    organization: "",
    "Latest Revision":"",
    "HasMBOM": false
  },

  replaceInstaceReqBody: {
    referencedObject: {
      source: "",
      type: "",
      identifier: "",
      relativePath: "",
    },
  },

  itemWhereUsedAPIBody: {
    referencedObjects: [
      {
        identifier: "",
        type: "",
        source: "",
        relativePath: "",
      },
    ],
  },
  replaceSpecDocParams: { parentRelName: "SpecificationDocument" },
  replaceAttachmentParams: { parentRelName: "Reference Document" },

  docReplacementBody: {
    data: [
      {
        id: "",
        updateAction: "NONE",
        relateddata: {
          parents: [
            {
              id: "",
              updateAction: "CONNECT",
            },
          ],
        },
      },
      {
        id: "",
        updateAction: "NONE",
        relateddata: {
          parents: [
            {
              id: "",
              updateAction: "DISCONNECT",
            },
          ],
        },
      }
    ],
  },

  mfgItemUrlEINParams: {
    $mask: "dsmfg:MfgItemMask.Details",
    $fields: "dsmfg:EnterpriseReference.Details",
  },
  searchRouteParams:{
    $searchStr:""
  },
  docInfoParamts: {
    $fields: "organization,organizationTitle"
  },
  searchmfgItemEINParams: {
    $mask: "dsmveng:EngItemMask.Details",
    $searchStr: ""
  },
   // START : Mass Upload document params
   searchDocParams: {
    searchStr: ""
  },
  createDocParams: {
    "data": [
        {
            "dataelements": {
            }
        }
    ]
  },
  searchLibParams: {
    $searchStr: "",
  },
};

export default API_CONFIG;
