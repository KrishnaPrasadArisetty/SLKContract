import { env } from "./env";

const serverMode = env.SERVER_MODE_ENV;

const suffix = serverMode?.[0]?.toUpperCase() + serverMode?.slice(1);

const dynamicContainerName = (base: string) => `${base}${suffix}`;

export const containerKeys: ContainerType = {
  USERS: dynamicContainerName("users"),
  JDI_BOM: dynamicContainerName("jdiBom"),
  DEST_ORGS: dynamicContainerName("destOrgs"),
};

export const partitionKeys: PartitionType = {
  BOS_ATTRIBUTES: "ItemName",
  USERS: "userId",
  JDI_BOM: "userEmail",
  DEST_ORGS: "id",
};
