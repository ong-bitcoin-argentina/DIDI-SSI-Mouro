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
		
		//get hash
		const hash = await this.storageMgr.getHash(did, authData);
		//Return
		return hash;
	}

	async addHash(hash: string, did: string) {
		console.log("hash:" + hash);

		//Persist hash
		await this.storageMgr.addHash(hash, did);
		console.log("hash added");

		//Return
		return hash;
	}
}
