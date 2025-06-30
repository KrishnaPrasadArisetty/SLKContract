import axios from "axios";
import API_CONFIG from "../config/APIConfig";
import { urlConfig } from "../config/urlConfig";
import { Item } from "./model/item";
const https = require("https");
const agent = new https.Agent({
    rejectUnauthorized: false,
});
const { baseURL,modifyEngInstanceAttributeURL, modifyAttrQuantityForRawMaterial, whereUsedEngItemUrl, connectEngItemUrl, connectRawMaterialUrl, physicalProductType, rawMaterialType, rawMaterialModifyAttributeURL, rawMaterialSearchURL, createRawMaterialURL, classificationTypeList, PhysicalProductsLibrary, engItemURL, classifyProdToClassURL, updatePhysicalProductURL, searchLibraryURL, transferOwnerShipURL, libraryDetailsURL, searchPhysicalProductURL, documentType } = urlConfig;
class ItemService {
    //create Item
    async createItem(owner: any,classificationTypeList:string, classificationType, itemPayload: any, securityContext: string, csrfTokenAndHeaders: any): Promise<any> {
        return new Promise((resolve, reject) => {
        const EINNumber = itemPayload.attributes["dseng:EnterpriseReference"].partNumber;
        try{
        let requestItemUrl;
        let payload;
        if (itemPayload.type == physicalProductType) {
            requestItemUrl = engItemURL;
            payload = {
                items: [itemPayload]
            }
        }
        else if (itemPayload.type == rawMaterialType) {
            requestItemUrl = createRawMaterialURL;
            payload = itemPayload.attributes;
            payload.title = itemPayload.attributes.title;
        }
        const headers: any = {
            Cookie: csrfTokenAndHeaders.Cookie,
            SecurityContext: securityContext,
            ENO_CSRF_TOKEN: csrfTokenAndHeaders.ENO_CSRF_TOKEN,
            "Content-Type": csrfTokenAndHeaders["Content-Type"]
        };
            return axios.post(requestItemUrl, payload, {
                headers,
                httpsAgent: agent
            }).then((result) => {
                if (itemPayload.type == rawMaterialType) {
                    const modfiyAttributePayload = {
                        "dseng:EnterpriseReference": {
                            partNumber: itemPayload.attributes["dseng:EnterpriseReference"].partNumber
                        },
                        "cestamp": result.data.member[0].cestamp
                    }
                    this.modifyItemAttributes(itemPayload.type, result.data.member[0].id, modfiyAttributePayload, securityContext, csrfTokenAndHeaders).then((modifyAttribute) => {
                        this.getClassifcationIdByType(classificationType,classificationTypeList,"item", securityContext, csrfTokenAndHeaders).then((classificationId) => {
                            this.classifyItem(itemPayload.type, result.data.member[0].id, securityContext, classificationId, csrfTokenAndHeaders).then((response) => {
                                return this.transferOwnership(result.data.member[0].id, owner, securityContext, csrfTokenAndHeaders).then((transferOwnershipResponse) => {
                                    result.data.member[0].owner = owner;
                                    resolve(result.data.member[0]);
                                }).catch((error) => {
                                    const errorMsg = error?.response?.data?.message || error?.response?.data?.errorReport[0]?.errorMessage || error.message || "Unknown error";
                                    reject(new Error(`Not able to Transfer Ownership ${itemPayload.itemType} : ${errorMsg}`));
                                });
                            }).catch((error) => {
                                const errorMsg = error?.response?.data?.message || error?.response?.data?.errorReport[0]?.errorMessage || error.message || "Unknown error";
                                reject(new Error(`Not able to Classify Physical Product ${itemPayload.itemType} : ${errorMsg}`));
                            });
                        }).catch((error) => {
                            const errorMsg = error?.response?.data?.message || error?.response?.data?.errorReport[0]?.errorMessage || error.message || "Unknown error";
                            reject(new Error(`Not able to Get Classification ID ${itemPayload.itemType} : ${errorMsg}`));
                            
                        });
                    }
                    ).catch((error) => {
                        const errorMsg = error?.response?.data?.message || error?.response?.data?.errorReport[0]?.errorMessage || error.message || "Unknown error";
                        reject(new Error(`Not able to Modify Raw Material Attribute ${itemPayload.itemType} : ${errorMsg}`));
                    });
                }
                else {
                    this.getClassifcationIdByType(classificationType,classificationTypeList,"item", securityContext, csrfTokenAndHeaders).then((classificationId) => {
                        this.classifyItem(itemPayload.type, result.data.member[0].id, securityContext, classificationId, csrfTokenAndHeaders).then((response) => {
                            return this.transferOwnership(result.data.member[0].id, owner, securityContext, csrfTokenAndHeaders).then((transferOwnershipResponse) => {
                                result.data.member[0].owner = owner;
                                resolve(result.data.member[0]);
                            }).catch((error) => {
                                const errorMsg = error?.response?.data?.message || error.message || "Unknown error";
                                reject(new Error(`Not able to Transfer Ownership ${itemPayload.itemType} : ${errorMsg}`));
                            });
                        }).catch((error) => {
                            const errorMsg = error?.response?.data?.message || error.message || "Unknown error";
                            reject(new Error(`Not able to Classify Physical Product ${itemPayload.itemType} : ${errorMsg}`));
                            
                        });
                    }).catch((error) => {
                        const errorMsg = error?.response?.data?.message || error.message || "Unknown error";
                        reject(new Error(`Not able to Get Classification ID ${itemPayload.itemType} : ${errorMsg}`));
                    });
                }
            }).catch((error) => {
                const errorMsg = error?.response?.data?.message || error.message || "Unknown error";
                reject(new Error(`Not able to Create ${itemPayload.itemType} : ${errorMsg}`));
            });
        }
        catch (error) {
            const errorMsg = error?.response?.data?.message || error.message || "Unknown error";
            reject(new Error(`Not able to Create ${itemPayload.itemType} : ${errorMsg}`));
        }
        });
    }
    //Classifying Physical Product
    async classifyItem(itemType: string, itemId: string, securityContext: string, classificationId: any, csrfTokenAndHeaders: any): Promise<any> {
        return new Promise((resolve, reject) => {
            try{
            const headers: any = {
                Cookie: csrfTokenAndHeaders.Cookie,
                SecurityContext: securityContext,
                ENO_CSRF_TOKEN: csrfTokenAndHeaders.ENO_CSRF_TOKEN,
                "Content-Type": csrfTokenAndHeaders["Content-Type"]
            };
            let relativePath;
            if (itemType == physicalProductType) {
                relativePath = `/resources/v1/modeler/dseng/dseng:EngItem/${itemId}`;
            } else if (itemType == documentType) {
                relativePath = `/resources/v1/modeler/documents/${itemId}`;
            } else {
                relativePath = `/resources/v1/modeler/dsrm/dsrm:RawMaterial/${itemId}`;
            }
            const payload = {
                "ClassID": classificationId,
                "ObjectsToClassify": [
                    {
                        "source": baseURL,
                        "type": itemType,
                        "identifier": itemId,
                        "relativePath": relativePath
                    }
                ],
            };
            axios.post(classifyProdToClassURL, JSON.stringify(payload), { headers }
            ).then((result) => {
                if (result?.data?.ObjectsNotClassified > 0) {
                    reject(new Error(`Object created but not able to classify the object`));
                }
                resolve(result.data);
            }).catch((error) => {
                reject(`Error in classifying the object: ${error.message}`);
            });
        } catch (error) {
            reject(new Error("Something went Wrong while classifying Item" + error.message));
        }
        });
    }
    //getting Classification Id by Type
    async getClassifcationIdByType(classificationType: string, libName: string, objectToclassify: string, securityContext: string, csrfTokenAndHeaders: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const headers: any = {
                Cookie: csrfTokenAndHeaders.Cookie,
                SecurityContext: securityContext,
                ENO_CSRF_TOKEN: csrfTokenAndHeaders.ENO_CSRF_TOKEN,
                "Content-Type": csrfTokenAndHeaders["Content-Type"]
            };
            const searchLibParams = API_CONFIG?.searchLibParams;
            searchLibParams.$searchStr = libName;
            axios.get(searchLibraryURL, {
                params: searchLibParams,
                headers
            }).then((result) => {
                if (result.data.member.length == 0) {
                    reject(new Error("Object created but unable to classify"));
                }
                result.data.member.forEach((library) => {
                    if (library.title == libName) {
                        axios.get(libraryDetailsURL + "/" + library.id + "/?$mask=dslib:ExpandClassesDetailsMask", {
                            headers
                        }).then((result) => {
                            if (result.data.member.length == 1) {
                                let subChildCLass = "Item Types";
                                if (objectToclassify == "item") {
                                    subChildCLass = "Item Types";
                                } else if (objectToclassify == "Document") {
                                    subChildCLass = "Document Types";
                                }
                                const matchingObjectClassification = result.data.member[0].ChildClasses.member.find((classification) => {
                                    return classification.title == subChildCLass
                                });
                                if (matchingObjectClassification) {
                                    let classFound = matchingObjectClassification?.ChildClasses?.member?.find((objectTypeClasses) => {
                                        return objectTypeClasses?.title == classificationType;
                                    })
                                    if (classFound) {
                                        resolve(classFound.id);
                                    } else {
                                        reject(new Error("Object created but Classification type not found"));
                                    }
                                } else {
                                    reject(new Error("Object created Classification type not found"));
                                }
                            }
                        }
                        ).catch((error) => {
                            reject(new Error(error.message));
                        });
                    }
                })
            }).catch((error) => {
                reject(new Error(error));
            })
        });
    }
    // Transferring Ownership from super user to client side user.
    async transferOwnership(itemId: any, userId: string, securityContext: string, csrfTokenAndHeaders: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const headers: any = {
                Cookie: csrfTokenAndHeaders.Cookie,
                SecurityContext: securityContext,
                ENO_CSRF_TOKEN: csrfTokenAndHeaders.ENO_CSRF_TOKEN,
                "Content-Type": csrfTokenAndHeaders["Content-Type"]
            };
            const payload = {
                "owner": userId,
                "data": [
                    {
                        "id": itemId
                    }
                ]
            }
            axios.post(transferOwnerShipURL, payload, { headers }).then((result) => {
                resolve(result.data);
            }
            ).catch((error) => {
                const errorMessage = error?.response?.data[0]?.errorReport?.errorMessage;;
                reject(new Error(`Object created but error in changing owner: ${errorMessage}`));
            });
        });
    }
    //Find Item by EIN Number
    async findItemByEinNumber(itemType: string, einNumber: string, securityContext: string, csrfTokenAndHeaders: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const headers: any = {
                Cookie: csrfTokenAndHeaders.Cookie,
                SecurityContext: securityContext,
                ENO_CSRF_TOKEN: csrfTokenAndHeaders.ENO_CSRF_TOKEN,
                "Content-Type": csrfTokenAndHeaders["Content-Type"]
            };
            let requestURL;
            if (itemType == physicalProductType) {
                requestURL = `${searchPhysicalProductURL}/?$searchStr="${einNumber}"&$mask=dsmveng:EngItemMask.Details`;
            }
            else {
                requestURL = `${rawMaterialSearchURL}/?$searchStr="${einNumber}"&$mask=dsrm:RawMaterialMask.Details`
            }
            axios.get(requestURL, {
                headers
            }).then((result) => {
                resolve(result.data.member[0]);
            }
            ).catch((error) => {
                reject(new Error(error));
            });
        });
    }
    //Modify Item Attributes.
    async modifyItemAttributes(itemType, itemId: string, modfiyAttributePayload: any, securityContext: string, csrfTokenAndHeaders: any): Promise<any> {
        return new Promise((resolve, reject) => {
            try{
            const headers: any = {
                Cookie: csrfTokenAndHeaders.Cookie,
                SecurityContext: securityContext,
                ENO_CSRF_TOKEN: csrfTokenAndHeaders.ENO_CSRF_TOKEN,
                "Content-Type": csrfTokenAndHeaders["Content-Type"]
            };
            let requestURL;
            if (itemType == rawMaterialType) {
                requestURL = `${rawMaterialModifyAttributeURL}/${itemId}`;
            }
            axios.patch(requestURL, JSON.stringify(modfiyAttributePayload), {
                headers
            }).then((result) => {
                resolve(result.data.member[0]);
            }
            ).catch((error) => {
                reject(new Error(error));
            });
        } catch (error) {
            reject(new Error("Something went Wrong while modifying Item Attributes" + error.message));
        }
        });
    }
    //Creating or Updating Item
    async createorUpdateItem(userId, item: Item, securityContext: string, csrfTokenAndHeaders: any) {
        return new Promise(async (resolve, reject) => {
        const einNumber = item.attributes["dseng:EnterpriseReference"].partNumber;
        try{
        const classificationType = item.classificationType;
        const classificationTypeList = item.collabSpaceTitle;
        let itemPayload: any = JSON.parse(JSON.stringify(item));
        if (itemPayload.classificationType || itemPayload.collabSpace || itemPayload.collabSpaceTitle) {
            delete itemPayload.classificationType;
            delete itemPayload.collabSpace;
            delete itemPayload.collabSpaceTitle;
        }
        const headers: any = {
            Cookie: csrfTokenAndHeaders.Cookie,
            SecurityContext: securityContext,
            ENO_CSRF_TOKEN: csrfTokenAndHeaders.ENO_CSRF_TOKEN,
            "Content-Type": csrfTokenAndHeaders["Content-Type"]
        };
        let searchResult;
        searchResult = await this.findItemByEinNumber(itemPayload.type, itemPayload.attributes["dseng:EnterpriseReference"].partNumber, securityContext, csrfTokenAndHeaders);
            if ((searchResult !== undefined && searchResult["dseng:EnterpriseReference"].partNumber === itemPayload.attributes["dseng:EnterpriseReference"].partNumber)) {
                let updatePayload = { ...itemPayload.attributes };
                updatePayload.title = itemPayload.title;
                updatePayload.cestamp = searchResult.cestamp;
                delete updatePayload["dseng:EnterpriseReference"];
                const itemId = searchResult.id;
                if (itemPayload.type == "VPMReference") {
                    return axios.patch(updatePhysicalProductURL + "/" + itemId, JSON.stringify(updatePayload), { headers }).then((result: any) => {
                        resolve({ item: result.data.member[0], updated: true, create: false });
                    }).catch((error) => {
                        reject(new Error("The item is not indexed; please retry after a few seconds."+error));
                    });
                }
                else if (itemPayload.type == "Raw_Material") {
                    return axios.patch(createRawMaterialURL + "/" + itemId, JSON.stringify(updatePayload), { headers }).then((result: any) => {
                        resolve({ item: result.data.member[0], updated: true, create: false });
                    }).catch((error) => {
                        reject(new Error("The item is not indexed; please retry after a few seconds."+error));
                    });
                }
            }
            else {
                return this.createItem(userId, classificationTypeList,classificationType, itemPayload, securityContext, csrfTokenAndHeaders).then((result) => {
                    resolve({ item: result, updated: false, create: true });
                }).catch((error) => {
                    reject(new Error(error.message));
                });
            }
        } catch (error) {
            reject(new Error("Something went Wrong while creating or updating Item for "+einNumber+": " + error.message));
        }
        });
    }
    //Modify connection Attributes
    async modifyQuantityAttributeForRawMaterial(itemId: string, instanceId: string, modifyAttributePayload: any, securityContext: string, csrfTokenAndHeaders: any): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                const headers: any = {
                    Cookie: csrfTokenAndHeaders.Cookie,
                    SecurityContext: securityContext,
                    ENO_CSRF_TOKEN: csrfTokenAndHeaders.ENO_CSRF_TOKEN,
                    "Content-Type": csrfTokenAndHeaders["Content-Type"]
                };
                axios.put(modifyAttrQuantityForRawMaterial(itemId, instanceId, securityContext), modifyAttributePayload, {
                    headers
                }).then((result) => {
                    resolve(result.data.instanceDetails);
                }
                ).catch((error) => {
                    reject(new Error(error));
                });
            }
            catch (error) {
                reject(new Error("Not able to Modify Quantity Attribute"+error.message));
            }
        });
    }
    modifyinstanceAttributes(parentId: string, instanceId: string, modifyAttributePayload: any, securityContext: string, csrfTokenAndHeaders: any): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                const headers: any = {
                    Cookie: csrfTokenAndHeaders.Cookie,
                    SecurityContext: securityContext,
                    ENO_CSRF_TOKEN: csrfTokenAndHeaders.ENO_CSRF_TOKEN,
                    "Content-Type": csrfTokenAndHeaders["Content-Type"]
                };
                axios.patch(modifyEngInstanceAttributeURL(parentId, instanceId), modifyAttributePayload, { headers }).then((result) => {
                    resolve(result.data.member[0]);
                }
                ).catch((error) => {
                    reject(new Error(error));
                });
            }
            catch (error) {
                reject(new Error("Not able to Modify Instance Attribute"+error.message));
            }
        });
    }
}
export default ItemService;