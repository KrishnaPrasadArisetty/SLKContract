import axios from "axios";
import AuthService from "../authentication/authService";
import { urlConfig } from "../config/urlConfig";
import ItemService from "./ItemService";
import { Item } from "./model/item";
import { ItemStructure } from "./model/itemStructure";
import UploadItem from "./model/uploadItem";
import UploadItemStructure from "./model/uploadItemStructure";
const https = require("https");
const agent = new https.Agent({
    rejectUnauthorized: false,
});
const { baseURL, whereUsedEngItemUrl, connectEngItemUrl, connectRawMaterialUrl, physicalProductType, rawMaterialType, rawMaterialModifyAttributeURL, rawMaterialSearchURL, createRawMaterialURL, classificationTypeList, PhysicalProductsLibrary, engItemURL, classifyProdToClassURL, updatePhysicalProductURL, searchLibraryURL, transferOwnerShipURL, libraryDetailsURL, searchPhysicalProductURL } = urlConfig;
class MassUploadService {
    readonly itemService: ItemService;
    constructor() {
        this.itemService = new ItemService();
    }
    //Uploading Physical Products
    async uploadItems(req: any, res: any) {
        let resultResponse = {
            success: false,
            responses: [] as any[]
        };

        const isValidPayload = await this.validateRequestBodyPayload(req.body, req.body.securityContext, req.body.csrfTokenAndHeaders);
        if (!isValidPayload) {
            res.status(400).send({ status: "Error", message: "Invalid Request Parameter" });
            return;
        }
        const payloadBody:UploadItem = req.body;
        const physicalProductsPayload:Item[] = payloadBody.items;
        const emailNotification:boolean = payloadBody.emailNotification;
        const securityContext:string = payloadBody.securityContext;
        const userId:string = payloadBody.userId;
        const userInfo = {};
        const authService:AuthService = new AuthService();
        const csrfTokenAndHeaders = await authService.authenticateUser(userInfo);
        const batchSize = 500; // Set the batch size
        const promises = [];
        for (let i = 0; i < physicalProductsPayload.length; i += batchSize) {
            const batch = physicalProductsPayload.slice(i, i + batchSize);
            const batchPromises = batch.map(async (itemPayload: Item) => {
                const collabSpace: string = itemPayload.collabSpace;
                const itemBasedSecurityContext = "VPLMProjectLeader" + "." + securityContext.split(".")[1] + "." + collabSpace;
                if (!await this.validateItemPayload(itemPayload, itemBasedSecurityContext, csrfTokenAndHeaders)) {
                    resultResponse.responses.push({
                        "EIN Number": itemPayload.attributes["dseng:EnterpriseReference"].partNumber,
                        "Revision": "",
                        "Status": "error",
                        "Message": "Invalid Parameter"
                    });
                    return;
                }
                return this.itemService.createorUpdateItem(userId, itemPayload, itemBasedSecurityContext, csrfTokenAndHeaders).then((response: any) => {
                    resultResponse.responses.push({
                        "EIN Number": itemPayload.attributes["dseng:EnterpriseReference"].partNumber,
                        "Revision": response.item.revision,
                        "Status": "success",
                        "Message": response.updated ? "Item Updated Successfully" : "Item Uploaded Successfully"
                    });
                    resultResponse.success = true;
                }).catch((error) => {
                    resultResponse.responses.push({
                        "EIN Number": itemPayload.attributes["dseng:EnterpriseReference"].partNumber,
                        "Revision": "",
                        "Status": "error",
                        "Message": "Error while uploading/Updating item: " + error.message
                    });
                });
            });
            await Promise.allSettled(batchPromises);
        }

        Promise.allSettled(promises).then(() => {
            res.status(200).send(resultResponse);
            if (emailNotification) {
                this.sendEmailNotification(userId, "Items Uploaded Successfully");
            }
        }).catch((error) => {
            if (emailNotification ) {
                this.sendEmailNotification(userId, "Error while uploading items" + error.message);
            }
            res.status(500).send({ status: "Error", message: "Internal Server Error" });
        });
    }
    //Uploading Physical Product Structure
    async uploadItemStructure(req: any, res: any) {
        let resultResponse = {
            success: false,
            responses: [] as any[]
        };
        let finalResponse={
            success: false,
            responses: [] as any[]
        }
        const logChildResponse = (item, message) => {
            for (const res of resultResponse.responses) {
                if (res["EIN Number"] === item.parent.title) {
                    if (!res["child"]) res["child"] = [];
                    res["child"].push({
                        "Child Title": item.item.title,
                        "Child Id": item.item.id,
                        "Message": message
                    });
                    break;
                }
            }
        };
        const isValidPayload = await this.validateRequestBodyPayload(req.body, req.body.securityContext, req.body.csrfTokenAndHeaders);
        if (!isValidPayload) {
            res.status(400).send({ status: "Error", message: "Invalid Request Parameter" });
            return;
        }
        const payloadBody:UploadItemStructure = req.body;
        const reqItemPayload:ItemStructure[] = payloadBody.items;
        const emailNotification = payloadBody.emailNotification;
        const securityContext = payloadBody.securityContext;
        const userId = payloadBody.userId;
        const userInfo = {};
        const authService = new AuthService();
        const csrfTokenAndHeaders = await authService.authenticateUser(userInfo);
        const itemPayloads: any[] = [];
        // Splitting the payload into level which will have 0 level as first element and so on
        let currentLevel = -1;
        for (const item of reqItemPayload) {
            const itemBasedSecurityContext = "VPLMProjectLeader" + "." + securityContext.split(".")[1] + "." + item.collabSpace;
            if (!await this.validateItemStructurePayload(item, itemBasedSecurityContext, csrfTokenAndHeaders)) {
            res.status(400).send({ status: "Error", message: "Invalid Request Parameter" });
            return;
            }
            if (item.level === 0) {
            itemPayloads.push([]);
            currentLevel++;
            }
            itemPayloads[currentLevel].push(item);
        }
        for(const itemPayload of itemPayloads) {
        let stack: any[] = []; // Initialize the stack for each level
        let bomStructure: any[] = [];
        const itempPomises: Promise<any>[] = [];
        const itemMap = new Map();
        for (const item of itemPayload) {
            const itemBasedSecurityContext = "VPLMProjectLeader" + "." + securityContext.split(".")[1] + "." + item.collabSpace;
            const instanceAttributes = item.instanceAttributes;
            while (stack.length > item.level) {
                stack.pop();
            }
            const parent = stack.length > 0 ? stack[stack.length - 1] : null;
            const payloadItem = item;
            bomStructure.push({ "item": payloadItem, "parent": parent, "instanceAttributes": instanceAttributes, securityContext: itemBasedSecurityContext });
            stack.push(item);
        }
        let batchSize = 100;
        const bomStructureCopy = [...bomStructure];
        for (let i = 0; i < bomStructureCopy.length; i += batchSize) {
            const batch = bomStructureCopy.slice(i, i + batchSize);
            const batchPromises = batch.map(async (item, index) => {
                //deleting unusual parameter for creation
                delete item.item.instanceAttributes;
                delete item.level;
                const itemPayload = JSON.parse(JSON.stringify(item.item));
                    return this.itemService.createorUpdateItem(userId, itemPayload, item.securityContext, csrfTokenAndHeaders).then((response: any) => {
                        itemMap.set(bomStructure[i + index].item.attributes["dseng:EnterpriseReference"].partNumber, response.item);
                        bomStructure[i + index].item = response.item;
                        resultResponse.responses.push({
                            "EIN Number": response.item.title,
                            "Revision": response.item.revision,
                            "Status": "success",
                            "Message": response.updated ? "Item Updated Successfully" : "Item Uploaded Successfully"
                        })
                    }).catch((error) => {
                        resultResponse.responses.push({
                            "EIN Number": item.item.attributes["dseng:EnterpriseReference"].partNumber,
                            "Revision": "",
                            "Status": "error",
                            "Message": "Error while uploading/Updating item"+ error.message
                        });
                    });
            });
            await Promise.allSettled(batchPromises);
        }
        //Replacing Parent with actual parentObject
        bomStructure.forEach((item, index) => {
            if (bomStructure[index].parent != null) {
                if (itemMap.has(bomStructure[index].parent.attributes["dseng:EnterpriseReference"].partNumber)) {
                    bomStructure[index].parent = itemMap.get(bomStructure[index].parent.attributes["dseng:EnterpriseReference"].partNumber);
                }
            }
            
        });
        //Checking for circular references
        bomStructure.forEach((item, index) => {
            if(item.parent != null){
                if(item.item.id == item.parent.id){
                res.status(400).send({ status: "error", message: `Item : ${item.item.title}: has itself parent` });
                return;
            } else if(item.parent=="Raw_Material" && item.item=="VPMReference"){
                res.status(400).send({ status: "error", message: `Item : ${item.item.title}: is trying to connect with parent type "Physical Product"` });
                return
            }
        }
        })
        //Connecting Items
        batchSize = 100; // Set the batch size
        for (let i = 0; i < bomStructure.length; i += batchSize) {
            const batch = bomStructure.slice(i, i + batchSize);
            // Process each batch
            let connectPromisesbatch: Promise<any>[] = [];
            for (let bomItem of batch) {
                const item = JSON.parse(JSON.stringify(bomItem));
                let quantity = item.instanceAttributes.quantity;
                let quantityItr = Number(quantity);
                //deleting unsual parameter for creation
                delete item.instanceAttributes.quantity;
                let referenceDesignatorItr = 0;
                const referenceDesignator: string = item.instanceAttributes.name;
                const strReferenceDesignator: string[] = referenceDesignator.split(",");
                let instanceAttributes = { ...item.instanceAttributes };
                if (item.parent != null) {
                    if (item.parent.id && item.item.id) {
                        let alreadyConnected: any = await this.checkItemConnectedAsChild(item.item.type, item.parent.id, item.item.id, quantity, item.securityContext, csrfTokenAndHeaders);
                        if (alreadyConnected && item.item.type !== rawMaterialType) {
                            for (let instance of alreadyConnected) {
                                instanceAttributes.name = strReferenceDesignator[referenceDesignatorItr];
                                instanceAttributes.cestamp = instance.cestamp;
                                const connectRes = this.itemService.modifyinstanceAttributes(item.parent.id, instance.id, instanceAttributes, item.securityContext, csrfTokenAndHeaders);
                                connectRes.then((response: any) => {
                                    logChildResponse(item, "Item was already connected, modified instance attributes");
                                }).catch((error) => {
                                    logChildResponse(item, "Error while modifying instance attributes");
                                });
                                connectPromisesbatch.push(connectRes);
                                referenceDesignatorItr++;
                            }
                        }
                        else if (item.item.type == physicalProductType) {
                            while (quantityItr > 0) {
                                instanceAttributes.name = strReferenceDesignator[referenceDesignatorItr];
                                const connectRes = this.connectItemtoParent(item.parent, item.item, instanceAttributes, Number(quantity), item.securityContext, csrfTokenAndHeaders);
                                connectPromisesbatch.push(connectRes);
                                quantityItr--;
                                referenceDesignatorItr++;
                                connectRes.then((response: any) => {
                                    logChildResponse(item, "Successfully Connected");
                                }).catch((error) => {
                                    logChildResponse(item, "Error while connecting items: "+ error.message);
                                });
                            }
                        }
                        else if (item.item.type == rawMaterialType) {
                            const connectRes = this.connectItemtoParent(item.parent, item.item, instanceAttributes, quantity, item.securityContext, csrfTokenAndHeaders)
                            connectPromisesbatch.push(connectRes);
                            connectRes.then((response: any) => {
                                logChildResponse(item, "Successfully Connected");
                            }).catch((error) => {
                                logChildResponse(item, "Error while connecting items: "+ error.message);
                            });
                        }
                    }
                }
            }
            // Await all connectPromisesbatch
            await Promise.all(connectPromisesbatch);
        }
        finalResponse.responses.push(resultResponse.responses);
        resultResponse.responses = [];
    }
        // Await all connectPromises
        //sending response once all the items are connected.
        if (finalResponse.responses.length > 0) {
            finalResponse.success = true;
        }
        res.status(200).send(finalResponse);
        if (emailNotification) {
            this.sendEmailNotification(userId, "Items Uploaded Successfully");
        }
    }
    //sending Email Notification
    async sendEmailNotification(userId, message) {
        return true;
    }

