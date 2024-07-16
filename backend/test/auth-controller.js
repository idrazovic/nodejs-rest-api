const sinon = require('sinon');
const mongoose = require('mongoose');

const User = require('../models/user');
const authController = require('../controllers/auth');

const MONGO_DB_URI = `mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@node-rest-api.axitvrv.mongodb.net/test-db?retryWrites=true&w=majority&appName=node-rest-api`;

describe('Auth Controller - Login', () => {
    let expect;
    beforeEach(async () => {
        expect = (await import('chai')).expect;
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should throw an error with code 500 if accessing the database fails', async () => {
        sinon.stub(User, 'findOne');
        User.findOne.throws();

        const req = {
            body: {
                email: 'a@a.com',
                password: '12345'
            }
        };

        const res = await authController.login(req, {}, () => { });
        expect(res).to.be.an('error');
        expect(res).to.have.property('statusCode', 500);
    });
});

describe('Auth Controller - getUserStatus', () => {

    let expect;
    before(async () => { 
        expect = (await import('chai')).expect;

        await mongoose.connect(MONGO_DB_URI)

        const user = new User({
            name: 'Igor',
            email: 'a@a.com',
            password: '12345',
            status: 'I am new!',
            posts: [],
            _id: '507f1f77bcf86cd799439019'
        });
        return user.save();
    });

    after(async () => {
        await User.deleteMany({});
        await mongoose.disconnect();
    });

    it('should send a response with a valid user status for a given user', async () => {
        const req = {
            userId: '507f1f77bcf86cd799439019'
        };
        const res = {
            statusCode: 500,
            userStatus: null,
            status: function (code) {
                this.statusCode = code;
                return this;
            },
            json: function (data) {
                this.userStatus = data.status;
            }
        };
        await authController.getUserStatus(req, res, () => { })
        expect(res.statusCode).to.be.equal(200);
        expect(res.userStatus).to.be.equal('I am new!');
    });
});