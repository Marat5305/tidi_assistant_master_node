import http.server
import socketserver

PORT = 8005
Handler = http.server.SimpleHTTPRequestHandler

# Принудительно добавляем правильный MIME-тип
Handler.extensions_map.update({
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
})

import os
os.chdir('dist')

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Сервер запущен на http://localhost:{PORT}")
    httpd.serve_forever()