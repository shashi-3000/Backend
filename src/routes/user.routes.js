import { Router } from "express";
import { registerUser } from "../controllers/user.controllers.js";
const router = Router()

router.route("/register").post(registerUser)  // to url kaisse bnega....... https//localhost:8000/users/reister

export default router