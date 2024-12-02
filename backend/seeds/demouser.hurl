POST {{api}}/auth/signup
{
  "email": "demo@users.io",
  "username": "DemoUser",
  "password": "demo-password"
}
HTTP 201
[Captures]
demo: cookie "session"


POST {{hurlin-export}}
{
  "demo": "{{demo}}"
}
HTTP 200
