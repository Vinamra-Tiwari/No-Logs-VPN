# Nexus VPN Platform

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)
![WireGuard](https://img.shields.io/badge/wireguard-%2388171A.svg?style=for-the-badge&logo=wireguard&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

A production-style multi-hop WireGuard VPN platform with a sleek, glassmorphic administrative dashboard. This platform automates client provisioning, provides QR-code onboarding, and securely manages WireGuard peers with zero-downtime synchronization.

---

## 🌟 Features

- **Automated Provisioning:** Generates keypairs and allocates IPs sequentially.
- **Zero-Downtime Sync:** Uses `wg syncconf` and atomic file replacements to update configurations without dropping active connections.
- **Encrypted Secrets:** Client private keys are securely encrypted at rest (AES-256-CBC) within the SQLite database.
- **QR Code Onboarding:** Instantly generate QR codes for mobile users to join the network.
- **Live Monitoring:** Real-time visibility into connection status, last handshake times, and Rx/Tx data usage parsed directly from WireGuard.
- **Premium UI:** A beautifully crafted, responsive dashboard using React, Framer Motion, and Tailwind CSS.

## 🏗️ Architecture Topology

The infrastructure leverages a secure multi-hop topology:

`Phone / Client Device` ➡️ `Singapore VPS (Entry Node)` ➡️ `Germany VPS (Exit Node)` ➡️ `Internet`

- **wg0 Interface:** Backbone tunnel linking the Singapore entry node to the Germany exit node.
- **wg1 Interface:** Client-facing gateway residing on the Singapore node (`10.20.20.1/24`), routing traffic dynamically through the multi-hop table.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- WireGuard installed on the host machine (`wg-tools`)
- Restricted `sudo` access for the Node.js runner to execute `wg` commands.

### 1. Installation

Clone the repository and install dependencies for both the backend and frontend:

```bash
git clone https://github.com/Vinamra-Tiwari/No-Logs-VPN.git
cd No-Logs-VPN

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configuration

Create a `.env` file in the `backend` directory:

```env
PORT=5000
ADMIN_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key
DB_ENCRYPTION_KEY=32_byte_secret_key_for_encryption_here
WG_CONF_PATH=/etc/wireguard/wg1.conf
```

### 3. Sudoers Permissions (Production)

For security, do **not** run the application as root. Instead, configure specific `sudo` rules for the user running the Node process:

```bash
# Allow the node user to run specific WireGuard commands and the sync script
node_user ALL=(ALL) NOPASSWD: /usr/bin/wg, /usr/bin/wg-quick strip wg1, /absolute/path/to/backend/scripts/sync_wg.sh *
```

*(Note: Adjust paths and user names according to your environment).*

### 4. Running the Application

**Development:**
Run the backend and frontend concurrently in separate terminals:

```bash
# Terminal 1
cd backend
npm start

# Terminal 2
cd frontend
npm run dev
```

**Production:**
Build the frontend and serve it entirely via the Express backend:

```bash
cd frontend
npm run build

cd ../backend
npm start
```

## 🔐 Security Considerations

- **Least Privilege:** The application relies on tightly scoped `sudo` commands.
- **Authentication:** Admin dashboard access is protected via bcrypt-hashed comparisons and JWT session cookies.
- **Key Storage:** While private keys are stored for QR regeneration, they are encrypted with a 256-bit application secret.

## 📄 License

This project is licensed under the MIT License.
