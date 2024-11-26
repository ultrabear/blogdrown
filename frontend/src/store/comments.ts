import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import type { Comment, CommentSlice } from "./types";
import type { GetComment } from "./api";

export function apiCommentToStore(c: GetComment): Comment {
	const { author, body, ...rest } = c;

	return {
		...rest,
		author_id: author.id,
		text: body,
	};
}

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
