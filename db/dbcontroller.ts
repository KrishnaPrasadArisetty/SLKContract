// 1. import the DBModel class
import { DBModel } from "./dbmodel";
// 2. The DBController class
export class DBController {
    // 3.1 Define an instance of the DBModel class
    private database: DBModel;
    constructor() {
        this.database = new DBModel();
    }
    // 3.2 the init method accepts initDbAndContainer() 
    //   method to create database 
    async init() {
        // console.log('called init in db controller');
        const res = await this.database.initDbAndContainer();
        return res;
        
    }
}