    //Validating Payload
    async validateRequestBodyPayload(payload: UploadItem, securityContext: string, csrfTokenAndHeaders: any) {
        if (!payload.email || !payload.userId || !payload.securityContext || payload.items.length<1 || payload.emailNotification==undefined) {
            return false;
        }
        return true;
    }
    //Validating Item Payload
    async validateItemPayload(itemPayload: any, securityContext: string, csrfTokenAndHeaders: any) {
        let classificationIdFound;
            classificationIdFound = await this.itemService.getClassifcationIdByType(
                itemPayload.classificationType,
                itemPayload.collabSpaceTitle,
                "item",
                securityContext,
                csrfTokenAndHeaders
            );
        const isValid = classificationIdFound &&
            itemPayload.classificationType &&
            itemPayload.collabSpaceTitle &&
            itemPayload.collabSpace &&
            itemPayload.attributes?.["dseng:EnterpriseReference"]?.partNumber;
        return Boolean(isValid);
    }
    async validateItemStructurePayload(itemStructurePayload: any, securityContext: string, csrfTokenAndHeaders: any) {
        let classificationIdFound;
            classificationIdFound = await this.itemService.getClassifcationIdByType(
                itemStructurePayload.classificationType,
                itemStructurePayload.collabSpaceTitle,
                "item",
                securityContext,
                csrfTokenAndHeaders
            );
        const isValid =  itemStructurePayload.level!=undefined && classificationIdFound &&
            itemStructurePayload.classificationType &&
            itemStructurePayload.collabSpaceTitle &&
            itemStructurePayload.collabSpace &&
            itemStructurePayload.attributes?.["dseng:EnterpriseReference"]?.partNumber && itemStructurePayload?.instanceAttributes?.quantity && itemStructurePayload?.instanceAttributes?.name;
        return Boolean(isValid);
    }

