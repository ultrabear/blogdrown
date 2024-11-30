import { createSelector } from "@reduxjs/toolkit";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import type { RootState } from "../../store";
import { getAll } from "../../store/blogs";
import "./index.css";
import { Link } from "react-router-dom";
import { cmp, reversed } from "../../rustAtHome";
import type { BlogPost } from "../../store/types";
import PostEditButtons from "../PostEditButtons";
import { toRenderable } from "../markdown";

const selectNewestPosts = createSelector(
	(state: RootState) => state.blogPosts,
	(posts) => {
		const arr = Object.values(posts).map((i) => i.id);

		return arr.sort(reversed<string>(cmp));
	},
);

const postSliver = createSelector(
	[(post: BlogPost) => post.text, (post: BlogPost) => post.id],
	(post, postId) => toRenderable(`${post.slice(0, 64)}[....](/blog/${postId})`),
);

function BlogTile({ blogId }: { blogId: string }) {
	const blogPost = useAppSelector((state) => state.blogPosts[blogId]);
	const session = useAppSelector((state) => state.session.user?.id);

	const author = useAppSelector((state) =>
		blogPost ? state.users[blogPost.owner_id] : undefined,
	);

	if (!blogPost || !author) {
		return <>Loading...</>;
	}

	const rendered = postSliver(blogPost);

	return (
		<Link to={`/blog/${blogPost.id}`}>
			<article className="BlogTile">
				<div className="title">{blogPost.title}</div>
				<div className="user link">
					<Link to={`/author/${author.id}`}>{author.username}</Link>
				</div>
				<p className="link obvious">{rendered}</p>
				{session === author.id && <PostEditButtons postId={blogId} />}
			</article>
		</Link>
	);
}

function HomePage() {
	const dispatch = useAppDispatch();
	const [loaded, setLoaded] = useState(false);

	const posts = useAppSelector(selectNewestPosts);

	if (!loaded) {
		setLoaded(true);

		dispatch(getAll());
	}

	return posts.map((id) => <BlogTile key={id} blogId={id} />);
}

export default HomePage;
