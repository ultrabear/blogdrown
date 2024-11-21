GET {{hurlin-noise}}
HTTP 200
[Captures]
noise: jsonpath "$.noise"

POST {{api}}/auth/signup
{
  "username": "{{noise}}",
  "password": "{{noise}}@password"
}
HTTP 422
[Asserts]
jsonpath "$.errors.email" exists

POST {{api}}/auth/signup
{
  "email": "{{noise}}@gmail.com",
  "password": "{{noise}}@password"
}
HTTP 422
[Asserts]
jsonpath "$.errors.username" exists


POST {{api}}/auth/signup
{
  "username": "{{noise}}",
  "email": "{{noise}}@gmail.com",
  "password": "{{noise}}@password"
}
HTTP 201
[Asserts]
cookie "session" exists
cookie "session[SameSite]" == "Lax"
cookie "session[HttpOnly]" exists


POST {{api}}/auth/logout
HTTP 200
[Asserts]
cookie "session[Max-Age]" == 0


POST {{api}}/auth/login
{
  "email": "{{noise}}@gmail.com",
  "password": "{{noise}}@password"
}
HTTP 200


POST {{hurlin-export}}
{
  "email": "{{noise}}@gmail.com",
  "password": "{{noise}}@password"
}
HTTP 200
