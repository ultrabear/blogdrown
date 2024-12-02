# BlogDrown
Drown in blogposts, markdown supported!


## API:
Base URL: `/api/v1`
### Types:
```ts
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
```
### Auth:
- login: POST /auth/login `Login` -> `AuthUser`
- signup: POST /auth/signup `Signup` -> `AuthUser`
- logout POST /auth/logout -> ` `
- session GET /auth -> `AuthUser`
### Blogs
- create: POST /blogs `NewBlogPost` -> `NewBlogPostRes`
- getOne: GET /blogs/one?id=`blogId` -> `GetPostRes`
- getAll: GET /blogs -> `GetAllPostsItem[]`
- update: PUT /blogs/`blogId` `UpdateBlogPost` -> `Updated`
- delete: DELETE /blogs/`blogId` -> ` `
### Comments
- create: POST /blogs/`blogId`/comments `PostComment` -> `IdAndTimestamps`
- update: PUT /comments/`commentId` `PostComment` -> `Updated`
- delete: DELETE /comments/`commentId` -> ` `
