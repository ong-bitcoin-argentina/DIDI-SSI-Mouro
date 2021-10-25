"use strict";

//Load Mgrs
import { AuthMgr } from "./lib/authMgr";
import { StorageMgr } from "./lib/storageMgr";
import { QueryResolverMgr } from "./lib/queryResolverMgr";
import { EdgeResolverMgr } from "./lib/edgeResolverMgr";
import { HashResolverMgr } from "./lib/hashResolverMgr";
import { SchemaMgr } from "./lib/schemaMgr";

//Load handlers
import { GraphQLHandler } from "./handlers/graphql";
import { HashStorageMgr } from "./lib/hashStorageMgr";

const { BlockchainManager } = require("@proyecto-didi/didi-blockchain-manager");
const constants = require("./constants/constants");

//Instanciate Blockchain Manager
const config = {
  gasPrice: 10000,
  providerConfig: constants.BLOCKCHAIN.PROVIDER_CONFIG, // for multiblockchain
};

const blockchainManager = new BlockchainManager(
  config,
  constants.BLOCKCHAIN.GAS_INCREMENT
);

//Instanciate Mgr
let authMgr = new AuthMgr(blockchainManager);

let storage = new (require("./lib/sqliteMgr"))();
// if (process.env.SQLITE_FILE) storage =  new (require("./sqliteMgr"))();
// if (process.env.PG_URL) storage =  new (require("./pgMgr"))();
// if(process.env.DYNAMODB_TABLE) storage =  new (require("./dynamoMgr"))();

let storageMgr = new StorageMgr(storage);
let hashStorageMgr = new HashStorageMgr(storage);

let queryResolverMgr = new QueryResolverMgr(authMgr, storageMgr);
let edgeResolverMgr = new EdgeResolverMgr(
  blockchainManager,
  authMgr,
  storageMgr
);
let hashResolverMgr = new HashResolverMgr(authMgr, hashStorageMgr);
let schemaMgr = new SchemaMgr(
  queryResolverMgr,
  edgeResolverMgr,
  hashResolverMgr
);

//Instanciate handlers
const graphqlHandler = new GraphQLHandler(schemaMgr).getHandler();

//Exports for serverless
exports.graphql = graphqlHandler;
