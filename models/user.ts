import mongoose, { Document, Schema, Types } from 'mongoose';

interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    status: string;
    posts: Types.Array<Schema.Types.ObjectId>;
}

const userSchema: Schema = new Schema<IUser>({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'I am new!'
    },
    posts: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Post'
        }
    ]
}, { timestamps: true });

const User = mongoose.model<IUser>('User', userSchema);

export { User, IUser };