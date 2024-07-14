const express = require("express");
const { body } = require('express-validator');

const router = express.Router();

const User = require('../models/user');
const isAuth = require("../middleware/is-auth");
const { signup, login, getUserStatus } = require("../controllers/auth");

router.put(
    '/signup',
    [
        body('email')
            .isEmail()
            .withMessage('Please enter a valid email.')
            .custom((value, { req }) => {
                return User.findOne({ email: value }).then(userDoc => {
                    if (userDoc) {
                        return Promise.reject('E-Mail address already exists!');
                    }
                });
            })
            .normalizeEmail(),
        body('password').trim().isLength({ min: 5 })
    ],
    signup
);

router.post("/login", login);

router.get('/status', isAuth, getUserStatus)

module.exports = router;