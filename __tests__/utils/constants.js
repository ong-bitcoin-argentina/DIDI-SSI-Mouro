const constants = require("../../src/constants/constants");
const { BlockchainManager } = require("@proyecto-didi/didi-blockchain-manager");

const config = {
  gasPrice: 10000,
  providerConfig: constants.BLOCKCHAIN.PROVIDER_CONFIG, // for multiblockchain
};

const blockchainManager = new BlockchainManager(
  config,
  constants.BLOCKCHAIN.GAS_INCREMENT
);

const subjectPayload = { 
  Phone: {
    "preview": {
      "type": 0,
      "fields": [
        "phoneNumber"
      ]
    },
    category: "identity",
    data: {
      "phoneNumber": "+542491234561"
    }
  }
 };

const serverDid = `did:ethr:${process.env.DIDI_SERVER_DID}`;
const privateKey = process.env.DIDI_SERVER_PRIVATE_KEY;

const createAndVerifyJwt = async (prefixToAdd) => {
  const identity = blockchainManager.createIdentity(prefixToAdd);

  const createdJwt = await blockchainManager.createCredential(
    identity.did,
    {
      ...subjectPayload,
    },
    undefined,
    serverDid,
    privateKey,
  );

  const verifiedJwt = await blockchainManager.verifyJWT(createdJwt);

  const returnObject = {
    createdJwt,
    verifiedJwt,
    identityDid: identity.did,
  };
  return returnObject;
};


const createHeaders = async () => {
  const token = await blockchainManager.createJWT(serverDid, privateKey, { name: "token" });
  const header = {
    authorization:
      `Bearer ${token}`,
    Authorization:
      `Bearer ${token}`,
  };

  const identity = blockchainManager.createIdentity();
  const invalidToken = await blockchainManager.createJWT(identity.did, identity.privateKey, { name: "token" });
  const invalidHeader = {
    authorization:
      `Bearer ${invalidToken}`,
    Authorization:
      `Bearer ${invalidToken}`,
  };
  return { header, invalidHeader };
};

module.exports = {
  blockchainManager,
  serverDid,
  createAndVerifyJwt,
  createHeaders,
};
