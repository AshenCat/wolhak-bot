import mongoose, { Schema } from 'mongoose';
import { IUserDoc } from './user.model';

// An interface that describes the properties
// that a Gpt Document has
interface IGptDoc extends mongoose.Document {
    type: string;
    prompt: string;
    user: Schema.Types.ObjectId | IUserDoc;
    response: any;
    created_at: string;
    updated_at: string;
}

const gptSchema = new Schema(
    {
        type: String,
        prompt: String,
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        response: {},
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

const Gpt = mongoose.model<IGptDoc, mongoose.Model<IGptDoc>>('Gpt', gptSchema);

export default Gpt;
export type { IGptDoc };
