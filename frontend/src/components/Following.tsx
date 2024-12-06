import { createSelector } from "@reduxjs/toolkit";
import { useAppDispatch, useAppSelector, type RootState } from "../store";
import { cmp, reversed } from "../rustAtHome";
import { BlogTile } from "./HomePage/HomePage";
import { useEffect } from "react";
import { getAll } from "../store/blogs";

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
