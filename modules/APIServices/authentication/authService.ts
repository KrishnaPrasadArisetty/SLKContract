import axios, {AxiosHeaders, AxiosResponse} from 'axios';
import authConfig from '../config/authConfig';
const https = require('https');

const agent = new https.Agent({  
  rejectUnauthorized: false
});

interface FutureRequestHeaders {
    Cookie: string|undefined;
    SecurityContext: string;
    ENO_CSRF_TOKEN: string;
    'Content-Type': string;
}

class AuthService {
    async authenticateUser(userData:any): Promise<FutureRequestHeaders> {
        try {
            const {AuthURL, AuthParamURL, CSRFURL, username, password, SecurityContext} = authConfig;
            console.log("entered in authenticateUser", AuthParamURL);
            // Make a request to the 3rd party API using Axios
            console.time('LTTokenAPIExecutionTime');
            const response: AxiosResponse<any, any> = await axios.get(AuthParamURL,  { httpsAgent: agent });
            console.timeEnd('LTTokenAPIExecutionTime');
            const LoginToken = response?.data?.lt;
            console.log('LoginToken', LoginToken);
            console.time('AuthURLCompleteAPIExecutionTime');            
            let AuthURLComplete = `${AuthURL}lt=${LoginToken}&username=${username}&password=${password}&service=${CSRFURL}`;
            console.timeEnd('AuthURLCompleteAPIExecutionTime');
            console.log('AuthURLComplete', AuthURLComplete);
            const loginCookies = response.headers['set-cookie'];
            console.time('CSRFTokenAPIExecutionTime');
            const csrfTockenURLResponse: AxiosResponse<any, any> = await axios.post(AuthURLComplete, null, {
                httpsAgent: new https.Agent({  
                  rejectUnauthorized: false
                }),
                headers: {
                    'Cookie': loginCookies?.join('; '),
                    'Content-Type': response.headers['Content-Type'],
                    'User-Agent': 'test'
                }
            });
            //console.log("csrfTockenURLResponse", csrfTockenURLResponse);
            const afterLogInCookies = csrfTockenURLResponse.headers['set-cookie'];
            const csrfValue = csrfTockenURLResponse?.data?.csrf.value;
            console.timeEnd('CSRFTokenAPIExecutionTime');
            console.log('csrfValue', csrfValue);
            console.time('defaultSecurityContextAPIExecutionTime');
            const headersForFutureRequests: FutureRequestHeaders = {
                'Cookie': afterLogInCookies?.join('; '),
                // 'SecurityContext': SecurityContext,
                'ENO_CSRF_TOKEN': csrfValue,
                'Content-Type': 'application/json'
            }

            const defaultSecContext = await this.getDefaultSecurityContext(headersForFutureRequests);
            console.timeEnd('defaultSecurityContextAPIExecutionTime');
            console.log('defaultSecContext', defaultSecContext);
            headersForFutureRequests.SecurityContext = defaultSecContext;
            console.log('headersForFutureRequests', headersForFutureRequests);
            // Return the authentication token
            return headersForFutureRequests;
        } catch (error) {
            // console.log(error)
            // Handle any errors that occur during the request
            throw new Error('Failed to authenticate user');
        }
    }

    async getDefaultSecurityContext(headersForFutureRequests:FutureRequestHeaders): Promise<string> {
        try {

            const headers: AxiosHeaders = {
                Cookie: headersForFutureRequests.Cookie,
                SecurityContext: headersForFutureRequests.SecurityContext,
                ENO_CSRF_TOKEN: headersForFutureRequests.ENO_CSRF_TOKEN,
                "Content-Type": headersForFutureRequests["Content-Type"],
              };
            console.log('header in getDefaultSecurityContext', headers);
            const currentUserContextURL = authConfig.currentUserContextURL;
            console.log('authConfig.currentUserContextURL', currentUserContextURL);
            const securityContextResponse: AxiosResponse<any, any> = await axios.get(currentUserContextURL,  { 
                headers,
                httpsAgent: agent,
                 
            });
            console.log('securityContextResponse', securityContextResponse.data);
            const firstCollabSpaceDetails =  securityContextResponse?.data?.collabspaces[0];
            console.log('firstCollabSpaceDetails', firstCollabSpaceDetails);
            const defaultSecContext = `${firstCollabSpaceDetails?.couples[0]?.role?.name}.${firstCollabSpaceDetails?.couples[0]?.organization?.name}.${firstCollabSpaceDetails?.name}`;
            console.log('defaultSecContext', defaultSecContext);
            return defaultSecContext;
        } catch (error) {
            // console.log(error)
            // Handle any errors that occur during the request
            throw new Error('Failed to get default security context');
        }
    }
}

export default AuthService;