import bcrypt from "bcryptjs";

import { IUser, User } from "../models/user";
import { Request } from "express";

const root = {
    createUser: async function (args: { userInput: IUser }, req: Request) {
        const { email, name, password } = args.userInput;

        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            throw new Error('User exists already.');
        }

        const hashedPw = await bcrypt.hash(password, 12);
        const user = new User({
            email: email,
            name: name,
            password: hashedPw
        });
        const createdUser = await user.save();

        return { ...createdUser.toJSON(), _id: (createdUser._id as string).toString() };
    }
}
export { root } 