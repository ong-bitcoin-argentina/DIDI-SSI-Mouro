import { HashStorageMgr } from "./hashStorageMgr";
import { headersType } from "./commonTypes";
import { AuthMgr } from "./authMgr";

export class HashResolverMgr {
	storageMgr: HashStorageMgr;
	authMgr: AuthMgr;

	constructor(authMgr: AuthMgr, storageMgr: HashStorageMgr) {
		this.storageMgr = storageMgr;
		this.authMgr = authMgr;
	}

	async getHash(headers: headersType, did: string) {
		const authData = await this.authMgr.getAuthData(headers);

		if (
			!authData ||
			(authData.user !== "did:ethr:" + process.env.DIDI_SERVER_DID &&
				authData.user != did)
		)
			throw "Unauthorized";

		//get hash
		const hash = await this.storageMgr.getHash(did, authData);
		//Return
		return hash;
	}

	async addHash(headers: headersType, hash: string, did: string) {
		console.log("hash:" + hash);

		const authData = await this.authMgr.getAuthData(headers);
		if (
			!authData ||
			(authData.user !== "did:ethr:" + process.env.DIDI_SERVER_DID &&
				authData.user != did)
		)
			throw "Unauthorized";

		//Persist hash
		await this.storageMgr.addHash(hash, did);
		console.log("hash added");

		//Return
		return hash;
	}
}
