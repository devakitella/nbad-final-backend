**Personal Budget Management API Overview**

This project is a RESTful API designed for personal budget management, utilizing Node.js, Express, MySQL, and JWT for authentication.

**Key Features**
- User Registration and Authentication
- User Login with JWT Tokens
- Budget Management (Add, Delete)
- Expense Management (Add, Delete)
- Token Refresh Mechanism
- RESTful API Structure

**Getting Started**
*Prerequisites*
Ensure the following are installed on your machine:
- Node.js
- npm
- MySQL

**Endpoints**
- `POST /api/register`: Register a new user.
- `POST /api/signin`: Sign in with an existing user.
- `GET /api/userBudgets`: Retrieve user budgets (requires authentication).
- `POST /api/addExpense`: Add a new expense (requires authentication).
- `GET /api/getExpenses`: Retrieve expenses for a specific date (requires authentication).
- `DELETE /api/deleteBudget/:budgetId`: Delete a budget (requires authentication).
- `DELETE /api/deleteExpense/:expenseId`: Delete an expense (requires authentication).
- `POST /api/refreshAccessToken`: Refresh the access token.
- `GET /`: Health check endpoint.

**Authentication**
For endpoints requiring authentication, include the JWT token in the Authorization header.

**Testing**
The project includes a comprehensive test suite for ensuring API reliability. Key testing details include:
- MySQL is installed on the same system where the backend is deployed.
- Two unit tests are written, utilizing the Jest testing framework along with Supertest for making HTTP requests.
