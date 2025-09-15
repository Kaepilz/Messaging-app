import User from "../models/User.js";
import bcrypt from "bcryptjs";

//Signup a new user
export const signup = async (req, res) => {
    const {fullName, email, password, bio} = req.body;

    try {
        if(!fullName || !email || !password || !bio){
            return res.json({success: false, message: "Missing Details"})
        }
        const user = await User.findOne({email});

        if(user){
            return res.json({success: false, message: "User already exists"})
        }
   const salt = await bcrypt.genSalt(10);
   const hashedPassword = await bcrypt.hash(password, salt);
   
   const newUser = await  User.create({
    fullName,
    email,
    password: hashedPassword,
    bio});

    } catch (error) {
        
    }
}