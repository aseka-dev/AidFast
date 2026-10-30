# 💊 AidFast – Community Pharmacy Management & Medicine-Access Platform

**AidFast** is a web-based Community Pharmacy Management and Medicine-Access Platform developed as part of the **IS Project for Community (IS5109)** at Sabaragamuwa University of Sri Lanka.

The system is designed for **Gimshani Pharmacy, Kandana**, with the aim of improving pharmacy operations, simplifying medicine availability checks for the community, monitoring unmet medicine demand, and strengthening medicine batch safety awareness.

---

## 📌 Project Overview

Traditional pharmacy operations often involve difficulties in managing medicine records, stock quantities, batches, supplier information, purchases, expiry dates, and sales.

Additionally, community members may travel to a pharmacy without knowing whether their required medicines are available.

AidFast addresses these challenges through a centralized pharmacy management system connected to a public-facing medicine availability portal.

The platform consists of two main components:

- **Internal Pharmacy Management System:** Allows authorized pharmacy administrators and staff to manage daily pharmacy operations.
- **Community Medicine Access Portal:** Enables community members to search medicines, check availability, and submit requests for unavailable medicines.

## 🎯 Main Objectives

- Centralize pharmacy operations and medicine records.
- Improve batch-level inventory and stock management.
- Monitor medicine expiry dates through automated alerts.
- Simplify supplier, purchase, invoice, and sales management.
- Allow community members to check medicine availability before visiting the pharmacy.
- Identify unmet community demand through anonymous availability requests.
- Support medicine recall and batch safety monitoring.
- Provide dashboards and reports for better pharmacy management.

## ✨ Key Features

### 1. Authentication & User Management
- Secure login and logout.
- Role-based access control.
- Administrator and pharmacy staff accounts.
- Password protection and audit logging.

### 2. Medicine & Batch Management
- Add, update, search, and manage medicine records.
- Store generic names and trade/brand names.
- Manage medicine categories and manufacturers.
- Maintain batch numbers, quantities, purchase dates, and expiry dates.

### 3. Inventory & Stock Management
- Track current medicine stock.
- Manage stock-in and stock-out operations.
- Maintain stock movement history.
- Support First-In, First-Out (FIFO) stock handling.
- Identify low-stock and out-of-stock medicines.
- Record stock adjustments.

### 4. Supplier, Purchase & Invoice Management
- Maintain supplier information.
- Record medicine purchases.
- Manage supplier invoices.
- Track purchased quantities and prices.
- Record damaged and returned goods.

### 5. Sales & Returns Management
- Record medicine sales.
- Automatically update stock quantities.
- Maintain sales history.
- Manage supplier returns, customer returns where applicable, and damaged stock.

### 6. Expiry & Stock Alerts
- Monitor medicine batch expiry dates.
- Generate alerts for medicines approaching expiry.
- Identify expired medicine batches.
- Display low-stock and out-of-stock notifications.

**Expiry alert levels:**

| Remaining Expiry Period | Alert Level |
|---|---|
| Within 12 months | Alert |
| Within 9 months | Warning |
| Within 6 months | Critical Alert |
| Expired | Expired |

### 7. Community Medicine Availability Portal
- Search medicines using generic or brand names.
- View simplified medicine availability information.
- Display Available, Low Availability, and Out of Stock statuses.
- Access approved medicine information before visiting the pharmacy.
- Provide a mobile-friendly interface.

### 8. Community Demand Monitoring
- Submit anonymous availability requests for unavailable medicines.
- Record community medicine requests.
- Identify frequently requested unavailable medicines.
- Provide demand summaries and trends for pharmacy management.

### 9. Recall & Batch Safety Monitoring
- Record verified medicine recall and revocation notices.
- Match safety notices against pharmacy inventory batches.
- Generate critical safety alerts when matching batches are identified.
- Mark affected batches as Blocked or Quarantined according to the pharmacy's approved procedure.

### 10. Dashboard, Search & Reporting
- View pharmacy operational summaries.
- Search and filter medicine, batch, supplier, and transaction records.
- Generate inventory and stock reports.
- Monitor purchases, sales, and expiry information.
- Review community demand and medicine safety reports.

---

## 🛠️ Technology Stack

### Frontend
- React.js
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Recharts

