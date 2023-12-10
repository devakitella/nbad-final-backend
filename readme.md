Personal Budget Management API
    This project is a RESTful API for managing personal budgets. It is built using Node.js, Express, MySQL, and JWT for authentication.
Features
    User registration and authentication
    User login with JWT tokens
    Budget management (add, delete)
    Expense management (add, delete)
    Token refresh mechanism
    RESTful API structure
    Getting Started
    Prerequisites
Make sure you have the following installed on your machine:
    Node.js
    npm
    MySQL
Endpoints
    POST /api/register: Register a new user.
    POST /api/signin: Sign in with an existing user.
    GET /api/userBudgets: Get user budgets (requires authentication).
    POST /api/addExpense: Add a new expense (requires authentication).
    GET /api/getExpenses: Get expenses for a specific date (requires authentication).
    DELETE /api/deleteBudget/:budgetId: Delete a budget (requires authentication).
    DELETE /api/deleteExpense/:expenseId: Delete an expense (requires authentication).
    POST /api/refreshAccessToken: Refresh the access token.
    GET /: Health check endpoint.
Authentication
    For endpoints requiring authentication, include the JWT token in the Authorization header.
Testing
    The project includes a test suite to ensure the reliability of the API. We use the Jest testing framework along with Supertest for making HTTP requests.
    Mysql is installed in the system where the backend in deployed.