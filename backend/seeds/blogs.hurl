GET {{hurlin-readfile}}./example1.md
HTTP 200
[Captures]
example1: body

GET {{hurlin-readfile}}./mark_insane.md
HTTP 200
[Captures]
mark_is_insane: body

GET {{hurlin-async}}./demouser.hurl
HTTP 200
[Captures]
demo_await: jsonpath "$.await"

GET {{hurlin-import}}./users.hurl
HTTP 200
[Captures]
mark: jsonpath "$.mark"
john: jsonpath "$.john"


POST {{api}}/blogs
[Cookies]
session: {{mark}}
{
  "title": "An Adventure on lists",
  "body": "{{example1}}"
}
HTTP 201

POST {{api}}/blogs
[Cookies]
session: {{john}}
{
  "title": "Mark has gone insane",
  "body": "{{mark_is_insane}}"
}
HTTP 201
[Captures]
id: jsonpath "$.id"


POST {{api}}/blogs/{{id}}/comments
[Cookies]
session: {{mark}}
{
  "body": "Shut up john, you just dont get it, ill show you. Come outside."
}
HTTP 201

POST {{api}}/blogs/{{id}}/comments
[Cookies]
session: {{john}}
{
  "body": "As seeable below, mark has gone absolutely mad, just dont interact anymore."
}
HTTP 201


POST {{api}}/blogs
[Cookies]
session: {{john}}
{
  "title": "I Had To Do It",
  "body": "I had to do it I had to do it I had to do it I had to do it I had to do it I had to do it I had to do it I had to do it I HAD TO DO IT"
}
HTTP 201



GET {{hurlin-await}}{{demo_await}}
HTTP 200
