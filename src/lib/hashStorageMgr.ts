import { AuthDataType } from "./authMgr";

export interface HashStorageInterface {
	init(): Promise<void>;
	addHash(hash: string, did: string): Promise<any>;
	getHash(did: string, authData: AuthDataType | null): Promise<any>;
}

export class HashStorageMgr {
	storage!: HashStorageInterface;

	constructor(storage: HashStorageInterface) {
		this.storage = storage;

		//Init Storage
		if (this.storage != null) {
			(async () => {
				await this.storage.init();
			})();
		} else {
			throw Error("no underlying storage");
		}
	}

	async addHash(hash: string, did: string) {
		return this.storage.addHash(hash, did);
	}

	async getHash(did: string, authData: AuthDataType | null) {
		return this.storage.getHash(did, authData);
	}
}
