import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.model.js"
import { apiError } from "../utils/apiError.js"
import apiResponse from "../utils/apiResponse.js"

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

    if ([username_email,password].filter(el => {el.trim() === ""})){
        throw new apiError(401,"Empty Fields")
    }

    const user = await User.findOne({ 
        email: username_email, 
        username: username_email
     })
     
     if (!user) {
        throw new apiError(404,"invalid email")
     }

     const passwordValidate = user.isPasswordCorrect(password)

     if (!passwordValidate){
        throw new apiError(401,"password not recognized")
     }

     const {refreshToken, accessToken} = await generateAccesAndRefreshTokens(user._id)

     const loggedUser = await User.findById(user._id).select(
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


   // Register Validations 

   //  if ( String( password.split([]).filter( el => ("~!@#$%&*?_".includes(el)) ) ) ){
   //    throw new apiError(401, "password must contain a special key")
   //  }

   //  if (password.length() < 8){
   //    throw new apiError(401,"password length must be at least 8")
   //  }

export {  
   login,
}