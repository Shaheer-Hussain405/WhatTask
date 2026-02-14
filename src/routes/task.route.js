import { Router } from "express";
import { addTask, authTask, deleteTask, updateTask } from "../controllers/task.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router() 

router.route("/todo").post(verifyToken,addTask)

router.route("/todo").patch(verifyToken,updateTask)

router.route("/todo").get(verifyToken,authTask)

router.route("/todo/del").post(verifyToken,deleteTask)

router.route("/")

export default router