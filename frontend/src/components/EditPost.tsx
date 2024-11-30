import { useContext, useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { preventDefault } from "../rustAtHome";
import { useAppDispatch, useAppSelector } from "../store";
import { ApiError } from "../store/api";
import { editBlogPost, getOneBlog } from "../store/blogs";
import { SessionLoading } from "./Layout/Session";
import { LoadingText } from "./Loading";
import ResizingTextArea from "./ResizingTextArea";
import { toRenderable } from "./markdown";

type FetchStatus = "consumed" | boolean | ApiError;

export default function EditPost() {
	const { postId } = useParams();

	const post = useAppSelector((state) =>
		postId ? state.blogPosts[postId] : undefined,
	);

	const [body, setBody] = useState("");
	const loading = useContext(SessionLoading);
	const [errs, setErrs] = useState<ApiError>();

	const session = useAppSelector((state) => state.session.user);
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const [fetchState, setFetchState] = useState<FetchStatus>(false);

	useEffect(() => {
		(async () => {
			if (postId) {
				const res = await dispatch(getOneBlog(postId)).unwrap();

				if (res) {
					setFetchState(res);
				} else {
					setFetchState(true);
				}
			}
		})();
	}, [dispatch, postId]);

	useLayoutEffect(() => {
		if (fetchState === true) {
			setFetchState("consumed");
			if (post) {
				setBody(post.text);
			}
		}
	}, [fetchState, post]);

	if (fetchState instanceof ApiError) {
		const error = fetchState;
		return (
			<div className="error">
				Could not load post: {error.err.message} (Status {error.status})
			</div>
		);
	}

	if (!loading && !session) {
		navigate("/");
	}

	if (!fetchState || !post) {
		return <LoadingText text="Loading" />;
	}

	const preview = toRenderable(body);

	const submit = async () => {
		if (postId) {
			const res = await dispatch(editBlogPost({ body, id: postId })).unwrap();

			if (res instanceof ApiError) {
				setErrs(res);
			} else {
				navigate(`/blog/${postId}`);
			}
		}
	};

	return (
		<div className="NewPost link obvious">
			<h1 className="centered">Edit Post</h1>

			<form onSubmit={preventDefault(submit)}>
				<span className="error">{errs ? errs.err.message : false}</span>
				<h2 className="centered">{post.title}</h2>
				<span className="weak">(You cannot retitle your blog post.)</span>
				<ResizingTextArea
					minLength={16}
					maxLength={200_000}
					value={body}
					onChange={(e) => setBody(e.target.value)}
					required
					placeholder="Body"
				/>
				<span className="error">
					{errs?.err?.errors?.body ? errs.err.errors.body : false}
				</span>
				<h2 className="centered">
					<button type="submit">Edit</button>
				</h2>
			</form>
			<h1 className="centered previewHeader">Preview</h1>
			<div className="HLine" />
			<h2 className="centered">{post.title}</h2>
			{preview}
		</div>
	);
}
