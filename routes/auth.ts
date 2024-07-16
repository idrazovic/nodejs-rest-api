import express from "express";
import { body } from 'express-validator';

const router = express.Router();

import { User } from '../models/user';
import isAuth from "../middleware/is-auth";
import { signup, login, getUserStatus } from "../controllers/auth";

router.put(
    '/signup',
    [
        body('email')
            .isEmail()
            .withMessage('Please enter a valid email.')
            .custom(async (value, { req }) => {
                const userDoc = await User.findOne({ email: value });
                if (userDoc) {
                    return Promise.reject('E-Mail address already exists!');
                }
            })
            .normalizeEmail(),
        body('password').trim().isLength({ min: 5 })
    ],
    signup
);

router.post("/login", login);

router.get('/status', isAuth, getUserStatus)

export { router as authRoutes };