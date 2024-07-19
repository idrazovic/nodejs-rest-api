import path from "path";
import fs from 'fs';

import express, { NextFunction, Request, Response } from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import multer from 'multer';
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

import { feedRoutes } from './routes/feed';
import { authRoutes } from './routes/auth';

const MONGO_DB_URI = `mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@node-rest-api.axitvrv.mongodb.net/test?retryWrites=true&w=majority&appName=node-rest-api`;

const app = express();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: any) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

app.use(helmet());
app.use(compression());
app.use(morgan('dev', { stream: accessLogStream }));

app.use(bodyParser.json());
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));
app.use('images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({ message: message, data: data });
});

mongoose.connect(MONGO_DB_URI)
    .then(() => {
        const server = app.listen(8080);
        const io = require('./socket').init(server);
        io.on('connection', () => {
            console.log('Client connected');
        });
    }).catch(err => {
        console.log(err);
    });
