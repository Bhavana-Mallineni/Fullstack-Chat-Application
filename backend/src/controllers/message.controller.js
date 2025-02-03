import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io, getRoomId } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
	try {
		const loggedInUserId = req.user._id;
		const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

		res.status(200).json(filteredUsers);
	} catch (error) {
		console.log("Error in Getting Users For Sidebar", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const getMessages = async (req, res) => {
	try {
		const { id: userToChatId } = req.params;
		const myId = req.user._id;

		const messages = await Message.find({
			$or: [
				{ senderId: myId, receiverId: userToChatId },
				{ senderId: userToChatId, receiverId: myId }
			]
		});

		res.status(200).json(messages);
	} catch (error) {
		console.log("Error in Getting Messages", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const sendMessage = async (req, res) => {
	try {
		const { text, image } = req.body;
		const { id: receiverId } = req.params;
		const myId = req.user._id;

		let imageUrl;
		if (image) {
			const uploadResponse = await cloudinary.uploader.upload(image);
			imageUrl = uploadResponse.secure_url;
		}

		const newMessage = new Message({
			senderId: myId,
			receiverId,
			text,
			image: imageUrl
		});

		await newMessage.save();

		//realtime functionality goes here => socket.io
		// const receiverSocketId = getReceiverSocketId(receiverId);

		// if (receiverSocketId) {
		// 	io.to(receiverSocketId).emit("newMessage", newMessage);
		// }

		const roomId = getRoomId(myId, receiverId);
		io.to(roomId).emit("newMessage", newMessage);

		res.status(201).json(newMessage);
	} catch (error) {
		console.log("Error in Sending Message", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};
