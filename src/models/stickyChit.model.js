import mongoose, { Schema } from "mongoose"

const stickyChitSchema = new Schema(
    {
        "user":{
            type: Schema.Types.ObjectId,
            ref: User
        },
        "title":{
            type: String,
            required: true,
            max: 20,
        },
        "description":{
            type: String,
            required: true,
            max: 90,
        },
        "category":{
            type: String,
            enum: ["motivation","goal","habbit","reminder"],
            required: true,
        }
    },
    { timestamps: true }
)

export const StickyChit = mongoose.model("StickyChit", stickyChitSchema)