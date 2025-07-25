import { Router } from "express";
import { loginUser,logoutUser, registerUser,refreshAccessToken } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([//middleware -> multer ka shyd
    {
        name:"avatar",
        maxCount:1
    },{
        name: "coverImage",
        maxCount:1
    }
]),  
registerUser)  // to url kaisse bnega....... https//localhost:8000/users/reister

//login 
router.route("/login").post(loginUser)
//logout -> aur yaha mai kuch krwana chata hu-> middleware se verify
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

export default router