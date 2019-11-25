const didJWT = require('did-jwt');
const blake = require('blakejs')

import { StorageMgr, PersistedEdgeType } from "./storageMgr";

export class EdgeResolverMgr {

    storageMgr: StorageMgr;

    constructor(storageMgr: StorageMgr) {
        this.storageMgr = storageMgr
    }

    async addEdge(edgeJWT: string){
        console.log("edgeJWT:"+edgeJWT);
        
        //blake2b hash of the original message
        const hash = blake.blake2bHex(edgeJWT)
        console.log("hash:"+hash);

        //Verify that the body is a proper JWT
        //This can take up to 3 secc
        console.log("verifyJWT...")
        const verifiedJWT = await didJWT.verifyJWT(edgeJWT);
        console.log(verifiedJWT);

        const pl=verifiedJWT.payload;

        const edgeObject:PersistedEdgeType={
            hash: hash,
            jwt: edgeJWT,
            from: pl.iss,
            to:   pl.sub,
            type:  pl.type,
            time: pl.iat,
            visibility: this.visToVisibility(pl.vis),
            retention: pl.ret,
            tag:  pl.tag,
            data: pl.data
        }
        console.log("edge decoded")
        console.log(edgeObject);

        //Persist edge
        await this.storageMgr.addEdge(edgeObject);

        //Return
        let ret:any=edgeObject;
        ret.from={ did: ret.from }
        ret.to={did: ret.to}
        return ret;
    }

    visToVisibility(vis:string):string{
        //Default visibility is BOTH
        const DEFAULT='BOTH';
        if(vis == undefined) return DEFAULT;

        if(vis.toUpperCase()=='TO') return 'TO';
        if(vis.toUpperCase()=='BOTH') return 'BOTH';
        if(vis.toUpperCase()=='ANY') return 'ANY';

        return DEFAULT;

    }
}


