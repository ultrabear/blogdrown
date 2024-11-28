import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { preventDefault } from "../../rustAtHome";
import { useAppDispatch, useAppSelector } from "../../store";
import type { ApiError, Login, Signup } from "../../store/api";
import {
	sessionLogin,
	sessionLogout,
	sessionSignup,
} from "../../store/session";
import { type Closer, ModalButton } from "../Layout/Modal";
import { SessionLoading } from "../Layout/Session";
import { LoadingText } from "../Loading";

function SignupForm({ close }: Closer) {
	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [errs, setErrs] = useState<undefined | ApiError>();
	const dispatch = useAppDispatch();

	const signupLocal = async (signupData: Signup) => {
		const res = await dispatch(sessionSignup(signupData)).unwrap();

		if (res) {
			setErrs(res);
		} else {
			close();
		}
	};

	const submit = async () => {
		await signupLocal({ email, username, password });
	};

	return (
		<form
			className="AuthForm"
			onSubmit={(e) => {
				e.preventDefault();
				submit();
			}}
		>
			<h2>Sign Up</h2>
			{errs && <span className="error">{errs.err.message}</span>}

			<input
				type="email"
				placeholder="email"
				value={email}
				minLength={2}
				required
				onChange={(e) => setEmail(e.target.value)}
			/>
			{errs?.err?.errors?.email && (
				<span className="error">{errs.err.errors.email}</span>
			)}
			<input
				type="text"
				placeholder="username"
				value={username}
				minLength={4}
				required
				onChange={(e) => setUsername(e.target.value)}
			/>
			{errs?.err?.errors?.username && (
				<span className="error">{errs.err.errors.username}</span>
			)}
			<input
				type="password"
				placeholder="password"
				value={password}
				minLength={2}
				required
				onChange={(e) => setPassword(e.target.value)}
			/>
			{errs?.err?.errors?.password && (
				<span className="error">{errs.err.errors.password}</span>
			)}

			<span className="link obvious">
				<button type="submit">Sign Up</button>
			</span>
		</form>
	);
}

function LoginForm({ close }: Closer) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [errs, setErrs] = useState<undefined | ApiError>();
	const dispatch = useAppDispatch();

	const loginLocal = async (loginData: Login) => {
		const res = await dispatch(sessionLogin(loginData)).unwrap();

		if (res) {
			setErrs(res);
		} else {
			close();
		}
	};

	const submit = async () => {
		await loginLocal({ email, password });
	};

	return (
		<form
			className="AuthForm"
			onSubmit={(e) => {
				e.preventDefault();
				submit();
			}}
		>
			<h2>Log In</h2>
			{errs && <span className="error">{errs.err.message}</span>}

			<input
				type="email"
				placeholder="email"
				value={email}
				minLength={2}
				required
				onChange={(e) => setEmail(e.target.value)}
			/>
			{errs?.err?.errors?.email && (
				<span className="error">{errs.err.errors.email}</span>
			)}
			<input
				type="password"
				placeholder="password"
				value={password}
				minLength={2}
				required
				onChange={(e) => setPassword(e.target.value)}
			/>
			{errs?.err?.errors?.password && (
				<span className="error">{errs.err.errors.password}</span>
			)}

			<span className="link obvious">
				<button type="submit">Log In</button>
			</span>
		</form>
	);
}

function ProfileNav() {
	const node = document.querySelector("body #authNode");

	const session = useAppSelector((state) => state.session.user);
	const dispatch = useAppDispatch();
	const loading = useContext(SessionLoading);

	if (!node) {
		throw new Error("expected body #authNode to exist in document tree");
	}

	const logout = () => {
		dispatch(sessionLogout());
	};

	if (loading) {
		return (
			<div className="ProfileNav">
				<LoadingText text="" />
			</div>
		);
	}

	return (
		<div className="ProfileNav">
			{session ? (
				<>
					<div className="link obvious author">
						<Link to={`/author/${session.id}`}>{session.username}</Link>
					</div>
					<div className="link obvious">
						<Link to="/blog/new">New Post</Link>
					</div>
					<div className="link obvious">
						<button type="button" onClick={preventDefault(logout)}>
							Logout
						</button>
					</div>
				</>
			) : (
				<>
					<ModalButton Component={LoginForm} root={node}>
						Login
					</ModalButton>
					<ModalButton Component={SignupForm} root={node}>
						Signup
					</ModalButton>
				</>
			)}
		</div>
	);
}

export default ProfileNav;
