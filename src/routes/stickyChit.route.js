import { Router } from "express"
import { verifyToken } from "../middlewares/auth.middleware.js"
import { chitAdd, chitAuth, chitDelete, chitUpdate } from "../controllers/stickyChit.controller.js"

const router = Router()

router.route("/chit").post(verifyToken,chitAdd)

router.route("/chit").patch(verifyToken,chitUpdate)

router.route("/chit").get(verifyToken,chitAuth)

router.route("/chit/del").post(verifyToken,chitDelete)


export default router