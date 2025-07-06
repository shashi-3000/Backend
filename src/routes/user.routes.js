import { Router } from "express";
import { registerUser } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()

router.route("/register").post(
    upload([
    {
        name:"avatar",
        maxCount:1
    },{
        name: "coverImage",
        maxCount:1
    }
]),  
registerUser)  // to url kaisse bnega....... https//localhost:8000/users/reister

export default router