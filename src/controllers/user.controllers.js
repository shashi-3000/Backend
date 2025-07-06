import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.models.js" 
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

// import { upload } from "../middlewares/multer.middleware.js"

const registerUser = asyncHandler(async(req,res)=>{
    // res.status(200).json({
    //     message:"ok"
    // })

    //steps to register

    //step 1: taking data from frotnend 
    //step 2: validation - not empty
    //step 3: check if user already exist (email or username ki help se)
    //step 4: check for images and then check for avatar
    //step 5: upload them to cloudinary ---> yaha vaise b response return me URL milta . Also check successfully avatar upload hua ki ni
    //step 6: create user object - create entry in db    (keep in mind ki ek baar user create hogya to response me as is it mil jata to passwd b mil jata bhle hi encrypted h isliye remove krna pdta)
    //step 7:remove passwd and refresh token field from response
    //step 8:check for user creation response and agr hogya h to return respinse and nhi hua to error bhejo

    const {fullName,email,username,password} = req.body

    if(fullName===""){
        throw new ApiError(400,"fullName is required");
    }
    if(email===""){
        throw new ApiError(400,"email is required");
    }
    if(username===""){
        throw new ApiError(400,"username is required");
    }
    if(password===""){
        throw new ApiError(400,"password is required");
    }

    const existedUser = User.findOne({
        $or: [{username},{email}]
    })

    //step 3
    if(existedUser){
        throw new ApiError(409,"User with this username or email already exists")
    }

    //file lena
    const avatarLocalPath= req.files?.avatar[0]?.path
    const coverImageLocalPath= req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required");
    }
     
    const avatar=await uploadOnCloudinary(avatarLocalPath) 
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    
    if(!avatar){
        throw new ApiError(400,"Avatar is required");
    }
    if(!avatar){
        throw new ApiError(400,"Avatar is required");
    }

    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser = User.findById(user._id).select("-password -refreshToken")

    if(!createdUser){
        throw new ApiError(509 , "Something went wrong while registering the user") 
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )

})

export {
    registerUser,
 }