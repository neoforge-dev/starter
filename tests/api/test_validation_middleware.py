class MockStream:
    """Mock stream for testing."""
    def __init__(self, body: bytes):
        self.body = body
        self.sent = False

    async def receive(self) -> dict:
        if not self.sent:
            self.sent = True
            return {"type": "http.request", "body": self.body, "more_body": False}
        return {"type": "http.request", "body": b"", "more_body": False}

class NoDefaultHeadersTransport(ASGITransport):
    """Transport that doesn't add default headers."""
    async def handle_async_request(self, request: Request) -> object:
        # Build headers from request without modification
        headers_list = [(k.lower().encode("ascii"), v.encode("ascii")) for k, v in request.headers.items()]

        # If the client provided a 'content-length' header, compute the correct length and insert it
        if "content-length" in request.headers:
            body_bytes = await request.body()
            computed_length = str(len(body_bytes))
            headers_list = [pair for pair in headers_list if pair[0] != b"content-length"]
            headers_list.append((b"content-length", computed_length.encode("ascii")))
        
        scope = {
            "type": "http",
            "asgi": {"version": "3.0"},
            "http_version": "1.1",
            "method": request.method,
            "headers": headers_list,
            "path": str(request.url.path),
            "raw_path": str(request.url.path).encode("ascii"),
            "query_string": str(request.url.query).encode("ascii"),
            "scheme": request.url.scheme,
            "server": ("testserver", 80),
            "client": ("testclient", 50000),
        }

        # If we haven't computed the body above, now compute it once
        body_bytes = await request.body()
        stream = MockStream(body_bytes)

        response_chunks = []

        async def send_wrapper(message: dict) -> None:
            response_chunks.append(message)

        await self.app(scope, stream.receive, send_wrapper)

        status_code = 500
        headers = []
        body = b""

        for chunk in response_chunks:
            if chunk["type"] == "http.response.start":
                status_code = chunk["status"]
                headers = chunk["headers"]
            elif chunk["type"] == "http.response.body":
                body += chunk["body"]

        return Response(status_code=status_code, headers=headers, content=body) 

    data = response.json()
    assert "detail" in data
    assert isinstance(data.get("detail"), list) and len(data.get("detail")) > 0 