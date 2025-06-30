import { onPremServices } from "./onPremServices";
import { saasServices } from "./saasServices";

let executionClass;
let instance = 'onPrem'
switch(instance) {
    case "onPrem":
        executionClass = new onPremServices();
        break;
    case "Cloud":
        executionClass = new saasServices();
        break;
}

export class InstanceFactory {
    sendItemAPIExecution = (newObsoletepartDetails, muleheaderDetails) => {
        return executionClass.sendItemAPIExecution(newObsoletepartDetails, muleheaderDetails);
    }
}