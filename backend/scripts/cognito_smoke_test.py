import argparse
import base64
import hashlib
import json
import secrets
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.error import HTTPError
from urllib.parse import parse_qs, urlencode, urlparse
from urllib.request import Request, urlopen

COGNITO_DOMAIN = "https://medbook-640012953073.auth.ap-southeast-1.amazoncognito.com"
CLIENT_ID = "51gv9n71r08bki7jsp4nhloubq"
CALLBACK_URL = "http://localhost:5173/auth/callback"
API_BASE_URL = "https://medbook.tin-nexus.com"


def pkce_challenge(verifier: str) -> str:
    digest = hashlib.sha256(verifier.encode()).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode()


def request_json(url: str, *, data: dict | None = None, token: str | None = None):
    body = json.dumps(data).encode() if data is not None else None
    headers = {"Content-Type": "application/json"} if body else {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    request = Request(url, data=body, headers=headers, method="PUT" if body else "GET")
    with urlopen(request, timeout=30) as response:
        return response.status, json.load(response)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--display-name", default="Cognito Smoke Test")
    args = parser.parse_args()

    verifier = secrets.token_urlsafe(64)
    state = secrets.token_urlsafe(32)
    authorize_url = f"{COGNITO_DOMAIN}/oauth2/authorize?{
        urlencode(
            {
                'response_type': 'code',
                'client_id': CLIENT_ID,
                'redirect_uri': CALLBACK_URL,
                'scope': 'openid email profile',
                'state': state,
                'code_challenge': pkce_challenge(verifier),
                'code_challenge_method': 'S256',
            }
        )
    }"
    result = {}

    class CallbackHandler(BaseHTTPRequestHandler):
        def do_GET(self) -> None:
            query = parse_qs(urlparse(self.path).query)
            if self.path.split("?", 1)[0] != "/auth/callback":
                self.send_error(404)
                return

            try:
                if query.get("state", [None])[0] != state:
                    raise RuntimeError("Invalid OAuth state")
                if error := query.get("error", [None])[0]:
                    raise RuntimeError(error)

                token_request = Request(
                    f"{COGNITO_DOMAIN}/oauth2/token",
                    data=urlencode(
                        {
                            "grant_type": "authorization_code",
                            "client_id": CLIENT_ID,
                            "code": query["code"][0],
                            "redirect_uri": CALLBACK_URL,
                            "code_verifier": verifier,
                        }
                    ).encode(),
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                    method="POST",
                )
                with urlopen(token_request, timeout=30) as response:
                    access_token = json.load(response)["access_token"]

                put_status, _ = request_json(
                    f"{API_BASE_URL}/api/users/me",
                    data={"display_name": args.display_name},
                    token=access_token,
                )
                get_status, profile = request_json(
                    f"{API_BASE_URL}/api/users/me",
                    token=access_token,
                )
                result.update(
                    put_status=put_status,
                    get_status=get_status,
                    profile=profile,
                )
                message = "Cognito and RDS smoke test passed. Return to the terminal."
                status = 200
            except (HTTPError, KeyError, RuntimeError) as error:
                result["error"] = str(error)
                message = "Smoke test failed. Return to the terminal."
                status = 500

            payload = message.encode()
            self.send_response(status)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

        def log_message(self, format, *args) -> None:
            pass

    server = HTTPServer(("127.0.0.1", 5173), CallbackHandler)
    server.timeout = 300
    print(f"Open this URL if the browser does not open automatically:\n{authorize_url}")
    webbrowser.open(authorize_url)
    server.handle_request()
    server.server_close()

    if "error" in result:
        raise SystemExit(f"FAILED: {result['error']}")
    if not result:
        raise SystemExit("FAILED: timed out waiting for Cognito callback")
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
