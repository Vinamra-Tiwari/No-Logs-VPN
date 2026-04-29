# Nexus VPN Platform (No-Logs Edition)

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)
![WireGuard](https://img.shields.io/badge/wireguard-%2388171A.svg?style=for-the-badge&logo=wireguard&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

A production-style multi-hop WireGuard VPN platform with a sleek, cinematic "Red Team" administrative dashboard. This platform automates client provisioning, enforces strict ephemeral no-logs policies, and securely manages WireGuard peers with zero-downtime synchronization.

---

## 🌟 Key Features

- **Cinematic Threat Dashboard:** A dark-themed, glassmorphic UI featuring a live multi-hop route map, dynamic Recharts telemetry graphs, and a scrolling jetbrains-mono terminal feed.
- **Automated Key Rotation:** Implements Perfect Forward Secrecy by autonomously generating and rotating WireGuard public/private key pairs for all active clients on a scheduled interval (e.g., every hour).
- **Ephemeral "No-Logs" Mode:** Clients can be provisioned with dynamic expiration timers. A background Ghost Peer Pruning script actively audits the Vultr VPS to destroy stale connections.
- **Tactical Threat Matrix:** Toggles for strict Kill Switches, DNS Hardening, and Key Rotation behavior.
- **Zero-Downtime Sync:** Uses `wg set` and atomic updates to inject keys and update configurations without dropping active network tunnels.
- **QR Code Onboarding:** Instantly generate QR codes for mobile users to join the network.

## 🏗️ Architecture Topology

The infrastructure leverages a secure multi-hop topology to mask origin IPs:

`Client Device` ➡️ `Singapore VPS (Entry Node)` ➡️ `Germany VPS (Exit Node)` ➡️ `Internet`

- **wg0 Interface:** Backbone tunnel linking the Entry node to the Exit node.
- **wg1 Interface:** Client-facing gateway residing on the Entry node (`10.20.20.1/24`), routing traffic dynamically through the multi-hop routing table.

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
ENTRY_NODE=Singapore
EXIT_NODE=Germany
EPHEMERAL_HOURS=24
```

### 3. Sudoers Permissions (Production)

For security, do **not** run the application as root. Instead, configure specific `sudo` rules for the user running the Node process to interact with WireGuard:

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

## 🛡️ Administrative Scripts

The backend includes powerful administrative scripts:
- `npm run clean`: Triggers the Ephemeral Pruning engine to delete expired users and destroy ghost peers on the live WireGuard interface.
- `npm run rotate`: Forces an immediate, global Key Rotation for all active clients, enforcing Perfect Forward Secrecy.
- `npm run wipe`: A high-destructive "Panic Button" script that nukes all SQLite database entries and removes all peers from the WireGuard interface.

## 🔐 Security Considerations

- **Forward Secrecy:** Scheduled key rotations ensure that compromised static keys cannot be used to decrypt past or future traffic.
- **Least Privilege:** The application relies on tightly scoped `sudo` commands rather than running the daemon as root.
- **Authentication:** Admin dashboard access is protected via bcrypt-hashed comparisons and JWT session cookies.
- **Key Storage:** While private keys are temporarily stored for QR regeneration in the SQLite DB, they are encrypted at rest with a 256-bit application secret, and `.db` files are ignored in version control.

## 📄 License

This project is licensed under the MIT License.
