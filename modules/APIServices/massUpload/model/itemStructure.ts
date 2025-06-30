export class Attributes {
    title: string;
    description: string;
    // Dynamic keys using index signature
    ["dseno:EnterpriseAttributes"]: { [key: string]: any };
    ["dseng:EnterpriseReference"]: { [key: string]: any };
    instanceAttributes: { [key: string]: any };
    

    constructor(
        level: number,
        title: string,
        description: string,
        enterpriseAttrs: { [key: string]: string },
        enterpriseRef: { [key: string]: string },
        
    ) {
        this.title = title;
        this.description = description;
        this["dseno:EnterpriseAttributes"] = enterpriseAttrs;
        this["dseng:EnterpriseReference"] = enterpriseRef;
    }
}

export class ItemStructure {
    level: number;
    type: string;
    attributes: Attributes;
    classificationType: string;
    collabSpace: string;
    collabSpaceTitle: string;
    instanceAttributes: { [key: string]: any };

    constructor(
        level: number,
        type: string,
        attributes: Attributes,
        classificationType: string,
        collabSpace: string,
        collabSpaceTitle: string,
        instanceAttributes: { [key: string]: any }
        
    ) {
        this.level = level;
        this.type = type;
        this.attributes = attributes;
        this.classificationType= classificationType;
        this.collabSpace = collabSpace;
        this.collabSpaceTitle = collabSpaceTitle;
        this.instanceAttributes = instanceAttributes;
    }
}
