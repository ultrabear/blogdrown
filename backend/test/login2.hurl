
GET {{hurlin-noise}}
HTTP 200
[Captures]
noise: jsonpath "$.noise"

POST {{api}}/auth/signup
{
  "email": "{{noise}}@gmail.com",
  "username": "{{noise}}",
  "password": "{{noise}}@password"
}
HTTP 201

POST {{hurlin-export}}
{
  "email": "{{noise}}@gmail.com",
  "password": "{{noise}}@password"
}
HTTP 200
