const sinon = require('sinon');
const jwt = require('jsonwebtoken');

const isAuth = require('../middleware/is-auth');

describe('isAuth middleware', () => {
    let expect;

    beforeEach(async () => {
        expect = (await import('chai')).expect;
    })

    afterEach(() => {
        sinon.restore();
    });

    it('should throw an error if no authorization header is present', async () => {
        const req = {
            get: () => {
                return null;
            }
        };

        expect(isAuth.bind(this, req, {}, () => { })).to.throw('Not authenticated.');
    });

    it('should throw an error if the token is not present', () => {
        const req = {
            get: () => {
                return 'Bearer';
            }
        };
        expect(isAuth.bind(this, req, {}, () => { })).to.throw('jwt must be provided');
    });

    it('should throw an error if the token is invalid', () => {
        const req = {
            get: () => {
                return 'Bearer 1234';
            }
        };
        expect(isAuth.bind(this, req, {}, () => { })).to.throw('jwt malformed');
    });

    it('shoudl yield a userId after decoding the token', () => {
        const req = {
            get: () => {
                return 'Bearer dewfwefnewifiwef';
            }
        };
        sinon.stub(jwt, 'verify');
        jwt.verify.returns({ userId: 'abc' });
        isAuth(req, {}, () => { });
        expect(req).to.have.property('userId');
        expect(req.userId).to.equal('abc');
        expect(jwt.verify.called).to.be.true;
    });
});
