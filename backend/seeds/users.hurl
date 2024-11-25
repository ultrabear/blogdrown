

POST {{api}}/auth/signup
{
  "email": "john@gmail.com",
  "username": "arrayman",
  "password": "john-password1"
}
HTTP 201
[Captures]
john: cookie "session"

POST {{api}}/auth/signup
{
  "email": "mark@gmail.com",
  "username": "markedup",
  "password": "mark-password1"
}
HTTP 201
[Captures]
mark: cookie "session"

POST {{hurlin-export}}
{
  "john": "{{john}}",
  "mark": "{{mark}}"
}
HTTP 200