### Backend
- Node.js
- Express.js
- TypeScript
- REST API
- JWT Authentication
- bcrypt / bcryptjs
- Zod

### Database
- MongoDB
- Mongoose
- MongoDB Atlas

### Development & Testing Tools
- Visual Studio Code
- Postman
- Git
- GitHub

### Deployment (Proposed)
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

---

## 🏗️ System Architecture

AidFast follows a client-server architecture.

```text
       COMMUNITY USERS
              |
              v
   Community Medicine Portal
              |
              v
       REACT FRONTEND
              |
              v
       REST API LAYER
              |
              v
      NODE.JS + EXPRESS
              |
              v
       MONGODB DATABASE
              |
              v
    INTERNAL PHARMACY SYSTEM
              |
              v
     ADMINISTRATOR / STAFF
```

---

## 👥 Target Users

| User | Responsibilities |
|---|---|
| Pharmacy Administrator | Manage users, medicines, inventory, suppliers, reports, and safety alerts. |
| Pharmacy Staff | Handle purchases, sales, stock updates, invoices, and daily operations. |
| Community Members | Search medicines, check availability, submit availability requests, and access approved safety information. |

---

## 🌍 Community Impact

AidFast aims to create value beyond conventional pharmacy management by connecting pharmacy operations with community medicine accessibility.

- **Reduced Unnecessary Trips:** Community members can check medicine availability before travelling.
- **Improved Medicine Accessibility:** Generic and brand-name searching makes medicine information easier to find.
- **Unmet Demand Identification:** Pharmacy management can identify frequently requested medicines that are unavailable.
- **Better Stock Planning:** Availability requests and sales information support informed inventory decisions.
- **Improved Medicine Safety Awareness:** Batch-level recall monitoring helps identify potentially affected medicines.
- **Efficient Record Management:** Centralized digital records improve access to pharmacy information.

---

## 🚀 Getting Started

### Prerequisites

Ensure that the following software is installed:

- Node.js
- npm
- MongoDB or MongoDB Atlas account
- Git
- Visual Studio Code

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

### 2. Navigate to the Project Directory

```bash
cd AidFast
```

### 3. Install Dependencies

Install the frontend and backend dependencies separately.

**Frontend:**

```bash
cd frontend
npm install
```

**Backend:**

```bash
cd ../backend
npm install
```

### 4. Configure Environment Variables

Create a `.env` file inside the backend directory.

Example configuration:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Use your actual configuration values. Never commit sensitive credentials to GitHub.

### 5. Run the Backend

```bash
npm run dev
```

### 6. Run the Frontend

Open another terminal:

```bash
cd frontend
npm run dev
```

Open the local URL displayed by Vite in your browser.

*Note: Update the directory names and development commands according to the final repository structure and package.json scripts.*

---

## 🔒 Security & Privacy

AidFast considers the confidentiality and integrity of pharmacy and community information.

- Only authorized users can access internal pharmacy functions.
- Role-based authorization controls access to system features.
- Passwords are securely hashed.
- Input validation is applied to user-submitted data.
- Exact stock quantities, supplier details, purchase prices, and confidential invoices are not exposed through the public portal.
- Expired, blocked, and quarantined batches are excluded from normal saleable stock.

## ⚠️ Disclaimer

AidFast is an informational and pharmacy management platform. It does not provide medical advice, diagnosis, or treatment recommendations.

Medicine availability information does not guarantee that a medicine will remain in stock. A medicine or batch not matching a recorded safety notice does not certify that it is safe, genuine, or suitable for a patient. Users should consult qualified healthcare professionals regarding medical decisions.

---

## 👨‍💻 Project Information

| Detail | Description |
|---|---|
| Project Name | AidFast |
| Project Type | IS Project for Community |
| Module | IS5109 |
| Group | Group 08 |
| Stakeholder | Gimshani Pharmacy, Kandana |
| University | Sabaragamuwa University of Sri Lanka |
| Faculty | Faculty of Computing |
| Department | Department of Computing & Information Systems |
| Development Methodology | Agile Methodology |

### Development Team

Developed by Group 08 – BSc (Hons) in Information Systems, Sabaragamuwa University of Sri Lanka.

---

## 📄 License

This project is developed for academic and community purposes as part of the IS Project for Community module at Sabaragamuwa University of Sri Lanka.
