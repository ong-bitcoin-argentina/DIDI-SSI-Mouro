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
				/**
				 * Retorna la identidad del usuario dueño del token
				 */
				me: async (parent: any, args: any, context: any, info: any) => {
					const res = await this.queryResolverMgr.me(context.headers);
					return res;
				},
				/**
				 *  Retorna el hash de recuperacion para obtener el backup de la base de datos en swarm
				 *  solo funciona si el did se corresponde con el del dueño del token o el didi-server
				 */
				hash: async (parent: any, args: any, context: any, info: any) => {
					const res = await this.hashResolverMgr.getHash(context.headers, args.did);
					return res ? res.hash : null;
				},

				// Retorna el jwt a partir del hash
				/* 	
				edgeByHash: async (parent: any, args: any, context: any, info: any) => {
					const res = await this.queryResolverMgr.edgeByHash(
						context.headers,
						args.hash,
						args.did
					);
					return res;
				},
				*/

				/**
				 * Permite validar si el certificado se encuentra en mouro
				 *  solo funciona si el did se corresponde con el del dueño del token o el didi-server
				 */
				edgeByJwt: async (parent: any, args: any, context: any, info: any) => {
					const res = await this.queryResolverMgr.edgeByJwt(
						context.headers,
						args.edgeJWT,
						args.did
					);
					return res;
				},

				/**
				 * 	Retorna los jwts de los certificados que posee el dueño del token
				 */
				findEdges: async (parent: any, args: any, context: any, info: any) => {
					// console.log(context.headers);
					const res = await this.queryResolverMgr.findEdges(context.headers, args);
					return res;
				}
			},
			Mutation: {
				/**
				 * 	Almacena un nuevo jwt en mouro
				 *  solo funciona si el did se corresponde con el del dueño del token o el didi-server
				 */
				addEdge: async (parent: any, args: any, context: any, info: any) => {
					const res = await this.edgeResolverMgr.addEdge(
						context.headers,
						args.edgeJWT,
						args.did
					);
					const hash = await SwarmMgr.uploadFile("./db/" + args.did);

					if (hash) {
						await this.hashResolverMgr.addHash(context.headers, hash, args.did);
					}
					return res;
				},

				/**
				 * 	Revoca un jwt previamente emitido
				 *  solo funciona si el did se corresponde con el del dueño del token o el didi-server
				 */
				removeEdge: async (parent: any, args: any, context: any, info: any) => {
					return "NO IMPLEMENTADO";
					/*
					const res = await this.edgeResolverMgr.removeEdge(
						context.headers,
						args.hash,
						args.did
					);
					const hash = await SwarmMgr.uploadFile("./db/" + args.did);
					if (hash) {
						await this.hashResolverMgr.addHash(context.headers, hash, args.did);
					}
					return res;
					*/
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
