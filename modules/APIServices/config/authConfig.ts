/* const authConfig = {
    "username": "sudarshan.sambamurthy@emerson.com",
    "password": "Wimbledon2023*",
    // "username": "3dxserviceuser@emerson.com",
    // "password": "Emerson123",
    "SecurityContext" : "VPLMProjectLeader.0000000001.Micro Motion",
    "AuthURL":"https://oi000186152-eu1.iam.3dexperience.3ds.com/login?",
    "CSRFURL":"https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/application/CSRF?tenant=OI000186152",
    "AuthParamURL":"https://oi000186152-eu1.iam.3dexperience.3ds.com/login?action=get_auth_params",
    "Content-Type":"application/json;charset=UTF-8"
};

export const securityContextConfig = {
    SecurityContext : "VPLMProjectAdministrator.BU-0000001.Rosemount Measurement"
}*/

import { configDotenv } from "dotenv";
configDotenv()

const authConfig = {
    "username": "3dxserviceuser@emerson.com",
    "password": "Emerson234",
    "SecurityContext" : "VPLMProjectLeader.0000000001.Micro Motion",
    // SecurityContext: "ctx%3A%3AVPLMProjectLeader.Company%20Name.MSOL-Corrosion%20%26%20Erosion",
    "AuthURL":process.env.SAAS_LOGIN_URL||"",
    "CSRFURL":process.env.SAAS_CSRF_URL||"",
    "AuthParamURL":process.env.SAAS_AUTH_PARAM_URL||"",
    "currentUserContextURL": `${process.env.SAAS_BASE_URL}/resources/modeler/pno/person/?current=true&select=collabspaces`,
    "Content-Type":"application/json;charset=UTF-8"
};

export default authConfig;

export const securityContextConfig = {
    SecurityContext : "VPLMProjectAdministrator.Company Name.Micro Motion",
    LeaderCredential: "VPLMProjectLeader"
}
