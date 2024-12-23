import { createSelector } from "@reduxjs/toolkit";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { cmp, preventDefault, reversed } from "../../rustAtHome";
import { type RootState, useAppDispatch, useAppSelector } from "../../store";
import { getAll } from "../../store/blogs";
import { addFollow, removeFollow } from "../../store/session";
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

	const session = useAppSelector((state) => state.session.user);
	const isFollowing = useAppSelector((state) =>
		authorId ? state.session.following[authorId] || false : false,
	);

	useEffect(() => {
		dispatch(getAll());
	}, [dispatch]);

	const unfollow = () => {
		dispatch(removeFollow(authorId!));
	};

	const follow = () => {
		dispatch(addFollow(authorId!));
	};

	return (
		<div className="AuthorPage">
			<h1 className="centered">
				Posts by{" "}
				{artist?.username || <span className="error">User Not Found</span>}
			</h1>
			{session && artist && session.id !== artist.id ? (
				<>
					<div className="centered link obvious" style={{ fontSize: "1.5em" }}>
						{isFollowing ? (
							<button type="button" onClick={preventDefault(unfollow)}>
								Unfollow
							</button>
						) : (
							<button type="button" onClick={preventDefault(follow)}>
								Follow
							</button>
						)}
					</div>
				</>
			) : (
				false
			)}
			{session && artist?.id === session.id && (
				<div className="centered link obvious">
					<Link to="/blog/new">
						{posts.length === 0
							? "Upload your first post!"
							: "Upload a new post!"}
					</Link>
				</div>
			)}
			{posts.map((id) => (
				<BlogTile key={id} blogId={id} />
			))}
		</div>
	);
}

export default AuthorPage;
