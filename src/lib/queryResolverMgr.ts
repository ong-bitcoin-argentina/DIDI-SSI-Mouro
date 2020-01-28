import { AuthMgr } from "./authMgr";
import { StorageMgr } from "./storageMgr";
import { headersType } from "./commonTypes";

export class QueryResolverMgr {
	authMgr: AuthMgr;
	storageMgr: StorageMgr;

	constructor(authMgr: AuthMgr, storageMgr: StorageMgr) {
		this.authMgr = authMgr;
		this.storageMgr = storageMgr;
	}

	async me(headers: headersType) {
		const authToken = await this.authMgr.verifyAuthorizationHeader(headers);
		if (authToken == null) return {};

		return {
			did: authToken.issuer
		};
	}

	async edgeByJwt(headers: headersType, jwt: string, did: string) {
		const authData = await this.authMgr.getAuthData(headers);

		let edge = await this.storageMgr.edgeByJwt(jwt, authData, did);
		if (!edge) return null;

		if (
			!authData ||
			(authData.user !== "did:ethr:" + process.env.DIDI_SERVER_DID &&
				authData.user != edge.to)
		)
			throw "Unauthorized";

		//Transformations
		edge.from = { did: edge.from };
		edge.to = { did: edge.to };
		edge.claim = JSON.stringify(edge.claim);
		return edge;
	}

	/*
	async edgeByHash(headers: headersType, hash: string, did: string) {
		const authData = await this.authMgr.getAuthData(headers);

		let edge = await this.storageMgr.getEdge(hash, authData, did);
		if (!edge) return null;

		//Transformations
		edge.from = { did: edge.from };
		edge.to = { did: edge.to };
		edge.claim = JSON.stringify(edge.claim);
		return edge;
	}
	*/

	async findEdges(headers: headersType, args: any) {
		const authData = await this.authMgr.getAuthData(headers);
		let edges = await this.storageMgr.findEdges(args, authData);

		for (let i = 0; i < edges.length; i++) {
			let edge = edges[i];

			if (
				!authData ||
				(authData.user !== "did:ethr:" + process.env.DIDI_SERVER_DID &&
					authData.user != edge.to)
			)
				throw "Unauthorized";

			//Transformations
			edge.from = { did: edge.from };
			edge.to = { did: edge.to };
			edge.claim = JSON.stringify(edge.claim);
			edges[i] = edge;
		}

		//console.log(allowedEdges)
		return edges;
	}
}
