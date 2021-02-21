import './logger';

//Load Mgrs
import { AuthMgr } from "./lib/authMgr";
import { StorageMgr } from "./lib/storageMgr";
import { HashStorageMgr } from "./lib/hashStorageMgr";
import { QueryResolverMgr } from "./lib/queryResolverMgr";
import { EdgeResolverMgr } from "./lib/edgeResolverMgr";
import { HashResolverMgr } from "./lib/hashResolverMgr";
import { SchemaMgr } from "./lib/schemaMgr";
import "./logger";
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

const { ApolloServer } = require("apollo-server-express");
const schema = schemaMgr.getSchema();
const server = new ApolloServer({
  schema,
  context: (p: any) => {
    return {
      headers: p.req.headers,
    };
  },
  introspection: true,
  graphqlPath: "/graphql",
});

import * as express from "express";
const app = express();
server.applyMiddleware({ app }); // app is from an existing express app

const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>
  console.log(
    `🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`
  )
);
