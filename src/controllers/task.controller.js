import mongoose from "mongoose";
import { Task } from "../models/task.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const addTask = asyncHandler( async (req, res) => {
    const { 
        title, 
        description, 
        subtasks, 
        link, 
        category, 
        priority, 
        deadline
     } = req.body

     const userId = req.user._id

     const extraList = {
        title,
        description,
        category,
        priority,
        deadline,
        user: new mongoose.Types.ObjectId(userId),
     }

     if (subtasks !== undefined){
        extraList.subtasks = subtasks
     }

     if (link !== undefined){
        extraList.link = link
     }

     if (title.length > 90){
        throw new apiError(400,"title length should be less than 90 chars")
     }

     if (!["personal","professional"].includes(category)){
        throw new apiError(400,"category not getting matched")
     }

     if (![" ","medium","high"].includes(priority)){
        throw new apiError(400,"priority not getting matched")
     }

     if (!req.body.deadline){
      throw new apiError(401,"deadline is required")
     }

     try {
        const task = await Task.create(extraList)

        return res
        .status(201)
        .json( new apiResponse(
            200,
            "successfully added todo",
            { task }
        ))
     } catch (error) {
        throw new apiError(500,"failed to add task")
     }
})

const updateTask = asyncHandler( async (req, res) => {
   const updateList = {}
   const fields = ["title","description","subtasks","link","category","priority","deadline","status"]

   fields.forEach((field) => {
   if (req.body[field] !== undefined){
      updateList[field] = req.body[field]
   }
   })

   if (updateList.title?.length > 90){
      throw new apiError(400,"title length should be less than 90 chars")
   }

   if (!["personal","professional"].includes(updateList.category) && updateList.category){
      throw new apiError(400,"category not getting matched")
   }

   if (!["basic","medium","high"].includes(updateList?.priority) && updateList.priority){
      throw new apiError(400,"priority not getting matched")
   }

   const taskId = req.body.taskId;
   const userId = req.user._id;
   

   if (!taskId){
   throw new apiError(401,"please enter taskId")
   }

   const task = await Task.findOneAndUpdate(
      {
         _id: taskId,
         user: userId
      },
      {
         $set: updateList
      },
      { new: true }
   )

   if (!task){
   throw new apiError(401,"authorization access denied")
   }

   return res
   .status(200)
   .json( new apiResponse(
      200,
      "successfully updated todo",
      { task }
   ))

})

const authTask = asyncHandler( async (req, res) => {
   try {
      const  userId = req.user?._id;

      const tasks = await Task.find({ user: userId })

      const tasksWithStatus = tasks.map((task) => {
         const taskObj = task.toObject()

         if (task.deadline && new Date(task.deadline) < new Date()){
            taskObj.status = "delayed"
         }
      
         return taskObj
      })
            
      return res
      .status(200)
      .json( new apiResponse(
         200,
         "tasks authorized succcessfully",
         { tasksWithStatus }
      ) )
      
   } catch (error) {
      throw new apiError(500,"failed to authorized task data!")
   }
})

const deleteTask = asyncHandler( async (req, res) => {
   const {taskId} = req.body;
   const userId = req.user?._id;

   if (!(taskId && userId)){
      throw new apiError(404,"taskId not found")
   }

   try {
      const task = await Task.findOneAndDelete({
         _id: taskId,
         user: userId,
      })

      if (!task){
         throw new apiError(404,"task not found")
      }

      return res
      .status(200)
      .json( new apiResponse(
         200,
         "successfully deleted task",
         {}
      ))
   } catch (error) {
      throw new apiError(500,"failed to delete task")      
   }
})

export { 
    addTask,
    updateTask,
    authTask,
    deleteTask,
}