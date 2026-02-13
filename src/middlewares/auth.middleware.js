import jwt from "jsonwebtoken"
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";

const verifyToken = async (req, _,next) => {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken){
        throw new apiError(404,"access token not found")
    }

    const decodeUser = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)

    if (!decodeUser){
        throw new apiError(401,"token expired or used")
    }

    const user =  await User.findById(decodeUser._id).select("-password -refreshToken")

    if (!user){
        throw new apiError(404,"user not found ")
    }

    req.user = user
    next()
}

export { verifyToken }