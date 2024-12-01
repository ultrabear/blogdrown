import { createSelector } from "@reduxjs/toolkit";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { cmp, reversed } from "../../rustAtHome";
import { type RootState, useAppDispatch, useAppSelector } from "../../store";
import { getAll } from "../../store/blogs";
import { BlogTile } from "../HomePage/HomePage";

const selectArtistPosts = createSelector(
	[
		(state: RootState) => state.blogPosts,
		(_: RootState, ownerId: string | undefined) => ownerId,
	],
	(posts, ownerId) => {
		const ids = Object.values(posts)
			.filter((p) => p.owner_id === ownerId)
			.map((p) => p.id);

		return ids.sort(reversed<string>(cmp));
	},
);

function AuthorPage() {
	const dispatch = useAppDispatch();

	const { authorId } = useParams();

	const posts = useAppSelector((state) => selectArtistPosts(state, authorId));
	const artist = useAppSelector((state) =>
		authorId ? state.users[authorId] : undefined,
	);

	useEffect(() => {
		dispatch(getAll());
	}, [dispatch]);

	return (
		<>
			<h1 className="centered">
				Posts by{" "}
				{artist?.username || <span className="error">User Not Found</span>}
			</h1>
			{posts.map((id) => (
				<BlogTile key={id} blogId={id} />
			))}
		</>
	);
}

export default AuthorPage;
