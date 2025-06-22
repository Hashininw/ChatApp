import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import {io, userSocketMap} from "../server.js";


//Get all users except the logged in user
export const getUsersForSidebar = async(req,res)=>{
    try{
        const userId = req.user._id;
        const filteredUsers = await User.find({_id: {$ne: userId}}).select("-password");

        // Count number of unseen messages
        const unseenMessages={}
        const promises = filteredUsers.map(async (user) => {
            const messages = await Message.find({sender:user._id, receiverId:userId, seen:false})
            if(messages.length>0){
                unseenMessages[user._id] = messages.length;
            }
        })
        await Promise.all(promises);
        res.json({success:true, users:filteredUsers, unseenMessages});

    }catch(error){
        console.log(error.message);
        res.json({success:false, message:error.message});

    }
}

//Get all messages for selected user
export const getMessages = async (req, res) => {
    try{
        const{id:selectedUserId} = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { sender: myId, receiverId: selectedUserId },
                { sender: selectedUserId, receiverId: myId }
            ]
        })

        await Message.updateMany({
            sender: selectedUserId,
            receiverId: myId,
        }, { seen: true });

        res.json({success:true, messages:messages
        })

    }catch(error){
        console.log(error.message);
        res.json({success:false, message:error.message});
    }
}

//api to mark messages as seen using message id

export const markMessagesAsSeen = async (req, res) => {
    try {
        const { id } = req.params;
        await Message.findByIdAndUpdate(id, { seen: true });
        res.json({success:true})

    }catch (error) {
        console.log(error.message);
        res.json({success:false, message:error.message});
    }
}
// Send message to selected user
export const sendMessage = async (req, res) => {
    try{
        const{text, image} = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;
            
        let imageUrl;
        if(image){
            const upload = await cloudinary.uploader.upload(image);
            imageUrl = upload.secure_url;

        }const newMessage = await Message.create({
            sender:senderId,
            receiverId,
            text,
            image:imageUrl
        })

        //Emit the new message to the receiver's socket
        const receiverSocketId = userSocketMap[receiverId];
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }
        
        res.json({success:true, newMessage});

    }catch (error) {
        console.log(error.message);
        res.json({success:false, message:error.message});
    }
}