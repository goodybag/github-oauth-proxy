# GitHub OAuth Proxy

To authenticate a user with the GitHub api and receive an oauth token, you must include your GitHub application client id and client secret in the request.
For purely client-side apps that rely on statically delivered javascript, this presents a security issue: the client secret can be discovered by browser developer tools or foreign javascript.
This project is a simple server that takes github credentials and returns a github auth token.
The client never seesgithub application client secret, and the server does not deliver a token for an account unless the requester has the github credentials.

## Configuration

Create a `config.json` file in the same directory as `server.js` which looks like this:

```json
{
  "client_id":"[your github application client id]",
  "client_secret":"[your github application client secret]"
}
```

## Use

`npm start`

Then make an `application/json` POST request to the server containing the [temporary code](http://developer.github.com/v3/oauth/#web-application-flow) github gave you:

```json
{
  "code":"[your code]"
}
```