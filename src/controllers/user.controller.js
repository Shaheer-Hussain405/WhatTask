import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js"
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { sendOTP } from "../utils/otpAuthentication.js"
import redisClient from "../utils/redisClient.js"
import jwt from "jsonwebtoken"

const generateAccesAndRefreshTokens = async (id)=>{
    const user = await User.findById(id)
    const accessToken = await user.generateAccessToken(user._id)
    const refreshToken = await user.generateRefreshToken(user._id)
    
    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false }) 

    return {refreshToken, accessToken}
}

const login = asyncHandler( async (req,res)=>{
    const {username_email, password} = req.body

    if (!username_email){
      throw new apiError(401,"empty email field")
    }

    const user = await User.findOne({ 
      $or:[
        {email: username_email}, 
        {username: username_email},
      ]
     })
     
     if (!user) {
        throw new apiError(404,"invalid email")
     }

     const passwordValidate = await user.isPasswordCorrect(password)

     if (!passwordValidate){
        throw new apiError(401,"password not recognized")
     }

     const {refreshToken, accessToken} = await generateAccesAndRefreshTokens(user.id)

     const loggedUser = await User.findById(user.id).select(
        "-password -refreshToken"
     ) 
     
     const cookieOptions = {
      httpOnly: true,
      secure: false, // until production
      sameSite: "lax",
     }

     setTimeout(()=>{
        return res
        .status(200)
        .cookie("refreshToken",refreshToken,cookieOptions)
        .cookie("accessToken",accessToken,cookieOptions)
        .json( 
              new apiResponse(
                 200,
               "User Logged in Successfully",
               { loggedUser }
           )
         ) 
     },2000)
})

const registerUser_req = asyncHandler( async (req, res) => {
   const {username, email , fullname, password, } = req.body

   // Register Validations 

   if ([username,email,fullname,password].some(el => el?.trim() === "")){
      throw new apiError(401,"empty fields")
   }

   const isExisted = await User.findOne({
      $or: [
         {email},{username}
      ]
})

   if (isExisted){
      throw new apiError(401,"User already existed with this email and username")
   }

   if (password.length < 8){
     throw new apiError(401,"password length must be at least 8")
   }

    if ( !password.split("").some( el => ("~!@#$%&*?_".includes(el)) ) ){
      throw new apiError(401, "password must contain a special key")
    }

   try { 
      // otp send and save to redis here
      const otp_Secret = await sendOTP(email,true)
      await redisClient.set("otp", otp_Secret, { EX: 300 })
      
      // data save to redis
      const data = {
         username,fullname,email,password
      }
      await redisClient.set("reg_user_data", JSON.stringify(data), { EX:1500 })

      return res
      .status(200)
      .json( new apiResponse(
      200,
      "Otp sent",
      {}
      ))
   } catch (error) {
      throw new apiError(400,"failed to send email")
   }
})   

const resend_Reg_otp = asyncHandler( async (req, res) => {
   const data = await redisClient.get("reg_user_data")
   const reg_data = JSON.parse(data)

   if (!data){
      throw new apiError(401,"session expired")
   }
   try{
      const otp_Secret = await sendOTP(reg_data.email,true)
   
      await redisClient.set("otp", otp_Secret, { EX:300 })
   
      return res
      .status(200)
      .json("otp successfully sent")

   } catch (error) {
      throw new apiError(400,"failed to send otp",error)     
   }
})

const registerUser = asyncHandler( async (req, res) => {
      const otp = req.params?.otp
      
      if (!otp){
         throw new apiError(404,"please enter otp key")
      }

      const otp_Secret = await redisClient.get("otp") // get redis saved otp
      
      if (!otp_Secret){
         throw new apiError(400,"otp expired")
      }

      if (otp_Secret !== otp){
         throw new apiError(401,"invalid otp!")
      }
      
      try {
         // get redis saved user data
         const data = await redisClient.get("reg_user_data");
         
         if (!data){
            throw new apiError(401,"session expired")
         }

         const reg_data = JSON.parse(data)

         const user = await User.create({
           fullname : reg_data.fullname,
           email : reg_data.email,
           username : reg_data.username ,
           password : reg_data.password,
         })
         
         const userEntry = await User.findById(user._id)
      
         if (!userEntry){
         throw new apiError("something went wrong while registering")
         }

         await redisClient.del("reg_user_data")
         
         return res
         .status(200)
         .json( new apiResponse(
         200,
         "user is registered!",
         {}
         ))

   } catch (error) {
      throw new apiError(400,"something went wrong while authentication")
   } 
})

const authMe = asyncHandler( async (req, res) => {
   try {
      const userId = req.user?._id

      const user = await User.findById(userId).select("-password -refreshToken")

      return res
      .status(200)
      .json( new apiResponse(
         200,
         "user authorized",
         { user }
      ) )
   } catch (error) {
      throw new apiError(401,"failed to authorize user")
   }
})

const updateAvatar = asyncHandler( async (req, res) => {
   const avatarLocalPath = req.file?.path;

   if (!avatarLocalPath){
      throw new apiError(404,"file not found")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)

   if (!avatar.url){
      throw new apiError(400,"file is missing")
   }

   try {
      const userId = req.user._id

      const user = await User.findByIdAndUpdate(
         userId,
         { 
            $set: {
               avatar: avatar.url
            }
          },
         { new: true }
      ).select("-password -refreshToken")

      return res 
      .status(200)
      .json( new apiResponse(
         200,
         "profile image uploaded seccessfully!",
         {user}
      ) )

   } catch (error) {
      throw new apiError(400,"file failed to upload on cloudinary")
   }
})

