import mongoose, {mongo, Schema} from "mongoose";

const subscriptionSchema = new Schema(
    {
        subscriber:{
            type:Schema.Types.ObjectId, //one who is subcribing
            ref:"User"
        },
        channel:{
            type:Schema.Types.ObjectId, //one to who subscriber subscribes
            ref:"User"
        }
    },
    {
        timestamps:true
    }
);



export const Subscription = mongoose.model("Subscription",subscriptionSchema)