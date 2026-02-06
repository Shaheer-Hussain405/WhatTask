import { app } from "./app";
import dotenv from "dotenv"
import { connectDB } from "./db/main";

dotenv.config({ path: "../.env" })

const port = process.env.PORT || 4400

connectDB()
.then(()=>{
    app.listen(port, ()=>{
        console.log("-:- Server is listning with port :",port)
    })
})
.catch((error)=>{
    console.log("_!_ Error while listning : ",error.message || error)
})