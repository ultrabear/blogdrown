

POST {{api}}/auth/signup
{
  "email": "bacondude@gmail.com",
  "username":  "gregtech",
  "password": "gregtech1-pass2word"
}

POST {{api}}/auth/login
{
  "email": "bacondude@gmail.com",
  "password": "gregtech1-pass2word"
}
HTTP 200

GET {{hurlin-readfile}}./gregtech.md
HTTP 200
[Captures]
gregtech: body


POST {{api}}/blogs
{
  "title": "On the FS",
  "body": "{{gregtech}}"
}
HTTP 201
