import { StorageInterface } from "../storageMgr";

jest.mock("sqlite");
const sqlite = require("sqlite");
const mockSqliteDb={
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn()
}
sqlite.open=jest.fn().mockImplementation(()=>{return mockSqliteDb});



describe('SqliteMgr', () => {
    
    
    let sut:StorageInterface;

    beforeAll((done) =>{
        sut = new (require("../sqliteMgr"))()
        done();
    })

    test('empty constructor', () => {
        expect(sut).not.toBeUndefined();
    });

    test('date fix', ()=>{
    })

    describe("init", ()=>{
        test('fail', (done)=>{
            mockSqliteDb.run.mockImplementationOnce(()=>{ throw Error('fail')})
            sut.init()
            .then(()=>{
                fail("shouldn't return")
            })
            .catch((e)=>{
                expect(mockSqliteDb.run).toBeCalled()
                expect(e.message).toEqual('fail')
                done()
            })
        })
        test('ok', ()=>{
            sut.init()
            .then(()=>{
                expect(mockSqliteDb.run).toBeCalled()
                
            });
        })
    
    })

    describe("addEdge()", () => {
        test('fail', (done)=> {
            mockSqliteDb.run.mockImplementationOnce(()=>{throw Error('fail')});
            const edge={
                hash: 'someHash',
                from: 'did:from',
                to: 'did:to',
                type: 'someType',
                time: 1,
                visibility: 'ANY',
                jwt: 'ey...'
            }
            sut.addEdge(edge)
            .then((resp)=> {
                fail("shouldn't return")
            })
            .catch((e)=>{
                expect(mockSqliteDb.run).toBeCalled()
                expect(e.message).toEqual('fail')
                done()
            })
        })

        test('ok', (done)=> {
            mockSqliteDb.run.mockImplementationOnce(()=>{return 'OK'});
            const edge={
                hash: 'someHash',
                from: 'did:from',
                to: 'did:to',
                type: 'someType',
                time: 1,
                visibility: 'ANY',
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
        test('fail', (done)=> {
            mockSqliteDb.get.mockImplementationOnce(()=>{throw Error('fail')});
            sut.getEdge("someHash",{user: 'did:u'})
            .then(()=> {
                fail("shouldn't return")
            })
            .catch((e)=>{
                expect(mockSqliteDb.get).toBeCalled()
                expect(e.message).toEqual('fail')
                done()
            })
        })

        test('ok (no data)', (done)=> {
            mockSqliteDb.get.mockReset()
            mockSqliteDb.get.mockImplementationOnce(()=>{return null});
            sut.getEdge('someHash',{user: 'did:u'})
            .then((resp)=> {
                expect(resp).toBeNull();
                expect(mockSqliteDb.get).toBeCalledWith("SELECT * FROM edges WHERE hash = 'someHash' AND ((visibility = 'TO' AND \"to\" = 'did:u') OR (visibility = 'BOTH' AND (\"from\" = 'did:u' OR \"to\" = 'did:u')) OR visibility = 'ANY')")
                done()
            })
        })

        test('ok (no authz)', (done)=> {
            mockSqliteDb.get.mockReset()
            mockSqliteDb.get.mockImplementationOnce(()=>{return {data: 'OK'}});
            sut.getEdge('someHash',{user: 'did:u'})
            .then((resp)=> {
                expect(resp.data).toEqual('OK')
                expect(mockSqliteDb.get).toBeCalledWith("SELECT * FROM edges WHERE hash = 'someHash' AND ((visibility = 'TO' AND \"to\" = 'did:u') OR (visibility = 'BOTH' AND (\"from\" = 'did:u' OR \"to\" = 'did:u')) OR visibility = 'ANY')")
                done()
            })
        })

        test('ok (bad authz)', (done)=> {
            mockSqliteDb.get.mockReset()
            mockSqliteDb.get.mockImplementationOnce(()=>{return {data: 'OK'}});
            sut.getEdge('someHash',{user: 'did:u', authzRead:[{iss: 'did:u2'}]})
            .then((resp)=> {
                expect(resp.data).toEqual('OK')
                expect(mockSqliteDb.get).toBeCalledWith("SELECT * FROM edges WHERE hash = 'someHash' AND ((visibility = 'TO' AND \"to\" = 'did:u') OR (visibility = 'BOTH' AND (\"from\" = 'did:u' OR \"to\" = 'did:u')) OR visibility = 'ANY')")
                done()
            })
        })

        test('ok (authz)', (done)=> {
            mockSqliteDb.get.mockReset()
            mockSqliteDb.get.mockImplementationOnce(()=>{return {data: 'OK'}});
            sut.getEdge('someHash',{user: 'did:u', authzRead:[{iss: 'did:u2',from:'did:u'}]})
            .then((resp)=> {
                expect(resp.data).toEqual('OK')
                expect(mockSqliteDb.get).toBeCalledWith("SELECT * FROM edges WHERE hash = 'someHash' AND (((visibility = 'TO' AND \"to\" = 'did:u') OR (visibility = 'BOTH' AND (\"from\" = 'did:u' OR \"to\" = 'did:u')) OR visibility = 'ANY') OR (\"to\" = 'did:u2' AND \"from\" = 'did:u'))")
                done()
            })
        })

    })

    describe("findEdge()", () => {
        test('fail', (done)=> {
            mockSqliteDb.all.mockImplementationOnce(()=>{throw Error('fail')});
            sut.findEdges({},{user: 'did:u'})
            .then(()=> {
                fail("shouldn't return")
            })
            .catch((e)=>{
                expect(mockSqliteDb.all).toBeCalled()
                expect(e.message).toEqual('fail')
                done()
            })
        })

        test('ok (null authData)', (done)=> {
            mockSqliteDb.all.mockReset()
            mockSqliteDb.all.mockImplementationOnce(()=>{return null});
            sut.findEdges({},null)
            .then((resp)=> {
                expect(resp).toEqual(null)
                expect(mockSqliteDb.all).toBeCalledWith("SELECT * FROM edges WHERE visibility = 'ANY' ORDER BY time")
                done()
            })
        })

        test('ok (no data)', (done)=> {
            mockSqliteDb.all.mockReset()
            mockSqliteDb.all.mockImplementationOnce(()=>{return null});
            sut.findEdges({},{user: 'did:u'})
            .then((resp)=> {
                expect(resp).toEqual(null)
                expect(mockSqliteDb.all).toBeCalledWith("SELECT * FROM edges WHERE ((visibility = 'TO' AND \"to\" = 'did:u') OR (visibility = 'BOTH' AND (\"from\" = 'did:u' OR \"to\" = 'did:u')) OR visibility = 'ANY') ORDER BY time")
                done()
            })
        })

        test('ok (empty)', (done)=> {
            mockSqliteDb.all.mockReset()
            mockSqliteDb.all.mockImplementationOnce(()=>{return [{data:'OK'}]});
            sut.findEdges({},{user: 'did:u'})
            .then((resp)=> {
                expect(resp[0].data).toEqual('OK')
                expect(mockSqliteDb.all).toBeCalledWith("SELECT * FROM edges WHERE ((visibility = 'TO' AND \"to\" = 'did:u') OR (visibility = 'BOTH' AND (\"from\" = 'did:u' OR \"to\" = 'did:u')) OR visibility = 'ANY') ORDER BY time")
                done()
            })
        })

        test('ok (fromDID)', (done)=> {
            mockSqliteDb.all.mockReset()
            mockSqliteDb.all.mockImplementationOnce(()=>{return [{data:'OK'}]});
            sut.findEdges({fromDID:['did1','did2']},{user: 'did:u'})
            .then((resp)=> {
                expect(resp[0].data).toEqual('OK')
                expect(mockSqliteDb.all).toBeCalledWith("SELECT * FROM edges WHERE \"from\" IN ('did1', 'did2') AND ((visibility = 'TO' AND \"to\" = 'did:u') OR (visibility = 'BOTH' AND (\"from\" = 'did:u' OR \"to\" = 'did:u')) OR visibility = 'ANY') ORDER BY time")
                done()
            })
        })
        test('ok (toDID)', (done)=> {
            mockSqliteDb.all.mockReset()
            mockSqliteDb.all.mockImplementationOnce(()=>{return [{data:'OK'}]});
            sut.findEdges({toDID:['did1','did2']},{user: 'did:u'})
            .then((resp)=> {
                expect(resp[0].data).toEqual('OK')
                expect(mockSqliteDb.all).toBeCalledWith("SELECT * FROM edges WHERE \"to\" IN ('did1', 'did2') AND ((visibility = 'TO' AND \"to\" = 'did:u') OR (visibility = 'BOTH' AND (\"from\" = 'did:u' OR \"to\" = 'did:u')) OR visibility = 'ANY') ORDER BY time")
                done()
            })
        })
        test('ok (type,since and tag)', (done)=> {
            mockSqliteDb.all.mockReset()
            mockSqliteDb.all.mockImplementationOnce(()=>{return [{data:'OK'}]});
            sut.findEdges({type:['type1','type2'],since: 2019,tag:['tag1','tag2']},{user: 'did:u'})
            .then((resp)=> {
                expect(resp[0].data).toEqual('OK')
                expect(mockSqliteDb.all).toBeCalledWith("SELECT * FROM edges WHERE ((type IN ('type1', 'type2') AND time > 2019) AND tag IN ('tag1', 'tag2')) AND ((visibility = 'TO' AND \"to\" = 'did:u') OR (visibility = 'BOTH' AND (\"from\" = 'did:u' OR \"to\" = 'did:u')) OR visibility = 'ANY') ORDER BY time")
                done()
            })
        })
    })
});
