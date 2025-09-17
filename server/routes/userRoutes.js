import express from "express";
import {checkAuth, login, signup, updateProfile} from "../controllers/userController.js";
import { protectRoute } from "../middleware/auth.js";

const useRouter = express.Router();

useRouter.post("/signup", signup);
useRouter.post("/login", login);
useRouter.put("/update-profile", protectRoute, updateProfile);

// don't know if this is check-auth or check...
useRouter.get("/check-auth", protectRoute, checkAuth)

export default useRouter;