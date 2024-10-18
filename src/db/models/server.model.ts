import mongoose, { Schema } from 'mongoose';

// An interface that describes the properties
// that a Server Document has
interface IServerDoc extends mongoose.Document {
    discord_server_id: string;
    owner_discord_id: string;
    owner_email: string;
    general_channel_id: string;
    password: string;
    admin_ids: string[];
    admin_role_ids: string[];
    commands_limit: Map<
        command_name,
        {
            limit?: number | undefined;
            roles_limit: Map<role_id, number>;
        }
    >;
    createdAt: string;
    updatedAt: string;
}

type command_name = string;
type role_id = string;

const serverSchema = new Schema(
    {
        discord_server_id: {
            type: String,
            required: true,
        },
        owner_discord_id: {
            type: String,
            required: false,
        },
        owner_email: {
            type: String,
            required: false,
        },
        general_channel_id: {
            type: String,
            required: false,
        },
        admin_ids: [String],
        admin_role_ids: [String],
        commands_limit: {
            // command name is key
            type: Map,
            of: {
                limit: Number,
                roles_limit: {
                    // role id is key
                    type: Map,
                    of: Number,
                },
            },
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

const Server = mongoose.model<IServerDoc, mongoose.Model<IServerDoc>>(
    'Server',
    serverSchema
);

export default Server;
export type { IServerDoc };
