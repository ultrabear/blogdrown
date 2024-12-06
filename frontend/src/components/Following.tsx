import { createSelector } from "@reduxjs/toolkit";
import { useEffect } from "react";
import { cmp, reversed } from "../rustAtHome";
import { type RootState, useAppDispatch, useAppSelector } from "../store";
import { getAll } from "../store/blogs";
import { BlogTile } from "./HomePage/HomePage";

const selectFollowedPosts = createSelector(
	[
		(state: RootState) => state.session.following,
		(state: RootState) => state.blogPosts,
	],
	(following, posts) => {
		const arrPosts = Object.values(posts)
			.filter((p) => p.owner_id in following)
			.map((p) => p.id);

		arrPosts.sort(reversed<string>(cmp));

		return arrPosts;
	},
);

export default function Following() {
	const posts = useAppSelector(selectFollowedPosts);
	const dispatch = useAppDispatch();

	useEffect(() => {
		dispatch(getAll());
	}, [dispatch]);

	return (
		<div className="Following">
			<h2 className="centered">Following Feed</h2>
			{posts.map((id) => (
				<BlogTile key={id} blogId={id} />
			))}
		</div>
	);
}
