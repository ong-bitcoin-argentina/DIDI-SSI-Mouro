const swc = require("@erebos/swarm-node");

const client = process.env.SWARM_URL
	? new swc.SwarmClient({ bzz: { url: process.env.SWARM_URL } })
	: undefined;

export class SwarmMgr {
	static async uploadFile(path: string) {
		try {
			if (!client) return Promise.resolve(null);
			const hash = await client.bzz.uploadFileFrom(path);
			return Promise.resolve(hash);
		} catch (err) {
			console.log(err);
			return Promise.reject(err);
		}
	}
}