const logout = asyncHandler( async (req, res)  => {
   try {
      const userId = req.user._id;

      const id = String(userId)

      if (!userId){
         throw new apiError(404,"id not found")
      }

      await User.findByIdAndUpdate(id,
         { 
            $set:{
               refreshToken: ""
            }
          },
         { new: true }
      )

      return res
      .status(200)
      .clearCookie("accessToken")
      .clearCookie("refreshToken")
      .json( new apiResponse(
         200,
         "successfully logged out",
      ))
   } catch (error) {
      throw new apiError(400,"failed to logout",error)
   }
})

const refreshAuth = asyncHandler( async (req, res) => {
   const rToken = req.cookies?.refreshToken;

   if (!rToken){
      throw new apiError(404,"no refreshing credentials")
   }

   const decodedUser = jwt.verify(rToken, process.env.REFRESH_TOKEN_SECRET)

   if (!decodedUser){
      throw new apiError(401,"access denied for refreshing")
   }

   const { refreshToken, accessToken } = await generateAccesAndRefreshTokens(decodedUser._id)

   await User.findByIdAndUpdate(decodedUser._id,
      {
         $set: {
            refreshToken: ""
         }
      },
      { new: true }
   )

   const options = {
      httpOnly: true,
      secure: false,
      sameSite: "lax"
   }

   return res
   .status(200)
   .cookie("refreshToken",refreshToken,options)
   .cookie("accessToken",accessToken,options)
   .json("successfully refreshed Tokens")
})

const updateProfile = asyncHandler( async (req, res) => {
   const userId = req.user._id

   const updateList ={}

   if (req.body.fullname !== undefined){
      updateList.fullname = req.body.fullname
   }

   if (req.body.mood !== undefined){
      updateList.mood = req.body.mood
   }

   if (req.body.delpermit !== undefined){
      updateList.delpermit = req.body.delpermit
   }

   if (req.body.bio !== undefined){
      updateList.bio = req.body.bio
   }

   if (req.body.region !== undefined){
      updateList.region = req.body.region
   }

   if (Object.keys(updateList).length === 0){
      throw new apiError(400,"fields are empty")
   }

   try {
      const user = await User.findByIdAndUpdate(
         userId,
         { $set: updateList },
         { new: true }
      ).select("-password -refreshToken");

      if (!user){
         throw new apiError(500,"data failed to save")
      }

      return res
      .status(200)
      .json( new apiResponse(
         200,
         "successfully saved data",
         { user }
      ) )
   } catch (error) {
         throw new apiError(401,"data failed to save")
   }
})

const changePassword = asyncHandler( async (req, res) => {
   const { oldPassword, newPassword, confPassword } = req.body

   const user = await User.findById(req.user?._id)

   const passwordValidate = await user.isPasswordCorrect(oldPassword)

   if (!passwordValidate){
      throw new apiError(401,"invalid password")
   }

   if (oldPassword === newPassword){
      throw new apiError(401,"you cant set old password")
   }

   if (newPassword !== confPassword){
      throw new apiError(401,"password did not matched")
   }

   if (newPassword.length < 8){
     throw new apiError(401,"password length must be at least 8")
   }

   if (!newPassword.split("").some( el => ("~!@#$%&*?_".includes(el)) ) ){
      throw new apiError(401, "password must contain a special key")
   }

   try {
      user.password = newPassword;
      await user.save()
   
      return res
      .status(200)
      .json( new apiResponse(
         200,
         "successfully changed password",
         { user }
      ) )
   } catch (error) {
      throw new apiError(400,"failed to change password")
   }
})

const forgotPassword_req = asyncHandler( async (req, res) => {
   const { newPassword, confPassword } = req.body

   if (newPassword !== confPassword){
      throw new apiError(401,"password did not matched")
   }

   if (newPassword.length < 8){
     throw new apiError(401,"password length must be at least 8")
   }

   if (!newPassword.split("").some( el => ("~!@#$%&*?_".includes(el)) ) ){
      throw new apiError(403, "password must contain a special key")
   }

   const { userEmail } = req.body

   if (!userEmail){
      throw new apiError(401,"please enter email")
   }

   try{
      const otp_Secret = await sendOTP(userEmail,false)
      
      await redisClient.set("otp", otp_Secret, { EX:300 })
      await redisClient.set("newPass", newPassword, { EX: 300 })
      await redisClient.set("userEmail", userEmail ,{ EX: 300 })
      
      return res
      .status(200)
      .json("otp successfully sent")

   } catch (error) {
      throw new apiError(400,"failed to send otp",error)     
   }
})

const forgotPassword = asyncHandler( async (req, res) => {
      const otp = req.params?.otp
      
      if (!otp){
         throw new apiError(404,"please enter otp key")
      }

      const otp_Secret = await redisClient.get("otp") // get redis saved otp
      
      if (!otp_Secret){
         throw new apiError(400,"otp expired")
      }

      if (otp_Secret !== otp){
         throw new apiError(401,"invalid otp!")
      }
      
      try {
         // get redis saved user data
         const newPass = await redisClient.get("newPass");
         const userEmail = await redisClient.get("userEmail");
         
         if (!newPass){
            throw new apiError(401,"session expired")
         }

         const user = await User.findOne({email: userEmail})

         user.password = newPass
         await user.save()
         
         await redisClient.del("newPass")
         await redisClient.del("userEmail")
         
         return res
         .status(200)
         .json( new apiResponse(
         200,
         "Passsword reset successfully",
         {}
         ))
   } catch (error) {
      throw new apiError(400,"something went wrong while authentication")
   }    
})

export {
   login,
   registerUser,
   resend_Reg_otp,
   registerUser_req,
   updateAvatar,
   logout,
   authMe,
   refreshAuth,
   updateProfile,
   changePassword,
   forgotPassword_req,
   forgotPassword,
}

