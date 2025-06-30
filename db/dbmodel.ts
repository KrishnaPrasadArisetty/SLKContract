// 1. importing the required APIs for performing operations with Cosmos
import { CosmosClient, Database, Container } from '@azure/cosmos';
// 2. importing the application configuration constant for URL and Primary key 
import { appConfig } from "../appconfig/config";

const https = require('https'); // Require the https module at the top
const configuration = require("../appconfig/configuration.json")

function safeStringify(obj, indent = 2) {
    const cache = new Set();
    const json = JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (cache.has(value)) {
                return '[Circular]';
            }
            cache.add(value);
        }
        return value;
    }, indent);
    cache.clear();
    return json;
}

// 4. The Data Access class to create various operations
export class DBModel {
    // 4.1. defining class level members 
    private client: CosmosClient;
    private databaseId: string;
    private collectionId: string;
    private database: Database;
    private container: Container;
    // 4.2. constructor contains code to connect to CosmosDB Account
    constructor() {
        const options = {
            endpoint: appConfig.uri,
            key: appConfig.authKey,
            userAgentSuffix: 'CosmosDBJavascriptQuickstart',
        };
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = configuration?.ORACLE?.NODE_TLS_REJECT_UNAUTHORIZED;
        // 4.3. creating an instance of the CosmosClient and settings keys
        this.client = new CosmosClient({
            endpoint: appConfig.uri,
            key: appConfig.authKey,
            agent: new https.Agent({ // Correct usage
                keepAlive: true,
                timeout: 20000 // Increase timeout to 20 seconds
            }),
            connectionPolicy: {
                requestTimeout: 20000, // 20 seconds
            }
        });
        // 4.4. set the databaseId and containerId
        this.databaseId = appConfig.databaseId;
        this.collectionId = appConfig.containerId;
        //ends here
        // console.log('stage instance db models constructor log');
    }

    // 4.5. initialize the CosmosDB connections to create database
    async initDbAndContainer() {
        try {
            // console.log(this.databaseId, 'called');
            // const { database } = await this.client.databases.createIfNotExists({ id: this.databaseId });
            // console.log('Database created', safeStringify(database));
            await this.client.databases.createIfNotExists({ id: this.databaseId }).then((res) => {
                const responseDb = res;
                this.database = responseDb.database;
                // console.log(`Database Created ${this.database?.id}`);
            }).catch((err) => {
                // console.log(`Error creating database`, err);
                return err;
            })
            // console.log(`Database Created`, this.database?.id);
            return this.database;
        } catch (err) {
            // console.log(`Error creating database`, err);
            return err;
        }
    }
    // ends here
}