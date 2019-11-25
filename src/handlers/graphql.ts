const { ApolloServer } = require('apollo-server-lambda');

import { eventContextType } from '../lib/commonTypes';
import { SchemaMgr } from '../lib/schemaMgr';

export class GraphQLHandler {

    schemaMgr: SchemaMgr;

    constructor (schemaMgr: SchemaMgr) {
        this.schemaMgr=schemaMgr
    }

    formatError(error: any){
        console.error(error);
        return error;
    }

    getHandler(){
        const schema = this.schemaMgr.getSchema()
        const server = new ApolloServer({
            schema,
            context: (p: eventContextType) => {
                const event=p.event;
                const context=p.context;
                return ({
                    headers: event.headers,
                    functionName: context.functionName,
                    event,
                    context,
                });
            },
            introspection: true,
            formatError: this.formatError,            
        });

        return server.createHandler({
            cors: {
                origin: '*',
                credentials: true,
            },
        });
    }

}