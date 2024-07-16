
import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { IUser, User } from '../models/user';
import { CustomError } from '../models/custom-error';
import { CustomRequest } from '../models/custom-request';

const signup = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect.') as CustomError;
        error.statusCode = 422;
        throw error;
    }
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    try {
        const hashedPw = await bcrypt.hash(password, 12);
        const user = new User({
            name: name,
            email: email,
            password: hashedPw
        });
        await user.save();
        res.status(201).json({ message: 'User created!', userId: user._id });
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

const login = async (req: Request, res: Response, next: NextFunction) => {
    const email = req.body.email;
    const password = req.body.password;
    try {
        const user = await User.findOne({ email: email }) as IUser;
        if (!user) {
            const error = new Error('A user with this email could not be found.') as CustomError;
            error.statusCode = 401;
            throw error;
        }
        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            const error = new Error('Wrong password!') as CustomError;
            error.statusCode = 401;
            throw error;
        }
        const token = jwt.sign(
            {
                email: user.email,
                userId: user._id?.toString()
            },
            process.env.JWT_SECRET as string,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        res.status(200).json({ token: token, userId: user._id?.toString() });
        return;
    } catch (err: any) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
        return err;
    }
}


const getUserStatus = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('User not found.') as CustomError;
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({ status: user.status });
    } catch (err: any) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

export { signup, login, getUserStatus };
