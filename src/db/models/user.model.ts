import mongoose, { Schema } from 'mongoose';

// An interface that describes the properties
// that a User Document has
interface IUserDoc extends mongoose.Document {
    discord_user_id: string;
    zodiac: string;
    hugs: {
        other_discord_user_id: string;
        count: number;
    }[];
    created_at: string;
    updated_at: string;
}

const userSchema = new Schema(
    {
        discord_user_id: {
            type: String,
            required: true,
        },
        zodiac: {
            type: String,
            required: false,
        },
        hugs: [
            {
                other_discord_user_id: {
                    type: String,
                    required: true,
                },
                count: {
                    type: Number,
                    default: 1,
                },
            },
        ],
    },
    {
        toJSON: {
            transform(doc, ret) {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
            },
        },
        timestamps: true,
    }
);

const User = mongoose.model<IUserDoc, mongoose.Model<IUserDoc>>(
    'User',
    userSchema
);

export default User;
export type { IUserDoc };
