import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../store";
import { SessionLoading } from "../Layout/Session";
import { toRenderable } from "../markdown";
import "./NewPost.css";
import { preventDefault } from "../../rustAtHome";
import ResizingTextArea from "../ResizingTextArea";

export default function NewPost() {
	const [body, setBody] = useState("");
	const loading = useContext(SessionLoading);

	const session = useAppSelector((state) => state.session.user);
	const navigate = useNavigate();

	if (!loading && !session) {
		return navigate("/");
	}

	const preview = toRenderable(body);

	const submit = () => {};

	return (
		<div className="NewPost link obvious">
			<h1 className="centered">Create a new post!</h1>

			<form onSubmit={preventDefault(submit)}>
				<ResizingTextArea
					minLength={48}
					maxLength={100_000}
					value={body}
					onChange={(e) => setBody(e.target.value)}
					required
				/>
				<h2 className="centered">
					<button type="submit">Post</button>
				</h2>
			</form>
			<h1 className="centered">Preview</h1>
			{preview}
		</div>
	);
}
