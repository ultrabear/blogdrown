import {
	type PayloadAction,
	createAsyncThunk,
	createSlice,
} from "@reduxjs/toolkit";
import type { RootState } from ".";
import { ApiError, type GetComment, api } from "./api";
import type { Comment, CommentSlice } from "./types";

export function apiCommentToStore(c: GetComment): Comment {
	const { author, body, ...rest } = c;

	return {
		...rest,
		author_id: author.id,
		text: body,
	};
}

export const uploadComment = createAsyncThunk(
	"comments/uploadComment",
	async (
		{ postId, body }: { postId: string; body: string },
		{ dispatch, getState },
	) => {
		try {
			const ids = await api.blogs.comments.create(postId, { body });

			const state = getState() as RootState;
			const author_id = state.session.user!.id;

			dispatch(
				commentSlice.actions.addComments([
					{ ...ids, author_id, text: body, post_id: postId },
				]),
			);
		} catch (e) {
			if (e instanceof ApiError) {
				return e;
			}
			throw e;
		}
	},
);

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
