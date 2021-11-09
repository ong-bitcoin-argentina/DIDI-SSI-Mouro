const { AuthMgr } = require("../src/lib/authMgr");
const { EdgeResolverMgr } = require("../src/lib/edgeResolverMgr");

const { StorageMgr } = require("../src/lib/storageMgr");
const { expect } = require("@jest/globals");
jest.mock("../src/lib/storageMgr");

const {   
  blockchainManager,
  serverDid,
  createAndVerifyJwt,
  createHeaders,
} = require('./utils/constants');

describe("authMgr class should", () => {
  const prefixToAdd = "lacchain"; // for multiblockchain

  it("expect addEdge to success", async () => {
    const { createdJwt, identityDid } = await createAndVerifyJwt(prefixToAdd);
    const storage = new StorageMgr();

    const { header } = await createHeaders();

    const authMgr = new AuthMgr(blockchainManager);
    const edgeResolver = new EdgeResolverMgr(
      blockchainManager,
      authMgr,
      storage
    );

    const edgeReturn = await edgeResolver.addEdge(
      header,
      createdJwt,
      identityDid
    );

    expect(edgeReturn.jwt).toBeDefined();
    expect(edgeReturn.jwt).toEqual(createdJwt);
    expect(edgeReturn.to).toEqual({ did: identityDid });
    expect(edgeReturn.from).toEqual({ did: serverDid });
    expect(edgeReturn.type).toBeDefined();
  });

  it("expect addEdge to fail due to Unautorized token", async () => {
    const { createdJwt, identityDid } = await createAndVerifyJwt(prefixToAdd);
    const storage = new StorageMgr();

    const authMgr = new AuthMgr(blockchainManager);
    const edgeResolver = new EdgeResolverMgr(
      blockchainManager,
      authMgr,
      storage
    );

    try {
      const { invalidHeader } = await createHeaders();
      await edgeResolver.addEdge(
        invalidHeader,
        createdJwt,
        identityDid
      );
    } catch (error) {
      expect(error).toBe('Unauthorized');
    }
  });
});
