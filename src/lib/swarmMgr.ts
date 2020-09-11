const swc = require("@erebos/swarm-node");

const URL = process.env.SWARM_URL;
const PORT = process.env.SWARM_PORT;

const client = process.env.SWARM_URL
	? new swc.SwarmClient({ bzz: { url: `${URL}:${PORT}` } })
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
