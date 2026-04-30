const { Client } = require('ssh2');

class SSHEngine {
  constructor(node) {
    this.node = node;
    this.conn = new Client();
  }

  connect(privateKey) {
    return new Promise((resolve, reject) => {
      this.conn.on('ready', () => {
        resolve();
      }).on('error', (err) => {
        reject(err);
      }).connect({
        host: this.node.public_ip,
        port: this.node.ssh_port || 22,
        username: this.node.ssh_username || 'root',
        privateKey: privateKey,
        readyTimeout: 15000,
      });
    });
  }

  execCommand(cmd) {
    return new Promise((resolve, reject) => {
      this.conn.exec(cmd, (err, stream) => {
        if (err) return reject(err);
        
        let stdout = '';
        let stderr = '';
        
        stream.on('close', (code, signal) => {
          resolve({ stdout, stderr, code });
        }).on('data', (data) => {
          stdout += data;
        }).stderr.on('data', (data) => {
          stderr += data;
        });
      });
    });
  }

  disconnect() {
    this.conn.end();
  }
}

module.exports = SSHEngine;
