import { createSelector } from "@reduxjs/toolkit";
import { useState } from "react";
import { Link } from "react-router-dom";
import { type RootState, useAppDispatch, useAppSelector } from "../../store";
import type { ApiError } from "../../store/api";
import { uploadComment } from "../../store/comments";
import { LoadingText } from "../Loading";
import { cachedMarkdoc } from "../markdown";

type Ordering = -1 | 0 | 1;

function strCmp(a: string, b: string): Ordering {
	if (a > b) {
		return 1;
	}
	if (a < b) {
		return -1;
	}

	return 0;
}

function CreateCommentBox({ postId }: { postId: string }) {
	const [text, setText] = useState("");
	const [errs, setErrs] = useState<undefined | ApiError>(undefined);
	const dispatch = useAppDispatch();

	const postComment = async () => {
		const res = await dispatch(uploadComment({ postId, body: text })).unwrap();

		if (res) {
			setErrs(res);
		} else {
			setErrs(undefined);
			setText("");
		}
	};

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				postComment();
			}}
		>
			<input
				type="text"
				minLength={10}
				maxLength={1000}
				value={text}
				onChange={(e) => setText(e.target.value)}
				placeholder="Write your own comment!"
				required
			/>
			<span className="link obvious">
				<button type="submit" data-disabled={text.length < 10 ? "yes" : "no"}>
					Post
				</button>
			</span>
			<span className="error">
				{errs?.err?.errors?.body ? errs.err.errors.body : false}
			</span>
			<div className="error">{errs ? errs.err.message : false}</div>
		</form>
	);
}

const selectPostComments = createSelector(
	[
		(state: RootState) => state.comments,
		(_: RootState, postId: string) => postId,
	],
	(comments, postId) => {
		const c = Object.values(comments).filter((c) => c.post_id === postId);

		c.sort((a, b) => strCmp(b.id, a.id));

		return c.map((c) => c.id);
	},
);

function SingleComment({ commentId }: { commentId: string }) {
	const comment = useAppSelector((state) => state.comments[commentId]);
	const author = useAppSelector((state) =>
		comment ? state.users[comment.author_id] : undefined,
	);

	if (!comment || !author) {
		return <LoadingText />;
	}

	const commentText = cachedMarkdoc(comment.text);

	return (
		<div className="SingleComment">
			<div className="author link">
				<Link to={`/author/${comment.author_id}`}>{author.username}</Link>
			</div>
			{commentText}
		</div>
	);
}

export function CommentBox({ postId }: { postId: string }) {
	const comments = useAppSelector((s) => selectPostComments(s, postId));
	const session = useAppSelector((s) => s.session.user !== null);

	return (
		<div className="CommentBox">
			<div className="HLine" />
			<h1>Comments</h1>
			{session && <CreateCommentBox postId={postId} />}
			{comments.map((id) => (
				<SingleComment key={id} commentId={id} />
			))}
		</div>
	);
}
