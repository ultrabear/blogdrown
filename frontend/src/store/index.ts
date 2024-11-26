import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import blogPostReducer from "./blogs";
import sessionReducer from "./session";
import userReducer from "./users";
import commentReducer from "./comments";

export const store = configureStore({
	reducer: {
		session: sessionReducer,
		blogPosts: blogPostReducer,
		users: userReducer,
		comments: commentReducer,
	},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
