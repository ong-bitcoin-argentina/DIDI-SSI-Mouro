import { GraphQLHandler } from "../graphql";
import { SchemaMgr } from "../../lib/schemaMgr";
import { QueryResolverMgr } from "../../lib/queryResolverMgr";
import { AuthMgr } from "../../lib/authMgr";
import { StorageMgr } from "../../lib/storageMgr";
import { EdgeResolverMgr } from "../../lib/edgeResolverMgr";

jest.mock("../../lib/schemaMgr");
jest.mock("../../lib/queryResolverMgr");
jest.mock("../../lib/authMgr");
jest.mock("../../lib/storageMgr");
jest.mock("../../lib/edgeResolverMgr");

describe('GraphQLHandler', () => {
    
    
    let sut:GraphQLHandler;
    let mockAuthMgr:AuthMgr = new AuthMgr();
    let mockStorageMgr:StorageMgr = new StorageMgr();
    let mockQueryResolverMgr:QueryResolverMgr = new QueryResolverMgr(mockAuthMgr,mockStorageMgr);
    let mockEdgeResolverMgr:EdgeResolverMgr = new EdgeResolverMgr(mockStorageMgr);
    let mockSchemaMgr:SchemaMgr = new SchemaMgr(mockQueryResolverMgr,mockEdgeResolverMgr);

    beforeAll((done) =>{
        sut = new GraphQLHandler(mockSchemaMgr)
        done();
    })

    test('empty constructor', () => {
        expect(sut).not.toBeUndefined();
    });

    test('formatError',()=>{
        expect(sut.formatError('test err')).toEqual('test err')
    })
})