// modifed version of https://github.com/floatdrop/timed-out
export class TimedOut {
    static applyToRequest(req, time) {
        if (req.timeoutTimer) {
            return req;
        }
        var delays = isNaN(time) ? time : { socket: time, connect: time };
        var host = req._headers ? req._headers.host : '';
        var remoteAddress = null;
        if (delays.connect !== undefined) {
            req.timeoutTimer = setTimeout(function timeoutHandler() {
                req.abort();
                var e = new Error('Connection timed out on request to host: ' + host + ", address: " + remoteAddress);
                e.code = 'ETIMEDOUT';
                e.host = host;
                e.address = remoteAddress;
                req.emit('error', e);
            }, delays.connect);
        }
        // Clear the connection timeout timer once a socket is assigned to the
        // request and is connected.
        req.on('socket', function assign(socket) {
            socket.on("lookup", (err, address) => {
                console.log("Got remote address! Remote address: " + address + ", for host: " + host);
                remoteAddress = address;
            });
            // Socket may come from Agent pool and may be already connected.
            if (!(socket.connecting || socket._connecting)) {
                connect();
                return;
            }
            socket.once('connect', connect);
        });
        function clear() {
            if (req.timeoutTimer) {
                clearTimeout(req.timeoutTimer);
                req.timeoutTimer = null;
            }
        }
        function connect() {
            clear();
            if (delays.socket !== undefined) {
                // Abort the request if there is no activity on the socket for more
                // than `delays.socket` milliseconds.
                req.setTimeout(delays.socket, function socketTimeoutHandler() {
                    req.abort();
                    var e = new Error('Socket timed out on request to host: ' + host + ", address: " + remoteAddress);
                    e.code = 'ESOCKETTIMEDOUT';
                    e.host = host;
                    e.address = remoteAddress;
                    req.emit('error', e);
                });
            }
        }
        return req.on('error', clear);
    }
    ;
}
