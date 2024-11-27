import { type Closer, ModalButton } from "../Layout/Modal";

function SignupForm({ close: _ }: Closer) {
	return <h1>Signup form data </h1>;
}

function LoginForm({ close: _ }: Closer) {
	return <h1>Login form data </h1>;
}

function ProfileNav() {
	const node = document.querySelector("body #authNode");

	if (!node) {
		throw new Error("expected body #authNode to exist in document tree");
	}

	return (
		<div className="ProfileNav">
			<ModalButton Component={LoginForm} root={node}>
				Login
			</ModalButton>
			<ModalButton Component={SignupForm} root={node}>
				Signup
			</ModalButton>
		</div>
	);
}

export default ProfileNav;
