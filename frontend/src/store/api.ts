const BASE_URL = "/api/v1";

export type Error = { message: string; errors: Record<string, string> };

export type Username = string;
export type Email = string;
export type UserId = string;

export type MinUser = { id: UserId; username: Username };
export type AuthUser = MinUser & { email: Email; created_at: string };
export type Login = { email: Email; password: string };
export type Signup = Login & { username: Username };

export type IdAndTimestamps = {
	id: string;
	created_at: string;
	updated_at: string;
};

export type NewBlogPost = { title: string; body: string };

export type NewBlogPostRes = IdAndTimestamps & {
	title_norm: string;
};

export type GetAllPostsItem = IdAndTimestamps & {
	title_norm: string;
	title: string;
	partial_body: string;
	user: MinUser;
};

export type GetPostRes = IdAndTimestamps & {
	title_norm: string;
	title: string;
	body: string;
	user: MinUser;
	comments: GetComment[];
};

export type GetComment = IdAndTimestamps & {
	post_id: string;
	author: MinUser;
	body: string;
};

export type PostComment = {
	body: string;
};

export type UpdateBlogPost = {
	body: string;
};

export type Updated = {
	updated_at: string;
};

export type FollowList = { users: MinUser[] };

export class ApiError {
	constructor(
		public err: Error,
		public status: number,
	) {
		Object.seal(this);
	}
}

async function jpost<T>(route: string, body: object): Promise<T> {
	const resp = await fetch(`${BASE_URL}${route}`, {
		headers: {
			"Content-Type": "application/json",
		},
		method: "POST",
		body: JSON.stringify(body),
	});

	if (!resp.ok) {
		throw new ApiError(await resp.json(), resp.status);
	}

	return await resp.json();
}

async function jput(route: string, body: object): Promise<Updated> {
	const resp = await fetch(`${BASE_URL}${route}`, {
		headers: {
			"Content-Type": "application/json",
		},
		method: "PUT",
		body: JSON.stringify(body),
	});

	if (!resp.ok) {
		throw new ApiError(await resp.json(), resp.status);
	}

	return await resp.json();
}

async function notNull<T>(v: Promise<T | null>): Promise<T> {
	const resolved = await v;

	if (resolved == null) {
		throw Error("Unexpected null in notNull assertion");
	}

	return resolved;
}

async function datalessfetch<T>(
	route: string,
	method: "GET" | "DELETE" | "POST" | "PUT",
): Promise<T | null> {
	const resp = await fetch(`${BASE_URL}${route}`, {
		method,
	});

	if (!resp.ok) {
		throw new ApiError(await resp.json(), resp.status);
	}

	try {
		return await resp.json();
	} catch (_e) {
		return null;
	}
}

export async function catchError(
	cb: () => Promise<void>,
): Promise<undefined | ApiError>;

export async function catchError<T>(
	cb: () => Promise<T>,
): Promise<T | ApiError>;

export async function catchError<T>(
	cb: () => Promise<T>,
): Promise<T | ApiError> {
	try {
		return await cb();
	} catch (e) {
		if (e instanceof ApiError) {
			return e;
		}
		throw e;
	}
}

export const api = {
	auth: {
		login: async (login: Login): Promise<AuthUser> => {
			return await jpost("/auth/login", login);
		},
		signup: async (signup: Signup): Promise<AuthUser> => {
			return await jpost("/auth/signup", signup);
		},
		logout: async (): Promise<void> => {
			await datalessfetch("/auth/logout", "POST");
		},
		session: async (): Promise<AuthUser> => {
			return await notNull(datalessfetch("/auth", "GET"));
		},
	},
	blogs: {
		create: async (blog: NewBlogPost): Promise<NewBlogPostRes> => {
			return await jpost("/blogs", blog);
		},
		getOne: async (blogId: string): Promise<GetPostRes> => {
			return await notNull(
				datalessfetch(`/blogs/one?id=${encodeURIComponent(blogId)}`, "GET"),
			);
		},
		getAll: async (): Promise<GetAllPostsItem[]> => {
			return await notNull(datalessfetch("/blogs", "GET"));
		},
		update: async (
			blogId: string,
			update: UpdateBlogPost,
		): Promise<Updated> => {
			return await jput(`/blogs/${encodeURIComponent(blogId)}`, update);
		},

		delete: async (blogId: string): Promise<void> => {
			await datalessfetch(`/blogs/${encodeURIComponent(blogId)}`, "DELETE");
		},

		comments: {
			create: async (
				blogId: string,
				data: PostComment,
			): Promise<IdAndTimestamps> => {
				return await jpost(
					`/blogs/${encodeURIComponent(blogId)}/comments`,
					data,
				);
			},

			update: async (
				commentId: string,
				update: PostComment,
			): Promise<Updated> => {
				return await jput(`/comments/${encodeURIComponent(commentId)}`, update);
			},
			delete: async (commentId: string): Promise<void> => {
				await datalessfetch(
					`/comments/${encodeURIComponent(commentId)}`,
					"DELETE",
				);
			},
		},
	},

	following: {
		addFollow: async (userId: string): Promise<void> => {
			await datalessfetch(`/follows/${encodeURIComponent(userId)}`, "POST");
		},

		removeFollow: async (userId: string): Promise<void> => {
			await datalessfetch(`/follows/${encodeURIComponent(userId)}`, "DELETE");
		},

		getFollows: async (): Promise<FollowList> => {
			return await notNull(datalessfetch("/follows", "GET"));
		},
	},
};
