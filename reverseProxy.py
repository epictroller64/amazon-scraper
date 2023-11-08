from http.server import BaseHTTPRequestHandler, HTTPServer
from curl_cffi import requests


class Proxy(BaseHTTPRequestHandler):
    def do_GET(self):
        # Get the full URL by combining the path with query parameters
        url = self.path

        try:
            # Forward the request and get the response
            incoming_headers = {key: val for key, val in self.headers.items()}
            response = requests.get(url, impersonate="chrome110", headers=incoming_headers)

            # Send response status and headers
            self.send_response(response.status_code)
            for key, value in response.headers.items():
                self.send_header(key, value)
            self.end_headers()

            # Send the content
            self.wfile.write(response.content)
        except Exception as e:
            self.send_error(500, str(e))


def run(server_class=HTTPServer, handler_class=Proxy, port=8080):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f"Starting httpd server on port {port}")
    httpd.serve_forever()


if __name__ == '__main__':
    run()
