import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app = express()

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true
    })
)

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ limit: "16kb", extended:true}))
app.use(express.static("/public"))
app.use(cookieParser())

// Routes
import userRoute from "./routes/user.route.js"
import taskRoute from "./routes/task.route.js"
import stickyRoute from "./routes/stickyChit.route.js"

app.use("/api/v3/user", userRoute)
app.use("/api/v3/task", taskRoute)
app.use("/api/v3/sticky", stickyRoute)

export { app }