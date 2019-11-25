import {StorageMgr, PersistedEdgeType} from '../storageMgr';

process.env.PG_URL='fakePG_URL'

jest.mock('../pgMgr')
jest.mock('../sqliteMgr')


describe('StorageMgr', () => {
    
    
    let sut: StorageMgr;
    let edge: PersistedEdgeType;

    beforeAll((done) =>{
        sut = new StorageMgr();
        sut.storage.addEdge=jest.fn().mockImplementationOnce(()=>{return 'OK'})
        sut.storage.getEdge=jest.fn().mockImplementationOnce(()=>{return 'OK'})
        sut.storage.findEdges=jest.fn().mockImplementationOnce(()=>{return 'OK'})
        done();
    })

    test('empty constructor', () => {
        expect(sut).not.toBeUndefined();
    });

    test('no underlying storage', () => {
        delete process.env.PG_URL;
        try{
            new StorageMgr();
            fail("error not thrown")
        }catch(err){
            expect(err.message).toEqual('no underlying storage')
        }
    });


    test('SQLite storage', () => {
        process.env.SQLITE_FILE='./something';
        try{
            const sM=new StorageMgr();
            expect(sM).not.toBeUndefined();
        }catch(err){
            fail(err)
        }
    });


    describe("addEdge()", () => {
        test('happy path', (done)=> {
            edge={
                hash: 'someHash',
                from: 'did:from',
                to: 'did:to',
                type: 'someType',
                visibility: 'BOTH',
                time: new Date().getTime() * 1000,
                jwt: 'ey...'
            }
            sut.addEdge(edge)
            .then((resp)=> {
                expect(resp).toEqual('OK')
                done()
            })
        })
    })

    describe("getEdge()", () => {
        test('happy path', (done)=> {
            sut.getEdge('hash', {user: 'did:to'})
            .then((resp)=> {
                expect(resp).toEqual('OK')
                done()
            })
        })
    })

    describe("findEdges()", () => {
        test('happy path', (done)=> {
            sut.findEdges({}, {user: 'did:to'})
            .then((resp)=> {
                expect(resp).toEqual('OK')
                done()
            })
        })
    })

});
