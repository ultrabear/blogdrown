import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store";
import { SessionLoading } from "../Layout/Session";
import { toRenderable } from "../markdown";
import "./NewPost.css";
import { preventDefault } from "../../rustAtHome";
import { ApiError } from "../../store/api";
import { createBlogPost } from "../../store/blogs";
import ResizingTextArea from "../ResizingTextArea";

export default function NewPost() {
	const [body, setBody] = useState("");
	const [title, setTitle] = useState("");
	const loading = useContext(SessionLoading);
	const [errs, setErrs] = useState<ApiError>();

	const session = useAppSelector((state) => state.session.user);
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	if (!loading && !session) {
		navigate("/");
	}

	const preview = toRenderable(body);

	const submit = async () => {
		const res = await dispatch(createBlogPost({ body, title })).unwrap();

		if (res instanceof ApiError) {
			setErrs(res);
		} else {
			navigate(`/blog/${res.id}`);
		}
	};

	return (
		<div className="NewPost link obvious">
			<h1 className="centered">Create a new post!</h1>

			<form onSubmit={preventDefault(submit)}>
				<span className="error">{errs ? errs.err.message : false}</span>
				<input
					className="centered titleInput"
					type="text"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					required
					minLength={6}
					maxLength={128}
					placeholder="Title"
				/>
				<span className="error">
					{errs?.err?.errors?.title ? errs.err.errors.title : false}
				</span>
				<ResizingTextArea
					minLength={16}
					maxLength={200_000}
					value={body}
					onChange={(e) => setBody(e.target.value)}
					required
					placeholder="Post Body"
				/>
				<span className="error">
					{errs?.err?.errors?.body ? errs.err.errors.body : false}
				</span>
				<h2 className="centered">
					<button type="submit">Post</button>
				</h2>
			</form>
			<h1 className="centered previewHeader">Preview</h1>
			<div className="HLine" />
			<h2 className="centered">{title}</h2>
			{preview}
		</div>
	);
}
