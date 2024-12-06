export type SessionUser = {
	id: string;
	username: string;
	email: string;
	created_at: string;
};

export type SessionSlice = {
	user: SessionUser | null;
	following: Record<string, true>;
};

export type User = {
	id: string;
	username: string;
};

export type UserSlice = Record<string, User>;

export type BlogPost = {
	id: string;
	title: string;
	norm: string;
	owner_id: string;
	created_at: string;
	updated_at: string;
	text: string;
	partial: boolean;
};

export type BlogPostSlice = Record<string, BlogPost>;

export type Comment = {
	id: string;
	author_id: string;
	post_id: string;
	text: string;
	created_at: string;
	updated_at: string;
};

export type CommentSlice = Record<string, Comment>;
