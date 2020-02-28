const DidRegistryContract = require("ethr-did-registry");
var Tx = require("ethereumjs-tx");

var Web3 = require("web3");
const provider = new Web3.providers.HttpProvider(process.env.BLOCK_CHAIN_URL);
const web3 = new Web3(provider);

// obtiene el contrato (ethr-did-registry)
const getContract = function(credentials: any) {
	return new web3.eth.Contract(
		DidRegistryContract.abi,
		process.env.BLOCK_CHAIN_CONTRACT,
		{
			from: credentials.from,
			gasLimit: 3000000
		}
	);
};

// realiza una transaccion generica a un contrato ethereum
const makeSignedTransaction = async function(bytecode: any, credentials: any) {
	const getNonce = async function(web3: any, senderAddress: any) {
		var result = await web3.eth.getTransactionCount(senderAddress, "pending");
		return result;
	};

	const getGasPrice = async function(web3: any) {
		var block = await web3.eth.getBlock("latest");
		if (block.minimumGasPrice <= 21000) {
			return 21000;
		} else {
			return parseInt(block.minimumGasPrice);
		}
	};

	const rawTx = {
		nonce: await getNonce(web3, credentials.from),
		gasPrice: await getGasPrice(web3),
		gas: await web3.eth.estimateGas({
			to: process.env.BLOCK_CHAIN_CONTRACT,
			from: credentials.from,
			data: bytecode
		}),
		data: bytecode,
		to: process.env.BLOCK_CHAIN_CONTRACT
	};

	var tx = new Tx(rawTx);
	tx.sign(Buffer.from(credentials.key, "hex"));
	var serializedTx = tx.serialize();
	const res = await web3.eth.sendSignedTransaction(
		"0x" + serializedTx.toString("hex")
	);
	return res;
};

export class BlockChainMgr {
	static async revokeCert(did: string, jwt: string) {
		const contract = getContract({
			from: process.env.MOURO_DID,
			key: process.env.MOURO_PRIVATE_KEY
		});
		const bytecode = await contract.methods
			.setAttribute(
				process.env.MOURO_DID,
				web3.utils.fromAscii("deleted"),
				web3.utils.fromAscii(jwt),
				999999999
			)
			.encodeABI();
		const result = await makeSignedTransaction(bytecode, {
			from: process.env.MOURO_DID,
			key: process.env.MOURO_PRIVATE_KEY
		});
		return result;
	}

	static async isRevokedCert(jwt: string) {
		try {
			const contract = getContract({
				from: process.env.MOURO_DID,
				key: process.env.MOURO_PRIVATE_KEY
			});
			const events = await contract.getPastEvents("DIDAttributeChanged", {
				fromBlock: 0,
				toBlock: "latest"
			});

			const jwtData = web3.utils.fromAscii(jwt);
			const deleted = web3.utils.fromAscii("deleted");
			for (let event of events) {
				if (
					event.returnValues.identity.toLowerCase() === (process.env.MOURO_DID + "").toLowerCase() &&
					event.returnValues.validTo !== 0 &&
					event.returnValues.name.substring(0, deleted.length) === deleted &&
					event.returnValues.value.substring(0, jwtData.length) === jwtData
				) {
					return Promise.resolve(true);
				}
			}
			return Promise.resolve(false);
		} catch (err) {
			console.log(err);
			return Promise.resolve(false);
		}
	}
}
