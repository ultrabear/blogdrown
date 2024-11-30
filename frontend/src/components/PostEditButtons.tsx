import { Link, useNavigate } from "react-router-dom";
import { preventDefault } from "../rustAtHome";
import { useAppDispatch } from "../store";
import { deleteBlogPost } from "../store/blogs";
import { type Closer, ModalButton } from "./Layout/Modal";

function DeleteConfirm({ postId }: Closer & { postId: string }) {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const deleteEvent = async () => {
		await dispatch(deleteBlogPost(postId));

		navigate("/");
	};

	return (
		<form
			className="AuthForm link obvious"
			onSubmit={preventDefault(deleteEvent)}
		>
			<h1>Delete Post</h1>
			Are you sure?
			<span className="error">This action cannot be undone.</span>
			<button type="submit">I'm sure, Delete</button>
		</form>
	);
}

export default function PostEditButtons({ postId }: { postId: string }) {
	const root = document.querySelector("body #authNode")!;

	return (
		<div
			className="PostEditButtons link obvious"
			style={{ paddingBottom: "10px", display: "flex" }}
		>
			<Link to="./edit" relative="path">
				Edit
			</Link>
			<span className="delete">
				<ModalButton
					Component={DeleteConfirm}
					root={root}
					extraProps={{ postId }}
				>
					Delete
				</ModalButton>
			</span>
		</div>
	);
}
