import mongoose,{ Schema } from "mongoose"

const taskSchema = new Schema(
    {
        "user":{
            type: Schema.Types.ObjectId,
            ref: User
        },
        "title":{
            type: String,
            required: true,
            max: 90,
        },
        "description":{
            type: Array,
            required: true,
        },
        "subtasks":{
            type: Array,
            default: [],
        },
        "status":{
            type: String,
            default: "pending", 
        },
        "link":{
            type: String,
        },
        "category":{
            type: String,
            enum:["personal","professional"],
            required: true,
        },
        "priority":{
            type: String,
            enum: ["basic","medium","high"],
            required: true,
        },
        "deadline":{
            type: Date,
            required: true,
        }
    },
    { timestamps: true }
)


export const Task = mongoose.model("Task",taskSchema)