import { useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store";
import React, { type ReactNode, useEffect, useState } from "react";
import { getOneBlog } from "../../store/blogs";
import { ApiError } from "../../store/api";
import { LoadingText } from "../Loading";
import Markdoc from "@markdoc/markdoc";
import { createSelector } from "@reduxjs/toolkit";
import "./BlogPost.css";

function toRenderable(text: string): ReactNode {
	return Markdoc.renderers.react(Markdoc.transform(Markdoc.parse(text)), React);
}

const cachedMarkdoc = createSelector(
	(text: string) => text,
	(postText) => toRenderable(postText),
);

function CommentBox({ postId: _ }: { postId: string }) {
	return <></>;
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
		return <LoadingText />;
	}

	return (
		<div className="BlogPost">
			<div className="metabox">
				<div>
					<div className="title">{post.title}</div>
					<div className="info">
						{author.username}
						<div className="date">
							{new Date(post.created_at).toLocaleDateString()}
						</div>
					</div>
				</div>
			</div>
			<p>{rendered}</p>
			<CommentBox postId={post.id} />
		</div>
	);
}

export default BlogPost;
