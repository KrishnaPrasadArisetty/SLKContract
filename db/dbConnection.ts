import { DBController } from './dbcontroller'

const dbController = new DBController();

const database  = dbController.init()

 export { database }

