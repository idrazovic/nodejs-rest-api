import { Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';

import { CustomError } from '../models/custom-error';
import { CustomRequest } from '../models/custom-request';

export default (req: CustomRequest, res: Response, next: NextFunction) => {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
        const error = new Error('Not authenticated.') as CustomError;
        error.statusCode = 401;
        throw error;
    }
    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
        decodedToken = verify(token, process.env.JWT_SECRET as string);
    } catch (err: any) {
        err.statusCode = 500;
        throw err;
    }
    if (!decodedToken) {
        const error = new Error('Not authenticated.') as CustomError;
        error.statusCode = 401;
        throw error;
    }
    req.userId = (decodedToken as { userId: string }).userId;
    next();
}