"use strict";

//Load Mgrs
import { AuthMgr } from "./lib/authMgr";
import { StorageMgr } from "./lib/storageMgr";
import { QueryResolverMgr } from "./lib/queryResolverMgr";
import { EdgeResolverMgr } from "./lib/edgeResolverMgr";
import { HashResolverMgr } from "./lib/hashResolverMgr";
import { SchemaMgr } from "./lib/schemaMgr";

//Instanciate Mgr
let authMgr = new AuthMgr();

let storage = new (require("./lib/sqliteMgr"))();
// if (process.env.SQLITE_FILE) storage =  new (require("./sqliteMgr"))();
// if (process.env.PG_URL) storage =  new (require("./pgMgr"))();
// if(process.env.DYNAMODB_TABLE) storage =  new (require("./dynamoMgr"))();

let storageMgr = new StorageMgr(storage);
let hashStorageMgr = new HashStorageMgr(storage);

let queryResolverMgr = new QueryResolverMgr(authMgr, storageMgr);
let edgeResolverMgr = new EdgeResolverMgr(authMgr, storageMgr);
let hashResolverMgr = new HashResolverMgr(authMgr, hashStorageMgr);
let schemaMgr = new SchemaMgr(
	queryResolverMgr,
	edgeResolverMgr,
	hashResolverMgr
);

//Load handlers
import { GraphQLHandler } from "./handlers/graphql";
import { HashStorageMgr } from "./lib/hashStorageMgr";

//Instanciate handlers
const graphqlHandler = new GraphQLHandler(schemaMgr).getHandler();

//Exports for serverless
exports.graphql = graphqlHandler;
