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

