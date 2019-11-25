process.env.PG_URL='fakePG_URL'
jest.mock('../lib/pgMgr')
const apiHandler = require('../api_handler');

describe('apiHandler', () => {

    beforeAll(() => {
    })

    test('graphql()', done => {
        apiHandler.graphql({headers:{}},{},(err: Error,res: string)=>{
            expect(err).toBeNull()
            expect(res).not.toBeNull()
            
            done();
        })
    });
});
