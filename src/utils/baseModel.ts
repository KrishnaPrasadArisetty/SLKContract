import { Container } from "@azure/cosmos";
import { database } from "@/db/dbConnection";

export class BaseCosmosModel {
  protected containerId: string;
  protected partitionKeyPath: string;
  protected container: Container;

  constructor(containerId: string, partitionKeyPath: string) {
    this.containerId = containerId;
    this.partitionKeyPath = partitionKeyPath;
  }

  async initContainer(): Promise<Container> {
    try {
      const db = await database;

      if (!db?.id) throw new Error("The specified database is not present");

      const { container } = await db.containers.createIfNotExists(
        {
          id: this.containerId,
          partitionKey: { paths: [`/${this.partitionKeyPath}`] },
        },
        { offerThroughput: 400 }
      );

      this.container = container;
      console.info(`Container initialized: ${this.containerId}`);

      return this.container;
    } catch (error) {
      console.error(
        `Failed to initialize container: ${this.containerId}`,
        error
      );

      throw error;
    }
  }

  protected ensureContainer() {
    if (!this.container)
      throw new Error(
        "Container is not initialized. Call `initContainer()` first."
      );
  }
}
