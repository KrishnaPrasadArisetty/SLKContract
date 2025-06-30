import { Request, Response } from "express";
import AuthService from "../authentication/authService";
import API_CONFIG from "../config/APIConfig";
import axios, { AxiosHeaders } from "axios";
import { urlConfig } from "../config/urlConfig";

import { EmailController } from '../../mailer/mailer.controller';

const https = require("https");
import { configurations } from "../config/configurations";

const agent = new https.Agent({
    rejectUnauthorized: false,
});

interface FutureRequestHeaders {
    Cookie: string | undefined;
    SecurityContext: string;
    ENO_CSRF_TOKEN: string;
    "Content-Type": string;
}

class document {
    // const userInfo = {// Optional to pass this object
    //     username: authConfig.username,
    //     password: authConfig.password,
    //     securityContext: authConfig.SecurityContext
    // };
    async getAuthenticationToken(
        userInfo: any = {}
    ): Promise<FutureRequestHeaders> {
        const authService = new AuthService();
        const csrfToken = await authService.authenticateUser(userInfo);

        return csrfToken;
    }

    // Check if document object exists if yes return object details
    // If multiple revisions exist look for the revision which is latest
    public async checkDocumentExists(name: string, headers: AxiosHeaders): Promise<object[]> {
        try {
            const {
                searchDocumentURL
            } = urlConfig;

            const {
                searchDocParams,
            } = API_CONFIG;

            if (!headers) {
                const csrfTokenAndHeaders = await this.getAuthenticationToken();

                headers = {
                    Cookie: csrfTokenAndHeaders.Cookie,
                    SecurityContext: csrfTokenAndHeaders.SecurityContext,
                    ENO_CSRF_TOKEN: csrfTokenAndHeaders.ENO_CSRF_TOKEN,
                    "Content-Type": csrfTokenAndHeaders["Content-Type"],
                };
            }

            searchDocParams.searchStr = `name=${name}`;
                const docSearchRes = await axios.get(`${searchDocumentURL}`, {
                    params: searchDocParams,
                    headers,
                    httpsAgent: agent,
                });

            return docSearchRes?.data;
        } catch (error) {
            console.error('Error checking document existence:', error);
            const errorMessage = error?.response?.data?.error || error?.response?.data?.errorReport[0]?.errorMessage || error.message || 'Unknown error';
            throw new Error(`Failed to check document existence: ${errorMessage}`);
        }
    }

    public async createDocument(docInfo: any, headers: AxiosHeaders): Promise<any> {
        try {

            const {
                createDocumentURL
            } = urlConfig;

            if (!headers) {
                const csrfTokenAndHeaders = await this.getAuthenticationToken();

                headers = {
                    Cookie: csrfTokenAndHeaders.Cookie,
                    SecurityContext: csrfTokenAndHeaders.SecurityContext,
                    ENO_CSRF_TOKEN: csrfTokenAndHeaders.ENO_CSRF_TOKEN,
                    "Content-Type": csrfTokenAndHeaders["Content-Type"],
                };
            }

            // headers["SecurityContext"] = `VPLMProjectLeader.Company Name.${docInfo['Collaborative Space']}`

            let body = {
                "data": [{ "dataelements": docInfo?.dataelements }]
            }
            const createDocResult = await axios.post(`${createDocumentURL}`, body, {
                headers,
                httpsAgent: agent,
            });

            return createDocResult?.data;
        } catch (error) {
            const errorMessage = error?.response?.data?.internalError || error?.response?.data?.errorReport[0]?.errorMessage || error.message || 'Unknown error'
            throw new Error(`Failed to create document: ${errorMessage}`);
        }
    }

    public async updateDocumentProperties(id: string, properties: any, headers: AxiosHeaders): Promise<object[]> {
        try {
            const {
                updateDocumentURL
            } = urlConfig;

            const {

            } = API_CONFIG;
            if (!headers) {
                const csrfTokenAndHeaders = await this.getAuthenticationToken();

                headers = {
                    Cookie: csrfTokenAndHeaders.Cookie,
                    SecurityContext: csrfTokenAndHeaders.SecurityContext,
                    ENO_CSRF_TOKEN: csrfTokenAndHeaders.ENO_CSRF_TOKEN,
                    "Content-Type": csrfTokenAndHeaders["Content-Type"],
                };
            }

            let body = {
                "data": [properties]
            }
            const updateDocResult = await axios.put(`${updateDocumentURL}/${id}`, body, {
                headers,
                httpsAgent: agent,
            });

            return updateDocResult?.data;
        } catch (error) {
            const errorMessage = error?.response?.data?.internalError || error?.response?.data?.errorReport[0]?.errorMessage || error.message || 'Unknown error'
            throw new Error(`Failed to update document properties: ${errorMessage}`);
        }
    }

    // public async setDocumentClassificationType(id: string,collabSpace:string ,classificationType: string, headers: AxiosHeaders): Promise<any> {
    //     try {
    //         const {searchLibraryURL} = urlConfig;
    //         const {searchLibParams} = API_CONFIG;

    //         // Search library by collb space name
    //         let searchLibParamsCopy = searchLibParams;
    //         searchLibParamsCopy.$searchStr = collabSpace;
    //         axios.get(searchLibraryURL, {
    //             params:searchLibParamsCopy,
    //             headers
    //         }
    //         // get all the children classes of the library
    //         // Classify the object in that class
        
    //     } catch (error) {
            
    //     }
    // }
}

export default document;