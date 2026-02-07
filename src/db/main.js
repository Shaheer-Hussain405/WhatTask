import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"

import dotenv from "dotenv"
dotenv.config({ path: "../../.env" })

const connectDB = async () => {
    try {
        const response = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log("\n-:- MongoDB has Successfully connected to Server by :",response.connection.host)
    } catch (error) {
        console.log("_!_ Failed to connect DB",error.message || error)
        process.exit(1) // immediate forced stop due error
    }
}

export { connectDB }