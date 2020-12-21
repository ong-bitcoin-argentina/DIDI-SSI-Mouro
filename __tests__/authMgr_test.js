const constants = require("../src/constants/constants");
const { BlockchainManager } = require("@proyecto-didi/didi-blockchain-manager");
const { AuthMgr } = require("../src/lib/authMgr");
const { EdgeResolverMgr } = require("../src/lib/edgeResolverMgr");

const { StorageMgr } = require("../src/lib/storageMgr");
jest.mock("../src/lib/storageMgr");

const config = {
  gasPrice: 10000,
  providerConfig: constants.BLOCKCHAIN.PROVIDER_CONFIG, // for multiblockchain
};

const blockchainManager = new BlockchainManager(
  config,
  constants.BLOCKCHAIN.GAS_INCREMENT
);

const payload = { name: "TEST" };

const createAndVerifyJwt = async (prefixToAdd) => {
  const identity = blockchainManager.createIdentity(prefixToAdd);

  const createdJwt = await blockchainManager.createJWT(
    identity.did,
    identity.privateKey,
    {
      ...payload,
    }
  );

  const verifiedJwt = await blockchainManager.verifyJWT(createdJwt);
  const returnObject = {
    createdJwt,
    verifiedJwt,
    identityDid: identity.did,
  };
  return returnObject;
};

const header = {
  authorization:
    "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NkstUiJ9.eyJpYXQiOjE2MDU1Mzk5NjEsIm5hbWUiOiJURVNUIiwiaXNzIjoiZGlkOmV0aHI6MHhlZGZkOWU1MDY0MmYwMTY3YmMxY2E2YjQ3NDY3ZDZmMTIxNDljYjQ5In0.xuV77pr9oNvTS5Of61mtM96HXDfg8mKoTz9D981u3z8qUqmkH9DyV_VhfIx7fYNNyWNdT8l3NDWDf1mMIvzChgE",
  Authorization:
    "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NkstUiJ9.eyJpYXQiOjE2MDU1Mzk5NjEsIm5hbWUiOiJURVNUIiwiaXNzIjoiZGlkOmV0aHI6MHhlZGZkOWU1MDY0MmYwMTY3YmMxY2E2YjQ3NDY3ZDZmMTIxNDljYjQ5In0.xuV77pr9oNvTS5Of61mtM96HXDfg8mKoTz9D981u3z8qUqmkH9DyV_VhfIx7fYNNyWNdT8l3NDWDf1mMIvzChgE",
};

describe("authMgr class should", () => {
  const prefixToAdd = "lacchain"; // for multiblockchain

  it("verify a created jwt", async () => {
    const receivedObject = await createAndVerifyJwt(prefixToAdd);

    const authMgr = new AuthMgr(blockchainManager);
    const verifiedJwt = await authMgr.verify(receivedObject.createdJwt);

    expect(verifiedJwt.payload.name).toEqual("TEST");
    expect(verifiedJwt.doc).toBeDefined();
    expect(receivedObject.verifiedJwt).toEqual(verifiedJwt);
  });

  it("verify a created jwt in edgeResolver class", async () => {
    const receivedObject = await createAndVerifyJwt(prefixToAdd);
    const storage = new StorageMgr();

    const authMgr = new AuthMgr(blockchainManager);
    const edgeResolver = new EdgeResolverMgr(
      blockchainManager,
      authMgr,
      storage
    );

    const edgeReturn = await edgeResolver.addEdge(
      header,
      receivedObject.createdJwt,
      receivedObject.identityDid
    );

    expect(edgeReturn.jwt).toBeDefined();
    expect(edgeReturn.jwt).toEqual(receivedObject.createdJwt);
    expect(edgeReturn.from).toEqual({ did: receivedObject.identityDid });
  });
});
