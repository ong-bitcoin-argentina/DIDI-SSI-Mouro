const DidRegistryContract = require("ethr-did-registry");
var Tx = require("ethereumjs-tx");

var Web3 = require("web3");
const provider = new Web3.providers.HttpProvider(process.env.RSK_URL);
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

	/*
	static async isRevokedCert(jwts: [string]) {
		function hex_to_ascii(str1: string) {
			var hex = str1.toString();
			var str = "";
			for (var n = 0; n < hex.length; n += 2) {
				str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
			}
			return str;
		}

		const contract = getContract({
			from: process.env.MOURO_DID,
			key: process.env.MOURO_PRIVATE_KEY
		});

		let result = [];
		for (let _ of jwts) {
			result.push(false);
		}

		const events = await contract.events.DIDAttributeChanged(
			{},
			{ fromBlock: 0, toBlock: "latest" }
		);

		for (let event of events) {
			for (let i = 0; i < jwts.length; i++) {

				if (
					event.returnValues.identity === process.env.MOURO_DID &&
					hex_to_ascii(event.returnValues.name).substring(1, 8) === "deleted" &&
					hex_to_ascii(event.returnValues.value).slice(1) === jwts[i]
				) {
					result[i] = true;
				}
			}
		}
		return result;
	}
	*/
}
