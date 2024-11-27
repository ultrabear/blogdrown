import {
	type PayloadAction,
	createAsyncThunk,
	createSlice,
} from "@reduxjs/toolkit";
import type { RootState } from ".";
import { type GetComment, api, catchError } from "./api";
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
	(
		{ postId, body }: { postId: string; body: string },
		{ dispatch, getState },
	) =>
		catchError(async () => {
			const ids = await api.blogs.comments.create(postId, { body });

			const state = getState() as RootState;
			const author_id = state.session.user!.id;

			dispatch(
				commentSlice.actions.addComments([
					{ ...ids, author_id, text: body, post_id: postId },
				]),
			);
		}),
);

export const editComment = createAsyncThunk(
	"comments/editComment",
	({ commentId, body }: { commentId: string; body: string }, { dispatch }) =>
		catchError(async () => {
			const ids = await api.blogs.comments.update(commentId, { body });

			dispatch(
				commentSlice.actions.editComment({
					updated_at: ids.updated_at,
					commentId,
					body,
				}),
			);
		}),
);

export const deleteComment = createAsyncThunk(
	"comments/deleteComment",
	(commentId: string, { dispatch }) =>
		catchError(async () => {
			await api.blogs.comments.delete(commentId);

			dispatch(commentSlice.actions.deleteComment({ commentId }));
		}),
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

		editComment: (
			state,
			action: PayloadAction<{
				updated_at: string;
				commentId: string;
				body: string;
			}>,
		) => {
			const { commentId, body, updated_at } = action.payload;

			if (commentId in state) {
				state[commentId]!.text = body;
				state[commentId]!.updated_at = updated_at;
			}
		},

		deleteComment: (state, action: PayloadAction<{ commentId: string }>) => {
			delete state[action.payload.commentId];
		},
	},
});

export default commentSlice.reducer;
