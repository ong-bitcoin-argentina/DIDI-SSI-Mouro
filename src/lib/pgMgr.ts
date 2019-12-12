import { PersistedEdgeType, StorageInterface } from "./storageMgr";
import { AuthDataType, AuthzConditionType } from "./authMgr";
const { Client } = require("pg");
const sql = require("sql-bricks-postgres");

module.exports = class PgMgr implements StorageInterface {
	constructor() {
		console.log("Pg Driver Started.");
	}

	async _getClient(path: string) {
		if (process.env.PG_URL === "DID") {
			if (path) {
				const client = new Client({
					connectionString: path
				});
				await this.initDb(client);
				return client;
			}
		} else {
			return new Client({
				connectionString: process.env.PG_URL
			});
		}
	}

	async initDb(client: any) {
		const sql = `
    CREATE TABLE IF NOT EXISTS edges
    (
      hash CHAR(128) NOT NULL, 
      "from" VARCHAR(64) NOT NULL, 
      "to" VARCHAR(64) NOT NULL, 
      type VARCHAR(128) NULL, 
      "time" INTEGER NOT NULL, -- from iat
      visibility VARCHAR(4) NOT NULL,
      retention INTEGER NULL,
      tag VARCHAR(128) NULL, 
      data TEXT NULL, 
      jwt TEXT NOT NULL,
      CONSTRAINT edges_pkey PRIMARY KEY (hash),
      CHECK (visibility IN ('TO', 'BOTH', 'ANY'))
    )
    `;
		try {
			await client.connect();
			const res = await client.query(sql);
			return res;
		} catch (e) {
			throw e;
		} finally {
			await client.end();
		}
	}

	async init() {}

	async addEdge(edge: PersistedEdgeType, did: string) {
		//Store edge
		const sql = `
    INSERT INTO edges
    (
      hash, 
      "from", 
      "to", 
      type, 
      "time",
      visibility,
      retention,
      tag, 
      data,
      jwt
    )
    VALUES
    ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    ON CONFLICT ON CONSTRAINT edges_pkey 
    DO NOTHING;
    `;
		const client = await this._getClient(did);
		try {
			await client.connect();
			const res = await client.query(sql, [
				edge.hash,
				edge.from,
				edge.to,
				edge.type,
				edge.time,
				edge.visibility,
				edge.retention,
				edge.tag,
				edge.data,
				edge.jwt
			]);
			return res;
		} catch (e) {
			throw e;
		} finally {
			await client.end();
		}
	}

	async edgeByJwt(jwt: string, authData: AuthDataType | null, did: string) {
		let whereClause = sql.eq("jwt", jwt);
		this.doGetEdge(whereClause, did);
	}

	async getEdge(hash: string, authData: AuthDataType | null, did: string) {
		let whereClause = sql.eq("hash", hash);
		this.doGetEdge(whereClause, did);
	}

	async doGetEdge(whereClause: any, did: string) {
		const q = sql
			.select()
			.from("edges")
			.where(whereClause)
			.toString();
		console.log(q);

		const client = await this._getClient(did);
		try {
			await client.connect();
			const res = await client.query(q);
			return res.rows[0];
		} catch (e) {
			throw e;
		} finally {
			await client.end();
		}
	}

	async findEdges(args: any, authData: AuthDataType | null) {
		//find edges
		let where = {};

		if (args.toDID) where = sql.and(where, sql.in("to", [args.toDID]));
		if (args.type) where = sql.and(where, sql.in("type", args.type));
		if (args.since) where = sql.and(where, sql.gt("time", args.since));
		if (args.tag) where = sql.and(where, sql.in("tag", args.tag));

		//Add perms to whereClause
		where = sql.and(where, this._getPermsReadWhere(authData));

		const q = sql
			.select()
			.from("edges")
			.where(where)
			.orderBy("time")
			.toString();
		console.log(q);

		const client = await this._getClient(args.toDID);
		try {
			await client.connect();
			const res = await client.query(q);
			return res.rows;
		} catch (e) {
			throw e;
		} finally {
			await client.end();
		}
	}

	async removeEdge(hash: string, did: string) {
		//Remove edge
		const sql = `DELETE FROM edges WHERE hash= $1`;

		const client = await this._getClient(did);
		try {
			await client.connect();
			const res = await client.query(sql, [hash]);
			return res;
		} catch (e) {
			throw e;
		} finally {
			await client.end();
		}
	}

	_getPermsReadWhere(authData: AuthDataType | null) {
		//Visibility access

		//add ANY
		let any = sql.eq("visibility", "ANY");
		let vis = any;

		if (authData !== null) {
			//Owner access
			let own = sql.and(sql.eq("visibility", "TO"), sql.eq("to", authData.user));

			//Both access
			let both = sql.and(
				sql.eq("visibility", "BOTH"),
				sql.or(sql.eq("from", authData.user), sql.eq("to", authData.user))
			);

			vis = sql.or(own, both, any);
		}

		let perms = {};
		//Perms (authz)
		if (authData !== null && authData.authzRead) {
			for (let i = 0; i < authData.authzRead.length; i++) {
				const authzCond: AuthzConditionType = authData.authzRead[i];

				//"From" condition
				if (authzCond.from) {
					const authzPerm = sql.and(
						sql.eq("to", authzCond.iss),
						sql.eq("from", authzCond.from)
					);
					perms = sql.or(perms, authzPerm);
				}
			}
		}
		return sql.or(vis, perms);
	}
};
