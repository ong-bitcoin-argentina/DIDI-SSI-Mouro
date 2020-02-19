const didJWT = require("did-jwt");
const blake = require("blakejs");

import { AuthMgr } from "./authMgr";
import { headersType } from "./commonTypes";
import { StorageMgr, PersistedEdgeType } from "./storageMgr";

export class EdgeResolverMgr {
	authMgr: AuthMgr;
	storageMgr: StorageMgr;

	constructor(authMgr: AuthMgr, storageMgr: StorageMgr) {
		this.authMgr = authMgr;
		this.storageMgr = storageMgr;
	}

	async removeEdge(headers: headersType, hash: string, did: string) {
		console.log("hash:" + hash);
		try {
			const authData = await this.authMgr.verifyAuthorizationHeader(headers);
			if (!authData || authData.issuer !== "did:ethr:" + process.env.DIDI_SERVER_DID)
				throw "Unauthorized";
		} catch (err) {
			console.log(err);
			throw err;
		}

		//Persist edge
		await this.storageMgr.removeEdge(hash, did);
		console.log("edge removed");

		//Return
		return hash;
	}

	async addEdge(headers: headersType, edgeJWT: string, did: string) {
		console.log("edgeJWT:" + edgeJWT);
		try {
			const authData = await this.authMgr.verifyAuthorizationHeader(headers);
			if (!authData || authData.issuer !== "did:ethr:" + process.env.DIDI_SERVER_DID)
				throw "Unauthorized";
		} catch (err) {
			console.log(err);
			throw err;
		}

		//blake2b hash of the original message
		const hash = blake.blake2bHex(edgeJWT);
		console.log("hash:" + hash);

		//Verify that the body is a proper JWT
		//This can take up to 3 secc
		console.log("verifyJWT...");
		const verifiedJWT = await didJWT.verifyJWT(edgeJWT);
		console.log(verifiedJWT);

		const pl = verifiedJWT.payload;

		const edgeObject: PersistedEdgeType = {
			hash: hash,
			jwt: edgeJWT,
			from: pl.iss,
			to: pl.sub,
			type: pl.type,
			time: pl.iat,
			visibility: this.visToVisibility(pl.vis),
			retention: pl.ret,
			tag: pl.tag,
			data: pl.data
		};
		console.log("edge decoded");
		console.log(edgeObject);

		//Persist edge
		await this.storageMgr.addEdge(edgeObject, did);

		//Return
		let ret: any = edgeObject;
		ret.from = { did: ret.from };
		ret.to = { did: ret.to };
		return ret;
	}

	visToVisibility(vis: string): string {
		//Default visibility is BOTH
		const DEFAULT = "BOTH";
		if (vis == undefined) return DEFAULT;

		if (vis.toUpperCase() == "TO") return "TO";
		if (vis.toUpperCase() == "BOTH") return "BOTH";
		if (vis.toUpperCase() == "ANY") return "ANY";

		return DEFAULT;
	}
}
