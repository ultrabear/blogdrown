GET {{hurlin-async}}./login2.hurl
HTTP 200
[Captures]
await: jsonpath "$.await"


GET {{hurlin-import}}./login.hurl
HTTP 200
[Captures]
email: jsonpath "$.email"
password: jsonpath "$.password"

POST {{api}}/auth/login
{
  "email": "{{email}}",
  "password": "{{password}}"
}
HTTP 200

GET {{hurlin-noise}}
HTTP 200
[Captures]
title: jsonpath "$.noise"


GET {{hurlin-noise}}
HTTP 200
[Captures]
body: jsonpath "$.noise"

POST {{api}}/blogs
{
  "title": "{{title}}",
  "body": "{{title}}{{body}}"
}
HTTP 201
[Captures]
norm: jsonpath "$.title_norm"
id: jsonpath "$.id"


GET {{api}}/blogs/one?id={{id}}
HTTP 200


# too short
PUT {{api}}/blogs/{{id}}
{
  "body": "a"
}
HTTP 422

# missing body
PUT {{api}}/blogs/{{id}}
{}
HTTP 422


# OK
PUT {{api}}/blogs/{{id}}
{
  "body": "the quick brown fox jumps over the lazy dog the quick brown"
}
HTTP 200

POST {{api}}/auth/logout
HTTP 200

# Err not logged in
PUT {{api}}/blogs/{{id}}
{
  "body": "the quick brown fox jumps over the lazy dog the quick brown"
}
HTTP 401

GET {{hurlin-await}}{{await}}
HTTP 200
[Captures]
email2: jsonpath "$.email"
password2: jsonpath "$.password"

POST {{api}}/auth/login
{
  "email": "{{email2}}",
  "password": "{{password2}}"
}
HTTP 200

# Err wrong user
PUT {{api}}/blogs/{{id}}
{
  "body": "the quick brown fox jumps over the lazy dog the quick brown"
}
HTTP 403


