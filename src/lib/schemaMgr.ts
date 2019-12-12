const makeExecutableSchema = require("graphql-tools").makeExecutableSchema;
import { readFileSync } from "fs";
import { QueryResolverMgr } from "./queryResolverMgr";
import { EdgeResolverMgr } from "./edgeResolverMgr";
import { SwarmMgr } from "./swarmMgr";
import { HashResolverMgr } from "./hashResolverMgr";

export class SchemaMgr {
	queryResolverMgr: QueryResolverMgr;
	edgeResolverMgr: EdgeResolverMgr;
	hashResolverMgr: HashResolverMgr;

	constructor(
		queryResolverMgr: QueryResolverMgr,
		edgeResolverMgr: EdgeResolverMgr,
		hashResolverMgr: HashResolverMgr
	) {
		this.queryResolverMgr = queryResolverMgr;
		this.edgeResolverMgr = edgeResolverMgr;
		this.hashResolverMgr = hashResolverMgr;
	}

	_getTypeDefs() {
		return readFileSync(__dirname + "/schema.graphqls", "utf8");
	}

	_getResolvers() {
		return {
			Query: {
				//Return identity for the API token issuer
				me: async (parent: any, args: any, context: any, info: any) => {
					const res = await this.queryResolverMgr.me(context.headers);
					return res;
				},
				// Return swarm recovery hash
				hash: async (parent: any, args: any, context: any, info: any) => {
					const res = await this.hashResolverMgr.getHash(context.headers, args.did);
					return res ? res.hash : null;
				},
				// Return an edge by hash
				edgeByHash: async (parent: any, args: any, context: any, info: any) => {
					const res = await this.queryResolverMgr.edgeByHash(
						context.headers,
						args.hash,
						args.did
					);
					return res;
				},
				//Find edges by jwt
				edgeByJwt: async (parent: any, args: any, context: any, info: any) => {
					const res = await this.queryResolverMgr.edgeByJwt(
						context.headers,
						args.edgeJWT,
						args.did
					);
					return res;
				},
				//Find edges
				findEdges: async (parent: any, args: any, context: any, info: any) => {
					const res = await this.queryResolverMgr.findEdges(context.headers, args);
					return res;
				}
			},
			Mutation: {
				addEdge: async (parent: any, args: any, context: any, info: any) => {
					const res = await this.edgeResolverMgr.addEdge(args.edgeJWT, args.did);
					const hash = await SwarmMgr.uploadFile(args.did);
					if (hash) await this.hashResolverMgr.addHash(hash, args.did);
					return res;
				},
				removeEdge: async (parent: any, args: any, context: any, info: any) => {
					const res = await this.edgeResolverMgr.removeEdge(args.hash, args.did);
					const hash = await SwarmMgr.uploadFile(args.did);
					if (hash) await this.hashResolverMgr.addHash(hash, args.did);
					return res;
				}
			},
			VisibilityEnum: {
				TO: "TO",
				BOTH: "BOTH",
				ANY: "ANY"
			}
		};
	}

	getSchema() {
		const typeDefs = this._getTypeDefs();
		const resolvers = this._getResolvers();
		return makeExecutableSchema({
			typeDefs,
			resolvers
		});
	}
}
