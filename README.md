# Smart Document Analysis

A full-stack application for automated document analysis, featuring keyword extraction, filtering, and export capabilities.

---

## 🏗️ Architecture

The application is split into two main components:

### [Frontend](./frontend/) (Angular + TailwindCSS)
- **Framework**: Angular 21.x
- **Testing**: Karma + Jasmine (Unit), Cypress (E2E)
- **Features**: Dashboard, Secure Login/Registration, Document Upload, History, and Detailed Analysis Reports (CSV/PDF Export).

### [Backend](./backend/) (Python + FastAPI)
- **Framework**: FastAPI
- **Database**: MariaDB
- **Tasks**: Long-running background jobs for document processing.
- **Storage**: Disk-based text storage for processing large volumes of data.

---

## 🚀 Quick Start (Local Machine)

The easiest way to run the application is using **Docker Compose**. Ensure you have [Docker Desktop](https://www.docker.com/products/docker-desktop) installed.

1.  **Clone the repository**.
2.  **Start the stack**:
    ```bash
    docker compose up -d --build
    ```
3.  **Access the application**:
    - **Frontend**: [http://localhost:4200](http://localhost:4200)
    - **Backend API**: [http://localhost:8000](http://localhost:8000)

---

## ☁️ Deployment (Ubuntu VM)

If you are deploying to a fresh **Ubuntu** virtual machine, use the provided setup script:

1.  **Copy the project files** to your VM.
2.  **Run the setup script**:
    ```bash
    chmod +x setup.sh
    ./setup.sh
    ```
    *This script will automatically install Docker, Docker Compose, and start your application.*

---

## 🧪 Testing

All frontend tests are located in the `frontend/` directory.

### Unit Tests (Karma)
```bash
cd frontend
npm run test:coverage  # Runs all unit tests and generates a coverage report
```

### E2E Flow (Cypress)
```bash
cd frontend
npm run e2e:smart  # Runs the full application lifecycle E2E test headlessly
# OR
npm run e2e:open   # Opens the Cypress GUI for interactive testing
```

---

## ⚙️ Configuration

Environment variables are managed in the root [.env](.env) file:

- `DB_USER` / `DB_PASSWORD`: Database credentials.
- `DB_NAME`: The name of the database.
- `MYSQL_ROOT_PASSWORD`: The root password for MariaDB.
- `API_PORT`: The port your backend runs on.
- `SECRET_KEY`: Used for JWT authentication security.
