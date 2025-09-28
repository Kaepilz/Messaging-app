import { createContext, useContext, useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext(); // eslint-disable-line react-refresh/only-export-components

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});

    const { socket, axios } = useContext(AuthContext);

    // Function to get all users for sidebar
    const getUsers = async () => {
        try {
            const { data } = await axios.get("/api/messages/users");
            if (data.success) {
                setUsers(data.users);
                setUnseenMessages(data.unseenMessages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Function to get messages for selected user
    const getMessages = async (userId) => {
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) {
                setMessages(data.messages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Function to send message to selected user
    const sendMessage = async (messagesData) => {
        try {
            const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messagesData);
            if (data.success) {
                setMessages((prevMessages) => [...prevMessages, data.message]);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Use an effect hook to handle socket events and cleanup
    useEffect(() => {
        if (!socket) return;
        socket.on("newMessage", (newMessage) => {
            setSelectedUser(currentUser => {
                if (currentUser && newMessage.senderId === currentUser._id) {
                    setMessages((prevMessages) => [...prevMessages, newMessage]);
                    axios.put(`/api/messages/mark/${newMessage._id}`);
                } else {
                    setUnseenMessages((prevUnseenMessages) => ({
                        ...prevUnseenMessages,
                        [newMessage.senderId]: (prevUnseenMessages[newMessage.senderId] || 0) + 1
                    }));
                }
                return currentUser;
            });
        });

        return () => {
            if (socket) {
                socket.off("newMessage");
            }
        };
    }, [socket]);

    return (
        <ChatContext.Provider
            value={{
                messages,
                users,
                selectedUser,
                unseenMessages,
                getUsers,
                getMessages,
                sendMessage,
                setUnseenMessages,
                setSelectedUser,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};