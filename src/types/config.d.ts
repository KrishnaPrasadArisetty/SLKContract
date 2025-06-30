// *************************TYPE DEFINITIONS*************************

type AppConfigType = {
  uri: string;
  authKey: string;
  databaseId: string;
};

type ContainerKey = "USERS" | "JDI_BOM" | "DEST_ORGS" | "BOS_ATTRIBUTES";
type PartitionKey = ContainerKey;

type ContainerType = {
  [K in ContainerKey]?: string;
};

type PartitionType = {
  [K in PartitionKey]?: string;
};

type ModeConfig = {
  appConfig: AppConfigType;
  CONTAINER: ContainerType;
  PARTITIONKEY: PartitionType;
};

type IServerMode = "dev" | "qa" | "stage" | "prod";

// ******************************************************************
