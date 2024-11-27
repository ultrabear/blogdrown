import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { type RootState, useAppDispatch, useAppSelector } from "../../store";
import { ApiError } from "../../store/api";
import { getOneBlog } from "../../store/blogs";
import { LoadingText } from "../Loading";
import "./BlogPost.css";
import { createSelector } from "@reduxjs/toolkit";
import { uploadComment } from "../../store/comments";
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
			/>
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
	const comment = useAppSelector((state) => state.comments[commentId]!);
	const author = useAppSelector((state) => state.users[comment.author_id]!);

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

function CommentBox({ postId }: { postId: string }) {
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

type LoadState = "no" | "yes" | ApiError;

function BlogPost() {
	const { postId } = useParams();

	const post = useAppSelector((state) =>
		postId ? state.blogPosts[postId] : undefined,
	);
	const author = useAppSelector((state) =>
		post ? state.users[post.owner_id] : undefined,
	);

	const rendered = post ? cachedMarkdoc(post.text) : undefined;

	const dispatch = useAppDispatch();
	const [loaded, setLoaded] = useState<LoadState>("no");

	useEffect(() => {
		(async () => {
			if (postId) {
				const res = await dispatch(getOneBlog(postId)).unwrap();

				if (res) {
					setLoaded(res);
				} else {
					setLoaded("yes");
				}
			}
		})();
	}, [dispatch, postId]);

	if (loaded instanceof ApiError) {
		return (
			<div className="error">
				Could not load post: {loaded.err.message} (Status {loaded.status})
			</div>
		);
	}

	if (!post || !author || !rendered) {
		return <LoadingText text="Loading" />;
	}

	const created_at = Intl.DateTimeFormat().format(new Date(post.created_at));

	return (
		<div className="BlogPost">
			<div className="metabox">
				<div>
					<div className="title">{post.title}</div>
					<div className="info">
						<span className="link">
							<Link to={`/author/${author.id}`}>{author.username}</Link>
						</span>
						<div className="date">{created_at}</div>
					</div>
				</div>
			</div>
			<p className="link obvious">
				{rendered}
				{post.partial ? <LoadingText text="" /> : false}
			</p>
			<CommentBox postId={post.id} />
		</div>
	);
}

export default BlogPost;
