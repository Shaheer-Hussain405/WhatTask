import { Router } from "express";
import { authMe, changePassword, forgotPassword, forgotPassword_req, login, logout, refreshAuth, registerUser, registerUser_req, resend_Reg_otp, updateAvatar, updateProfile,} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"; 
import { verifyToken } from "../middlewares/auth.middleware.js"


const router = Router()

router.route("/register").post(registerUser_req)

router.route("/resend/otp").get(resend_Reg_otp)

router.route("/auth/verify/:otp").get(registerUser)

router.route("/login").post(login)

router.route("/logout").get(verifyToken,logout)

router.route("/auth/me").get(verifyToken,authMe)

router.route("/update/avatar").patch(
    upload.single("avatar"),
    verifyToken,
    updateAvatar
)

router.route("/refresh/auth").get(refreshAuth)

router.route("/update/profile").patch(verifyToken,updateProfile)

router.route("/reset/password").patch(verifyToken,changePassword)

router.route("/forgot/password/req").post(forgotPassword_req)

router.route("/forgot/password/verify/:otp").get(forgotPassword)

export default router