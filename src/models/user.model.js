import  mongoose,{ Schema } from "mongoose"
import jwt from"jwt"
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        "fullname":{
            type: String,
            required: true,
            max: 18,
        },
        "username":{
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            max: 16,
        },
        "email":{
            type: String,
            required: true,
            unique: true,
        },
        "password":{
            type: String,
            required: true,
        },
        "avatar":{
            type: String,
            default: "" // Default Cloudinary Image
        },
        "bio":{
            type: String,
            max: 80,
        },
        "mood":{
            type: String,
            enum:["focused","motivated","tired"],
            default: "motivated"
        },
        "region":{
            type: String,
            required: true,
            default: 'pk'
        },
        "delpermit":{
            type: Boolean,
            default: true,
        },
        "refreshToken":{
            type: String,
        }
    },
    { timestamps: true }
)

// MiddleWare --save

userSchema.pre("save", async function(){
    if (!this.isModified(this.password)) return;
    this.password = await bcrypt.hash(this.password,10)
})

// Methods --User

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id,
            username,
            email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User",userSchema)