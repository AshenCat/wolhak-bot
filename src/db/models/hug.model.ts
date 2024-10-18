import mongoose, { Schema } from 'mongoose';

// An interface that describes the properties
// that a Hug  has
interface IHugDoc extends mongoose.Document {
    from_discord_id: string;
    to_discord_id: string;
    discord_server_id: string;
    createdAt?: string;
    updatedAt?: string;
}

const hugSchema = new Schema(
    {
        from_discord_id: {
            type: String,
            required: true,
        },
        to_discord_id: {
            type: String,
            required: true,
        },
        discord_server_id: {
            type: String,
            required: true,
        },
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

const Hug = mongoose.model<IHugDoc, mongoose.Model<IHugDoc>>('Hug', hugSchema);

export default Hug;
export type { IHugDoc };
