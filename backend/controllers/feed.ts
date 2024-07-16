import fs from 'fs';
import path from 'path';

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

import { getIO } from '../socket';
import Post from '../models/post';
import { User, IUser } from '../models/user';
import { CustomRequest } from '../models/custom-request';
import { CustomError } from '../models/custom-error';

const clearImage = (filePath: string) => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
}

// TODO Request body, Request params, Request query type definitions

const getPosts = async (req: Request, res: Response, next: NextFunction) => {
    const currentPage = +(req.query.page as string) || 1;
    const perPage = 2;
    try {
        const totalItems = await Post.countDocuments();
        const posts = await Post.find()
            .populate('creator')
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * perPage)
            .limit(perPage);
        res.status(200).json({
            message: 'Posts fetched successfully!',
            posts: posts,
            totalItems: totalItems
        });
    } catch (err: any) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

const createPost = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect.') as CustomError;
        error.statusCode = 422;
        throw error;
    }
    if (!req.file) {
        const error = new Error('No image provided.') as CustomError;
        error.statusCode = 422;
        throw error;
    }
    const imageUrl = req.file.path;
    const title = req.body.title;
    const content = req.body.content;
    const post = new Post({
        title,
        content,
        imageUrl,
        creator: req.userId,
    });
    console.log(post);

    try {
        await post.save();
        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('Could not find user.') as CustomError;
            error.statusCode = 404;
            throw error;
        }
        const creator = user;
        user.posts.push(post);
        await user.save();

        getIO().emit('posts', { action: 'create', post: { ...post.toObject(), creator: { _id: req.userId, name: creator.name } } });

        res.status(201).json({
            message: 'Post created successfully!',
            post: post,
            creator: { _id: creator._id, name: creator.name }
        });
    } catch (err: any) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

const getPost = async (req: Request, res: Response, next: NextFunction) => {
    const postId = req.params.postId;
    try {
        const post = await Post.findById(postId).populate('creator');
        if (!post) {
            const error = new Error('Could not find post.') as CustomError;
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({ message: 'Post fetched.', post: post });
    } catch (err: any) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

const updatePost = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect.') as CustomError;
        error.statusCode = 422;
        throw error;
    }
    const postId = req.params.postId;
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;
    if (req.file) {
        imageUrl = req.file.path;
    }
    if (!imageUrl) {
        const error = new Error('No file picked.') as CustomError;
        error.statusCode = 422;
        throw error;
    }

    try {
        const post = await Post.findById(postId).populate('creator');
        if (!post) {
            const error = new Error('Could not find post.') as CustomError;
            error.statusCode = 404;
            throw error;
        }
        if (post.creator._id.toString() !== req.userId) {
            const error = new Error('Not authorized!') as CustomError;
            error.statusCode = 403;
            throw error;
        }
        if (imageUrl !== post.imageUrl) {
            clearImage(post.imageUrl);
        }
        post.title = title;
        post.content = content;
        post.imageUrl = imageUrl;
        const result = await post.save();
        getIO().emit('posts', { action: 'update', post: result });
        res.status(200).json({ message: 'Post updated!', post: result });
    } catch (err: any) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

const deletePost = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const postId = req.params.postId;
    try {
        const post = await Post.findById(postId);
        if (!post) {
            const error = new Error('Could not find post.') as CustomError;
            error.statusCode = 404;
            throw error;
        }
        if (post.creator.toString() !== req.userId) {
            const error = new Error('Not authorized!') as CustomError;
            error.statusCode = 403;
            throw error;
        }
        clearImage(post.imageUrl);
        await Post.findByIdAndDelete(postId);
        const user = await User.findById(req.userId) as IUser;
        user.posts.pull(postId);
        await user.save();

        getIO().emit('posts', { action: 'delete', post: postId });

        res.status(200).json({ message: 'Post deleted!' });
    } catch (err: any) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

export { getPosts, createPost, getPost, updatePost, deletePost };