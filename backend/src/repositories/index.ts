import { MongoClient, Db, FilterQuery } from "mongodb";

export const DbClient = new MongoClient(
  process.env.ATLAS_CONNECTION_STRING,
  { useUnifiedTopology: true }
); 

const dbName = process.env.DB_NAME;

const getDatabase = async (dbName: string): Promise<Db> => {
  return DbClient.isConnected() ? DbClient.db(dbName) : (await DbClient.connect()).db(dbName)
}

const getCollection = async (collection: string)=>{
  return (await getDatabase(dbName)).collection(collection)
}

//http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#find
export const mongoFind = 
async <TModel extends unknown, TSchema = any>(query: FilterQuery<TSchema>, collection: string): 
Promise<TModel|null> => {
  return (await getCollection(collection)).findOne<TModel>(query); 
}
export const findMany = 
async <TModel extends unknown, TSchema = any>(query: FilterQuery<TSchema>, collection: string) => {
  return (await getCollection(collection)).find(query).toArray(); 
}

export const insertOne = async <TSchema extends unknown>(query: TSchema, collection: string) => {
  const dbCollection = await getCollection(collection); 
  const callback = await dbCollection.insertOne(query);
  if(callback.insertedCount === 0){
    throw `The data couldn be inserted... \n ${callback.result}`; 
  }
  return callback.insertedId 
}

export const updateOne = async (id: any, update: any, collection: string) => {
  const dbCollection = await getCollection(collection);
  return await dbCollection.updateOne({ _id: id }, { $set: update });
}
