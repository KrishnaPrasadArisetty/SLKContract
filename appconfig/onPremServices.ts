import { APIBASEURL } from './APIsConfiguration';
import { encryptByAES } from "./../utils/index";
import axios from 'axios';

let instance = 'onPrem'
export class onPremServices {
    async sendItemAPIExecution(newObsoletepartDetails, muleheaderDetails){
        const finalPayloadToMule = newObsoletepartDetails?.obsoletePartData
        finalPayloadToMule.source = {
            "url": "3dxr21x-u1",
            "instance": "ENOVIA"
        };
        finalPayloadToMule.target = {
            "system": "ORACLE",
            "instance": "OBI", //for mass descripton update set it to "MDU"
            "businessUnit": "MICROMOTION"
        }

        const encryptPayloadToMule = encryptByAES(finalPayloadToMule);
        let sendItemUrl = APIBASEURL[instance].sendItem        
        return await axios.post(sendItemUrl, encryptPayloadToMule, muleheaderDetails); 
    }
}