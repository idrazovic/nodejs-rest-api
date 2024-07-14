const sinon = require('sinon');
const mongoose = require('mongoose');

const Post = require('../models/post');
const User = require('../models/user');
const feedController = require('../controllers/feed');

const MONGO_DB_URI = `mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@node-rest-api.axitvrv.mongodb.net/test-db?retryWrites=true&w=majority&appName=node-rest-api`;

describe('Feed Controller - createPost', () => {

    let expect;
    before(async () => {
        expect = (await import('chai')).expect;

        await mongoose.connect(MONGO_DB_URI);
        const user = new User({
            name: 'test',
            email: 'a@a.com',
            password: '12345',
            posts: [],
            _id: '5d5c3a7b0c3a7b0c3a7b0c3a'
        });

        await user.save();

        const req = {
            body: {
                title: 'Test title',
                content: 'Test content',
            },
            file: {
                path: 'test.png'
            },
            userId: '5d5c3a7b0c3a7b0c3a7b0c3a'
        };
        const res = {
            status: function () {
                return this;
            },
            json: function () { }
        };
        const next = function () { };
        await feedController.createPost(req, res, next);
    });

    after(async () => {
        await User.deleteMany({});
        await Post.deleteMany({});
        await mongoose.connection.close();
    });

    it('should create a new post', async () => {
        const post = await Post.findOne({ title: 'Test title' });
        expect(post).to.not.be.null;
        expect(post.title).to.equal('Test title');
        expect(post.content).to.equal('Test content');
        expect(post.creator.toString()).to.equal('5d5c3a7b0c3a7b0c3a7b0c3a');
    });

    it('should add the created post to the user', async () => {
        const user = await User.findById('5d5c3a7b0c3a7b0c3a7b0c3a');
        const post = await Post.findOne({ title: 'Test title' });
        expect(user.posts[0].toString()).to.equal(post._id.toString());
    });
})