import { Item } from "./item";

class UploadItem
{
    email: string;
    userId:string;
    securityContext:string;
    emailNotification: boolean;
    items: Item[];
    constructor(
        email: string,
        userId:string,
        securityContext:string,
        emailNotification: boolean,
        items: Item[]
    )
    {
        this.email = email;
        this.userId = userId;
        this.securityContext = securityContext;
        this.emailNotification = emailNotification;
        this.items = items;
    }
}
export default UploadItem;