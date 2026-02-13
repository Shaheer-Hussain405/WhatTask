import multer from "multer"

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null,"./public/temp")
    },
    filename: function(req, file , cb){
        cb(null, file.originalname + "-" + String(Math.floor(100 + Math.random() * 100)))
    }
})

export const upload = multer({ storage })