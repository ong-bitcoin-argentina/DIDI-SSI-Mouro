import { AuthDataType } from "./authMgr";

export interface StorageInterface {
	init(): Promise<void>;
	addEdge(edge: PersistedEdgeType, did: string): Promise<any>;
	removeEdge(hash: string, did: string): Promise<any>;
	edgeByJwt(jwt: string, authData: AuthDataType | null, did: string): Promise<any>;
	getEdge(hash: string, authData: AuthDataType | null, did: string): Promise<any>;
	findEdges(params: any, authData: AuthDataType | null): Promise<any>;
}

export type PersistedEdgeType = {
	hash: string;
	from: string;
	to: string;
	type: string;
	time: number;
	visibility: string;
	retention?: number;
	tag?: string;
	data?: any;
	jwt: string;
};

export class StorageMgr {
	storage!: StorageInterface;

	constructor() {
		this.storage = new (require("./sqliteMgr"))();

		// if (process.env.SQLITE_FILE) this.storage = new (require("./sqliteMgr"))();
		// if (process.env.PG_URL) this.storage = new (require("./pgMgr"))();
		// if(process.env.DYNAMODB_TABLE) this.storage = new (require("./dynamoMgr"))();

		//Init Storage
		if (this.storage != null) {
			(async () => {
				await this.storage.init();
			})();
		} else {
			throw Error("no underlying storage");
		}
	}

	async removeEdge(hash: string, did: string) {
		return this.storage.removeEdge(hash, did);
	}

	async addEdge(edge: PersistedEdgeType, did: string) {
		return this.storage.addEdge(edge, did);
	}

	async edgeByJwt(jwt: string, authData: AuthDataType | null, did: string) {
		return this.storage.edgeByJwt(jwt, authData, did);
	}

	async getEdge(hash: string, authData: AuthDataType | null, did: string) {
		return this.storage.getEdge(hash, authData, did);
	}

	async findEdges(params: any, authData: AuthDataType | null) {
		return this.storage.findEdges(params, authData);
	}
}
