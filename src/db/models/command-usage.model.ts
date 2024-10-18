import mongoose, { Schema } from 'mongoose';

// An interface that describes the properties
// that a Command Usage has
interface ICommandUsageDoc extends mongoose.Document {
    prompt?: string;
    discord_user_id: string;
    discord_server_id: string;
    command_name: string;
    createdAt?: string;
    updatedAt?: string;
}

const commandUsageSchema = new Schema(
    {
        prompt: String,
        discord_user_id: {
            type: String,
            required: true,
        },
        command_name: {
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

const CommandUsage = mongoose.model<
    ICommandUsageDoc,
    mongoose.Model<ICommandUsageDoc>
>('CommandUsage', commandUsageSchema);

export default CommandUsage;
export type { ICommandUsageDoc };
