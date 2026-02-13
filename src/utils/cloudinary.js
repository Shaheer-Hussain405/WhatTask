import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUD_DB_NAME,
    api_key: process.env.CLOUD_DB_API_KEY,
    api_secret: process.env.CLOUD_DB_API_SECRET,
})

const uploadOnCloudinary = async (localPath) => {
    try {
        if (!localPath) return null

        const file = await cloudinary.uploader.upload(localPath,{
            resource_type: "auto",
        })

        fs.unlinkSync(localPath)
        return file
    } catch (error) {
        console.log("file failed to uploaded !", error)
        fs.unlinkSync(localPath)
        return null
    }
}

export { uploadOnCloudinary }