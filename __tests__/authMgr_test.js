const { AuthMgr } = require("../src/lib/authMgr");
const { EdgeResolverMgr } = require("../src/lib/edgeResolverMgr");

const { StorageMgr } = require("../src/lib/storageMgr");
jest.mock("../src/lib/storageMgr");

const {
  blockchainManager,
  createHeaders,
} = require('./utils/constants');

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

    const { header } = await createHeaders();
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
