/**
 * Metro-resolved `net` module for ssh2.
 * Implementation lives in tcpSocket.ts.
 */

const { TcpSocketWrapper } = require('./tcpSocket');

const net = {
  createConnection: (options, callback) => {
    const socket = new TcpSocketWrapper();
    if (callback) {
      socket.once('connect', callback);
    }
    socket.connect(options.port, options.host);
    return socket;
  },
  Socket: TcpSocketWrapper,
  createServer: () => {
    throw new Error('net.createServer not available in React Native');
  },
};

module.exports = net;
module.exports.Socket = TcpSocketWrapper;
module.exports.TcpSocketWrapper = TcpSocketWrapper;