    //Connecting Item to Parent
    async connectItemtoParent(parentItem: any, childItem: any, instanceAttributes: any, quantity: number, securityContext: string, csrfTokenAndHeaders: any) {
        return new Promise((resolve, reject) => {
            let customerAttributes={...instanceAttributes.customerAttributes};
            let instanceAttributesCopy={...instanceAttributes};
            delete instanceAttributesCopy.customerAttributes;
            const headers: any = {
                Cookie: csrfTokenAndHeaders.Cookie,
                SecurityContext: securityContext,
                ENO_CSRF_TOKEN: csrfTokenAndHeaders.ENO_CSRF_TOKEN,
                "Content-Type": csrfTokenAndHeaders["Content-Type"]
            };
            let relativePath;
            const connectItemUrl = connectEngItemUrl(parentItem.id);
            let payload;
            if (childItem.type.trim() == "VPMReference") {
                relativePath = "/resources/v1/modeler/dseng/dseng:EngItem/" + childItem.id;
                const type = "dseng:EngItem";
                payload = {
                    "instances": [
                        {
                            "referencedObject": {
                                "source": baseURL,
                                "type": type,
                                "identifier": childItem.id,
                                "relativePath": relativePath,
                            },
                            "attributes": instanceAttributesCopy
                        }
                    ]
                };
            }
            else if (childItem.type.trim() == "Raw_Material") {
                relativePath = "/resources/v1/modeler/dsrm/dsrm:RawMaterial/" + childItem.id;
                const type = "dsrm:RawMaterial";
                payload = {
                    "instances": [
                        {
                            "referencedObject": {
                                "source": baseURL,
                                "type": type,
                                "identifier": childItem.id,
                                "relativePath": relativePath,
                            },
                            "attributes": instanceAttributesCopy
                        }
                    ]
                };
            }
            axios.post(connectItemUrl, JSON.stringify(payload), { headers }).then((result) => {
                const modifyInstanceAttributePayload={
                    customerAttributes:customerAttributes,
                    "cestamp": result.data.member[0].cestamp,
                }
                this.itemService.modifyinstanceAttributes(parentItem.id, result.data.member[0].id,modifyInstanceAttributePayload, securityContext, csrfTokenAndHeaders).catch((error) => {
                    reject(new Error(JSON.stringify({ "parentName": parentItem.title, "parentId": parentItem.id, "childTitle": childItem.title, "childId": childItem.id, message: "Error while modifying instance attributes" + error.message })));                    
                });
                if (childItem.type == rawMaterialType) {
                    const modifyAttributePayload = {
                        "quantity": quantity,
                        "quantityUOM": "GRAM"
                    }
                    this.itemService.modifyQuantityAttributeForRawMaterial(parentItem.id, result.data.member[0].id, JSON.stringify(modifyAttributePayload), securityContext, csrfTokenAndHeaders).then((result) => {
                        resolve({ "parentName": parentItem.title, "parentId": parentItem.id, "childTitle": childItem.title, "childId": childItem.id, message: "Successfully Connected" });
                    }).catch((error) => {
                        reject(new Error(JSON.stringify({ "parentName": parentItem.title, "parentId": parentItem.id, "childTitle": childItem.title, "childId": childItem.id, message: "Error while Connecting Item--" + error.message })));
                    })
                }
                else if (childItem.type == physicalProductType) {
                    resolve({ "parentName": parentItem.title, "parentId": parentItem.id, "childTitle": childItem.title, "childId": childItem.id, message: "Successfully Connected" });
                }
            }).catch((error) => {
                reject(new Error(JSON.stringify({ "parentName": parentItem.title, "parentId": parentItem.id, "childTitle": childItem.title, "childId": childItem.id, message: "Error while Connecting Item--" + error.message })));
            });
        });
    }
    //Checking whether the item is already connected as child
    async checkItemConnectedAsChild(itemType: string, parentId: string, childId: string, quantity: number, securityContext: string, csrfTokenAndHeaders: any) {
        let payload;
        let instanceIds = [] as any[];
        if (itemType == physicalProductType) {
            payload = {
                "referencedObjects": [
                    {
                        "source": baseURL,
                        "type": "dseng:EngItem",
                        "identifier": childId,
                        "relativePath": `/resources/v1/modeler/dseng/dseng:EngItem/${childId}`
                    }
                ]
            }
        }
        else if (itemType == rawMaterialType) {
            payload = {
                "referencedObjects": [
                    {
                        "source": baseURL,
                        "type": "dsrm:RawMaterial",
                        "identifier": childId,
                        "relativePath": `/resources/v1/modeler/dsrm/dsrm:RawMaterial/${childId}`
                    }
                ]
            }
        }
        const headers: any = {
            Cookie: csrfTokenAndHeaders.Cookie,
            SecurityContext: securityContext,
            ENO_CSRF_TOKEN: csrfTokenAndHeaders.ENO_CSRF_TOKEN,
            "Content-Type": csrfTokenAndHeaders["Content-Type"]
        };
        return new Promise((resolve, reject) => {
            axios.post(whereUsedEngItemUrl, JSON.stringify(payload), {
                headers
            }).then((connectedRes) => {
                let quantityCounter = 0;
                connectedRes.data.member[0]["dseng:EngInstance"].member.forEach((item) => {
                    if (item.parentObject.identifier === parentId) {
                        quantityCounter++;
                        instanceIds.push({ id: item.id, cestamp: item.cestamp });
                        if (quantityCounter >= quantity) {
                            resolve(instanceIds);
                            return;
                        }
                    }
                });
                resolve(false);
            }).catch((error) => {
                reject(new Error("Error while checking item connected as child" + error.message));
            });
        })
    }
}
export default MassUploadService;