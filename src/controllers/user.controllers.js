import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.models.js" 
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

// import { upload } from "../middlewares/multer.middleware.js"


// making function for refresh and access tokens
// const generateAccessAndRefreshTokens = async(userId)=>{
//     try{
//         const user=await User.findById(userId)
//         if (!user) {
//             throw new ApiError(404, "User not found while generating tokens");
//         }
//         const accessToken=user.generateAccessToken()
//         const refreshToken=user.generateRefreshToken()

//         user.refreshToken=refreshToken
//         await user.save({validationBeforeSave:false})

//         return {accessToken,refreshToken}

//     }
//     catch(error){
//         throw new ApiError(500,"Something went wrong while generating refresh and access tokens")
//     }
// }
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found while generating tokens");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        console.error("Token generation error:", error);
        throw new ApiError(500, "Something went wrong while generating refresh and access tokens");
    }
};




// REGISTER USER

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

    const {fullname,email,username,password} = req.body

    if(fullname===""){
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

    const existedUser = await User.findOne({
        $or: [{username},{email}]
    })

    //step 3
    if(existedUser){
        throw new ApiError(409,"User with this username or email already exists")
    }

    //file lena
    // const avatarLocalPath= req.files?.avatar[0]?.path
    // const coverImageLocalPath= req.files?.coverImage[0]?.path

    // console.log("REQ.FILES: ", req.files);

    const avatarFileArray = req.files?.avatar;
    const coverImageFileArray = req.files?.coverImage;

    if (!avatarFileArray || avatarFileArray.length === 0) {
        throw new ApiError(400, "Avatar is required");
    }

    const avatarLocalPath = avatarFileArray[0].path;
    const coverImageLocalPath = coverImageFileArray?.[0]?.path;

    // console.log("Avatar path:", avatarLocalPath);
    // console.log("Cover path:", coverImageLocalPath);



    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required");
    }
     
    const avatar=await uploadOnCloudinary(avatarLocalPath) 
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    
    if(!avatar){
        throw new ApiError(400,"Avatar is required");
    }
    // if(!avatar){
    //     throw new ApiError(400,"Avatar is required");
    // }

    const user = await User.create({
        fullname,
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

// LOGIN USER

const loginUser = asyncHandler(async(req,res)=>{
    //req body->data
    //usernsme or email if emoty error
    //find the user/email and not found error
    //password check
    //access token and refresh token
    //send cookies

    //step 1
    const {username,password,email}=req.body

    //step 2
    // if(!(username || email)){ //if u wanna login using either username or email but we wil ttaken both here
    if(!username && !email){
        throw new ApiError(400,"username or email is required")
    }

    //step 3
    const user=await User.findOne({
        $or:[{username},{email}]
    })
    if(!user){
        throw new ApiError(404,"user does not exist")
    }

    //step 4 - password
    const isPasswordValid=user.isPasswordCorrect(password)//ye argument wala password vo passwd h jo hmne req.body se lia h
    if(!isPasswordValid){
        throw new ApiError(404,"user does not exist")
    }

    //step 5 - tokens
    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

    //step 6
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "Uer logged In Successfully"
        )
    )

})

//LOGOUT USER
const logoutUser = asyncHandler(async(req,res)=>{
    //remove cookies
    //reset refresh tokens
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined,
            }
        },
        {
            new:true
        }
    )
    const options={
        httpOnly:true,
        secure:true
    }

    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options)
    .json(
        new ApiResponse(
            200,{},"User logged Out"
        )
    )

})

//endpoint for refersh token
const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorised request")
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_ACCESS_SECRET
        )
    
        const user= await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401,"Invalid Refresh Token")
        }
        if(incomingRefreshToken!== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
        const options={
            httpOnly:true,
            secure:true
        }
        const {accessToken,newRefreshToken}= await generateAccessAndRefreshTokens(user._id)
        return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",newRefreshToken,options).json(
            new ApiResponse(
                200,{accessToken,refreshToken: newRefreshToken}
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Refresh Token")
    }
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
 }