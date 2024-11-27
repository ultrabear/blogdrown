import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store";
import { ApiError } from "../../store/api";
import { getOneBlog } from "../../store/blogs";
import { LoadingText } from "../Loading";
import "./BlogPost.css";
import { cachedMarkdoc } from "../markdown";
import { CommentBox } from "./CommentBox";

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
