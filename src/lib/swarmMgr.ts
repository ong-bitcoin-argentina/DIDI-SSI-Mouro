const swc = require("@erebos/swarm-node");
const client = new swc.SwarmClient({ bzz: { url: process.env.SWARM_URL } });

export class SwarmMgr {
	static async uploadFile(path: string) {
		try {
			const hash = await client.bzz.uploadFileFrom(path);
			return Promise.resolve(hash);
		} catch (err) {
			console.log(err);
			return Promise.reject(err);
		}
	}
}
