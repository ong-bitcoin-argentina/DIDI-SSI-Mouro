const swc = require("@erebos/swarm-node");
const client = new swc.SwarmClient({ bzz: { url: process.env.SWARM_URL } });

export class SwarmMgr {
	static async uploadFile(path: string) {
		try {
			console.log("path:" + path);
			const hash = await client.bzz.uploadFileFrom(path);
			console.log("file uploaded");
			console.log("hash: " + hash);
			return Promise.resolve(hash);
		} catch (err) {
			console.log(err);
			return Promise.reject(err);
		}
	}
}
