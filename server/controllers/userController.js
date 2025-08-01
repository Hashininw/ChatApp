import { generateToken } from '../lib/utils.js';
import User from '../models/User.js';
import bcrypt from 'bcrypt';
import cloudinary from '../lib/cloudinary.js';

//Signup a new user
export const signup =async(req, res)=>{
    const{fullName, email, password, bio}=req.body;
    try{
        if(!fullName || !email || !password || !bio){
            return res.json({success:false, message: "Missing required details"});

        }
        const user= await User.findOne({email});
        if(user){
            return res.json({success:false, message: "User already exists"});
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            fullName, email, password:hashedPassword, bio
        });

        const token= generateToken(newUser._id);

        res.json({success:true,userData:newUser, token,message:"User created successfully"});

    }catch(error){
        res.json({success:false, message:error.message});

    }
}

//Controller to login a user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email})
        if (!userData) {
            return res.json({ success: false, message: "Invalid credentials" });
}
        const isPasswordValid = await bcrypt.compare(password, userData.password);
        if(!isPasswordValid){
            return res.json({ success: false, message: "Invalid credencials" });
        }
        const token= generateToken(userData._id);
        res.json({success:true, userData, token,  message:"Logged in successfully"});

    }catch (error) {
        res.json({ success: false, message: error.message });
    }
  
}

//Controller to check if user is authenticated
export const checkAuth =(req, res)=>{
    res.json({success:true, user:req.user});
}
//Controller to get user details
export const updateProfile = async (req, res)=>{
    try{
        //console.log("Update profile called with:", req.body);//debugging
        const{profilePic, bio, fullName}=req.body;
        const userId = req.user._id;
        let updatedUser;

        if(!profilePic){
            updatedUser = await User.findByIdAndUpdate(userId,{bio, fullName}, {new:true});
        }else{
            console.log("Uploading image to Cloudinary"); // debugging
            const upload = await cloudinary.uploader.upload(profilePic);
            console.log("Image uploaded successfully"); // debugging
            updatedUser = await User.findByIdAndUpdate(userId, {profilePic:upload.secure_url, bio, fullName}, {new:true});
        }
        console.log("Profile updated:"); // debugging
        res.json({success:true, user:updatedUser});
        
    }catch(error){
        console.log("Error in updateProfile: ",error.message);
        res.status(500).json({success:false, message:error.message});
    }
}
        
