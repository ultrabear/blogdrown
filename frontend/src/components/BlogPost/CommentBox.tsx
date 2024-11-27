import { createSelector } from "@reduxjs/toolkit";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { type RootState, useAppDispatch, useAppSelector } from "../../store";
import type { ApiError } from "../../store/api";
import {
	deleteComment,
	editComment,
	uploadComment,
} from "../../store/comments";
import { LoadingText } from "../Loading";
import { cachedMarkdoc } from "../markdown";

type Ordering = -1 | 0 | 1;

function strCmp(a: string, b: string): Ordering {
	if (a > b) return 1;
	if (a < b) return -1;

	return 0;
}

const COMMENT_MIN = 10;
const COMMENT_MAX = 1000;

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
		<div className="CreateCommentBox">
			<form
				onSubmit={(e) => {
					e.preventDefault();
					postComment();
				}}
			>
				<input
					type="text"
					minLength={COMMENT_MIN}
					maxLength={COMMENT_MAX}
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
		</div>
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

interface HasDefaultPrevention {
	preventDefault(): void;
}

function preventDefault<T>(f: () => T): (e: HasDefaultPrevention) => T {
	return (e) => {
		e.preventDefault();
		return f();
	};
}

function CommentEdit({
	commentId,
	close,
}: { commentId: string; close: () => void }) {
	const commentText = useAppSelector(
		(state) => state.comments[commentId]!.text,
	);

	const [text, setText] = useState(commentText);

	const [errs, setErrs] = useState<undefined | ApiError>(undefined);
	const dispatch = useAppDispatch();

	useEffect(() => {
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				close();
			}
		};

		document.addEventListener("keydown", handleEsc);

		return () => {
			document.removeEventListener("keydown", handleEsc);
		};
	});

	const submit = async () => {
		const res = await dispatch(editComment({ commentId, body: text })).unwrap();

		if (res) {
			setErrs(res);
		} else {
			setErrs(undefined);
			close();
		}
	};

	return (
		<form onSubmit={preventDefault(submit)} className="link obvious">
			<input
				type="text"
				value={text}
				onChange={(e) => setText(e.target.value)}
				minLength={COMMENT_MIN}
				maxLength={COMMENT_MAX}
			/>
			<button type="submit">Edit</button>
			<button type="button" onClick={preventDefault(close)}>
				Cancel
			</button>
			<span className="error">
				{errs?.err?.errors?.body ? errs.err.errors.body : false}
			</span>
			<div className="error">{errs ? errs.err.message : false}</div>
		</form>
	);
}

function SingleComment({ commentId }: { commentId: string }) {
	const comment = useAppSelector((state) => state.comments[commentId]);
	const author = useAppSelector((state) =>
		comment ? state.users[comment.author_id] : undefined,
	);
	const sessionId = useAppSelector((state) => state.session.user?.id);
	const dispatch = useAppDispatch();

	const [editing, setEditing] = useState(false);

	if (!comment || !author) {
		return <LoadingText />;
	}

	const commentText = cachedMarkdoc(comment.text);

	return (
		<div className="SingleComment">
			<div className="author link">
				<Link to={`/author/${comment.author_id}`}>{author.username}</Link>
			</div>
			{editing ? (
				<CommentEdit commentId={commentId} close={() => setEditing(false)} />
			) : (
				<>
					<div className="link obvious">{commentText}</div>
					{sessionId === author.id && (
						<div className="link obvious">
							<button
								type="button"
								onClick={preventDefault(() => setEditing(true))}
							>
								Edit
							</button>
							<button
								type="button"
								onClick={preventDefault(() =>
									dispatch(deleteComment(commentId)),
								)}
							>
								Delete
							</button>
						</div>
					)}
				</>
			)}
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
			<div className="Spacer" />
			{comments.map((id) => (
				<SingleComment key={id} commentId={id} />
			))}
		</div>
	);
}
