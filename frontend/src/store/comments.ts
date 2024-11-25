import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CommentSlice, Comment } from "./types";

const initialState: CommentSlice = {};

export const commentSlice = createSlice({
	name: "comments",
	initialState,
	reducers: {
		addComments: (state, action: PayloadAction<Comment[]>) => {
			for (const comm of action.payload) {
				state[comm.id] = comm;
			}
		},
	},
});

export default commentSlice.reducer;
