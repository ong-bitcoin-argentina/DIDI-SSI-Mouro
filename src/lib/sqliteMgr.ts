import { PersistedEdgeType, StorageInterface } from "./storageMgr";
import { AuthDataType, AuthzConditionType } from "./authMgr";
import { HashStorageInterface } from "./hashStorageMgr";
const sqlite = require("sqlite");
const sql = require("sql-bricks-sqlite");

module.exports = class SQLiteMgr
	implements StorageInterface, HashStorageInterface {
	db: any;

	constructor() {
		console.log("SQLite Driver Started.");
	}

	async _getDatabase(path: string | undefined) {
		if (!process.env.SQLITE_FILE) {
			if (path) {
				this.db = await sqlite.open("./db/" + path);
				await this.initDb(this.db);
			}
		} else {
			if (!this.db) {
				this.db = await sqlite.open(process.env.SQLITE_FILE);
				await this.initDb(this.db);
			}
		}

		return this.db;
	}

	async initDb(db: any) {
		const createEdges = async function(db: any) {
			const sql = `
			CREATE TABLE IF NOT EXISTS edges
			(
			  hash CHAR(128) PRIMARY KEY, 
			  "from" VARCHAR(64) NOT NULL, 
			  "to" VARCHAR(64) NOT NULL, 
			  type VARCHAR(128) NULL, 
			  "time" INTEGER NOT NULL, -- from iat
			  visibility VARCHAR(4) NOT NULL,
			  retention INTEGER NULL,
			  tag VARCHAR(128) NULL, 
			  data TEXT NULL, 
			  jwt TEXT NOT NULL
			)
			`;
			try {
				const res = await db.run(sql);
				return res;
			} catch (e) {
				throw e;
			}
		};
		const createHash = async function(db: any) {
			const sql = `
			CREATE TABLE IF NOT EXISTS hashes
			(
			  hash CHAR(128) PRIMARY KEY, 
			  Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
			)
			`;
			try {
				const res = await db.run(sql);
				return res;
			} catch (e) {
				throw e;
			}
		};

		await createEdges(db);
		await createHash(db);
	}

	async init() {
		await this._getDatabase(undefined);
	}

	async removeEdge(hash: string, did: string) {
		//Remove edge
		const sql = `DELETE FROM edges WHERE hash= $1`;
		const db = await this._getDatabase(did);
		try {
			const res = await db.run(sql, [hash]);
			return res;
		} catch (e) {
			console.log(e);
			throw e;
		}
	}

	async addHash(hash: String, did: string) {
		const sql = `
		INSERT INTO hashes
		(
		  hash
		)
		VALUES
		($1)
		ON CONFLICT(hashes.hash) DO NOTHING;
		`;

		const db = await this._getDatabase(did);
		try {
			const res = await db.run(sql, [hash]);
			return res;
		} catch (e) {
			throw e;
		}
	}

	async getHash(did: string, authData: AuthDataType | null) {
		const sql = `SELECT hash FROM hashes ORDER BY Timestamp DESC LIMIT 1;`;
		const db = await this._getDatabase(did);
		try {
			const res = await db.get(sql);
			return res;
		} catch (e) {
			throw e;
		}
	}

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
    ON CONFLICT(edges.hash) DO NOTHING;
    `;
		const db = await this._getDatabase(did);
		try {
			const res = await db.run(sql, [
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
		}
	}

	async edgeByJwt(jwt: string, authData: AuthDataType | null, did: string) {
		let whereClause = sql.eq("jwt", jwt);
		return await this.doGetEdge(whereClause, authData, did);
	}

	async getEdge(hash: string, authData: AuthDataType | null, did: string) {
		let whereClause = sql.eq("hash", hash);
		return await this.doGetEdge(whereClause, authData, did);
	}

	async doGetEdge(whereClause: any, authData: AuthDataType | null, did: string) {
		const q = sql
			.select()
			.from("edges")
			.where(whereClause)
			.toString();
		console.log(q);

		const db = await this._getDatabase(did);
		try {
			const res = await db.get(q);
			return res;
		} catch (e) {
			throw e;
		}
	}

	async findEdges(args: any, authData: AuthDataType | null) {
		//find edges
		let where = {};
		console.log({ args });

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

		const db = await this._getDatabase(args.toDID);
		try {
			let res = await db.all(q);
			return res;
		} catch (e) {
			throw e;
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
