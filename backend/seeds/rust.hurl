POST {{api}}/auth/login
{
  "email": "bacondude@gmail.com",
  "password": "gregtech1-pass2word"
}
HTTP 200

GET {{hurlin-readfile}}./rust.md
HTTP 200
[Captures]
gregtech: body


POST {{api}}/blogs
{
  "title": "RustUp",
  "body": "{{gregtech}}"
}
HTTP 201
