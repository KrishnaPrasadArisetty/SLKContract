export class Attributes {
    title: string;
    description: string;
    // Dynamic keys using index signature
    ["dseno:EnterpriseAttributes"]: { [key: string]: any };
    ["dseng:EnterpriseReference"]: { [key: string]: any };

    constructor(
        title: string,
        description: string,
        enterpriseAttrs: { [key: string]: any },
        enterpriseRef: { [key: string]: any }
    ) {
        this.title = title;
        this.description = description;
        this["dseno:EnterpriseAttributes"] = enterpriseAttrs;
        this["dseng:EnterpriseReference"] = enterpriseRef;
    }
}

export class Item {
    type: string;
    attributes: Attributes;
    classificationType: string;
    collabSpace: string;
    collabSpaceTitle: string;
    constructor(
        type: string,
        attributes: Attributes,
        classificationType: string,
        collabSpace: string,
        collabSpaceTitle: string
    ) {
        this.type = type;
        this.attributes = attributes;
        this.classificationType= classificationType;
        this.collabSpace = collabSpace;
        this.collabSpaceTitle = collabSpaceTitle;
    }
}
