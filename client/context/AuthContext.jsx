import { createContext, useCallback, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";


const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext(); // eslint-disable-line react-refresh/only-export-components
export const AuthProvider = ({ children }) => {

    const [token, setToken] = useState(localStorage.getItem("token"));
    const [authUser, setAuthUser] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [socket, setSocket] = useState(null);

    //Connect socket function to handle socket connection and online users updates
    const connectSocket = useCallback((userData) => {
        if (userData) {
            setSocket(prevSocket => {
                if (prevSocket?.connected) {
                    return prevSocket;
                }
                const newSocket = io(backendUrl, {
                    query: {
                        userId: userData._id,
                    },
                });
                newSocket.on("getOnlineUsers", (userIds) => {
                    setOnlineUsers(userIds);
                });
                return newSocket;
            });
        }
    }, [backendUrl]);

    useEffect(() => {
        if (token) {
            const checkAuth = async () => {
                try{
                    setIsLoading(true);
                    axios.defaults.headers.common["token"] = token;
                    const { data } = await axios.get("/api/auth/check");
                    if(data.success) {
                        setAuthUser(data.user);
                        connectSocket(data.user);
                    }
                } catch(error) {
                    // It's okay to fail silently here if the token is invalid
                } finally{
                    setIsLoading(false);
                }
            };
            checkAuth();
        } else {
            setIsLoading(false);
        }
    }, [token, connectSocket]);

    //Login function to handle user authentication and socket connection
    const login = async (state, credentials) => {
        try{
            setIsLoading(true);
            const { data } = await axios.post(`/api/auth/${state}`, credentials);
            if(data.success){
             const user = data.user || data.userData;
             setAuthUser(user);
             connectSocket(user);
             axios.defaults.headers.common["token"] = data.token;
             setToken(data.token);
             localStorage.setItem("token", data.token);
             toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch(error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    }

    //Logout function to handle user logout and socket disconnection
    const logout = async () => {
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUsers([]);
        axios.defaults.headers.common["token"] = null;
        toast.success("Logged out successfully"); 
        if (socket) socket.disconnect();
    }

    //Update profile function to handle user profile updates
    const updateProfile = async (body) => {
        try{
            setIsLoading(true);
            const { data } = await axios.put("/api/auth/update-profile", body);
            if(data.success){
                setAuthUser(prev => ({ ...prev, ...data.user }));
                toast.success("Profile updated successfully");
            }
            } catch (error) {
                toast.error(error.message);
            } finally {
                setIsLoading(false);
            }
    }

    const value = {
        axios,
        authUser,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile,
        isLoading
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}