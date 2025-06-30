import { ItemStructure } from "./itemStructure";

class UploadItemStructure
{
    email: string;
    userId:string;
    securityContext:string;
    emailNotification: boolean;
    items: ItemStructure[];
    constructor(
        email: string,
        userId:string,
        securityContext:string,
        emailNotification: boolean,
        items: ItemStructure[]
    )
    {
        this.email = email;
        this.userId = userId;
        this.securityContext = securityContext;
        this.emailNotification = emailNotification;
        this.items = items;
    }
}
export default UploadItemStructure;