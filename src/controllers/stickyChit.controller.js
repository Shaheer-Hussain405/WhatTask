import { asyncHandler } from "../utils/asyncHandler.js"
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { StickyChit } from "../models/stickyChit.model.js";
import { stickyChitColors } from "../constants.js";
import mongoose from "mongoose";

const chitAdd = asyncHandler( async (req, res) => {
    const {
        title,
        description,
        category
    } = req.body;

    const userId = req.user._id;

    if ([title,description,category].some(field => field.trim() === "")){
        throw new apiError(401,"please add all fields")
    }

    const stickyChit = await StickyChit.create({
        user: new mongoose.Types.ObjectId(userId),
        title,
        description,
        category,
    })

    if (!stickyChit){
        throw new apiError(500,"failed to add chit")
    }

    return res
    .status(201)
    .json( new apiResponse(
        200,
        "successfully added stickyChit!",
        { stickyChit }
    ) )
})

const chitUpdate = asyncHandler( async (req, res) => {
    const fields  = ["title","description","category"];

    const updateList = {}

    fields.forEach((field) => {
        if (req.body[field] !== undefined){
            updateList[field] = req.body[field]
        }
    })

    const user = req.user?._id;
    const _id = req.body.chitId

    if (!_id){
        throw new apiError(404,"chitId not found")
    }

    try {
        const chit =  await StickyChit.findOneAndUpdate({
            user,
            _id
        },
        {
            $set: updateList
        },
        { new: true })

        if (!chit){
            throw new apiError(401,"failed to update")
        }

        return res
        .status(200)
        .json( new apiResponse(
            200,
            "successfully updated the chit",
            { chit }
        ) )
    } catch (error) {
        throw new apiError(401,"authorization access denied")
    }
})

const chitAuth = asyncHandler( async (req, res) => {
    const userId = req.user._id;

    const chits = await StickyChit.find({ user: userId })

    if (!chits){
        throw new apiError(404,"chits not found")
    }

    console.log(chits);
    

    const chitsWithColors = chits.map((chit) => {
        const chitObj = chit.toObject()

        const color = stickyChitColors[Math.floor(Math.random() * stickyChitColors.length)]
        chitObj.bgColor = color

        return chitObj
    })
    
    return res
    .status(200)
    .json( new apiResponse(
        200,
        "successfully fetched chits",
        { chitsWithColors }
    ) )
})

const chitDelete = asyncHandler( async (req, res) => {
    const { chitId } = req.body;

    if (!chitId){
        throw new apiError(404,"please enter chitId")
    }

    const userId = req.user._id;

    const chit = await StickyChit.findOneAndDelete(
        {
            user: userId,
            _id: chitId,
        }
    ) 

    if (!chit){
        throw new apiError(404,"authorization access denied")
    }

    return res
    .status(200)
    .json( new apiResponse(
        200,
        "successfully dleted chit",
        {}
    ))
})

export {
    chitAdd,
    chitUpdate,
    chitAuth,
    chitDelete
}