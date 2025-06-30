import { containerKeys, partitionKeys } from "@/src/utils/config";
import { configDotenv } from "dotenv";

configDotenv();

const serverMode = process.env.SERVER_MODE_ENV ?? "dev";

let appConfig: AppConfigType;
let CONTAINER: typeof containerKeys;
let PARTITIONKEY: typeof partitionKeys;

if (serverMode === "dev") {
  appConfig = {
    uri: "https://emr-product-datahub-stage-sap.documents.azure.com:443/",
    authKey:
      "Zi4ZmMrE2AEFZIB6BMdIBaOfrSBuby2slMWWhYztAi7fbuTlaS4JGuyXkStan3sXtwPdfDBQuWwIACDbjC5NVg==",
    databaseId: "emrproducthubstg",
  };

  CONTAINER = {
    BOS_ATTRIBUTES: "BOS_AttributesDev",
  };

  PARTITIONKEY = {
    BOS_ATTRIBUTES: "ItemName",
  };
}

export { appConfig, CONTAINER, PARTITIONKEY, serverMode };
