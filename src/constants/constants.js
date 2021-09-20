require("dotenv").config();

const GAS_INCREMENT = process.env.GAS_INCREMENT || "1.1";

// ======================================================================================================

// Blockchain
const { BLOCKCHAIN_URL_RSK, BLOCKCHAIN_URL_LAC, BLOCKCHAIN_URL_BFA } = process.env;
const { INFURA_KEY } = process.env;
// uPort SC ON

const BLOCKCHAIN_CONTRACT_MAIN = '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b';
const BLOCKCHAIN_CONTRACT_LAC = '0x488C83c4D1dDCF8f3696273eCcf0Ff4Cf54Bf277';
const BLOCKCHAIN_CONTRACT_BFA = '0x0b2b8e138c38f4ca844dc79d4c004256712de547';

const PROVIDER_CONFIG = {
  networks: [
    {
      name: 'mainnet',
      rpcUrl: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
      registry: BLOCKCHAIN_CONTRACT_MAIN,
    },
    {
      name: 'ropsten',
      rpcUrl: `https://ropsten.infura.io/v3/${INFURA_KEY}`,
      registry: BLOCKCHAIN_CONTRACT_MAIN,
    },
    {
      name: 'rinkeby',
      rpcUrl: `https://rinkeby.infura.io/v3/${INFURA_KEY}`,
      registry: BLOCKCHAIN_CONTRACT_MAIN,
    },
    {
      name: 'goerli',
      rpcUrl: `https://goerli.infura.io/v3/${INFURA_KEY}`,
      registry: BLOCKCHAIN_CONTRACT_MAIN,
    },
    {
      name: 'kovan',
      rpcUrl: `https://kovan.infura.io/v3/${INFURA_KEY}`,
      registry: BLOCKCHAIN_CONTRACT_MAIN,
    },
    {
      name: 'lacchain',
      rpcUrl: BLOCKCHAIN_URL_LAC,
      registry: BLOCKCHAIN_CONTRACT_LAC,
    },
    {
      name: 'bfa',
      rpcUrl: BLOCKCHAIN_URL_BFA,
      registry: BLOCKCHAIN_CONTRACT_BFA,
    },
    {
      name: 'rsk',
      rpcUrl: BLOCKCHAIN_URL_RSK,
      registry: BLOCKCHAIN_CONTRACT_MAIN,
    },
  ],
};

module.exports = {
  BLOCKCHAIN: {
    PROVIDER_CONFIG: PROVIDER_CONFIG,
    GAS_INCREMENT: GAS_INCREMENT
  }
};
