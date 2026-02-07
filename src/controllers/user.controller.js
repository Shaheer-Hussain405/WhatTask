import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js"
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { sendOTP } from "../utils/otpAuthentication.js"

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



const registerUser = asyncHandler( async (req, res) => {
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

    if ( password.split("").some( el => ("~!@#$%&*?_".includes(el)) ) ){
      throw new apiError(401, "password must contain a special key")
    }
   
    // multer files access

    // const avatarLocalPath = req.files?.avatar[0]?.path

    // if (!avatarLocalPath){
    //   throw new apiError(404,"avatar image not found")
    // }

    // let avatar = await uploadOnCloudinary(avatarLocalPath)

    // if (!avatar){
    //   avatar = {
    //     url: "https://res.cloudinary.com/db-port-all/image/upload/v1770467414/default-profile-picture1_a9w71m.jpg"
    //   }
    // }

    const user = await User.create({
      fullname,
      email,
      username,
      password,
      // avatar: avatar.url
    })

    const userEntry = await User.findById(user._id).select(
      "-password -refreshToken"
    )

    if (!userEntry){
      throw new apiError("something went wrong while registering")
    }

    // otp send and save to redis here

    return res
    .status(200)
    .json( new apiResponse(
      200,
      "redirected to Auth",
      userEntry
    )) 
})   

const authMe = asyncHandler( async (req, res) => {
   // middleware JWT Token Validation
})

export {
   login,
   registerUser
}

