const express = require('express');
const mysql = require('mysql');
const crypto = require('crypto');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { expressjwt: expressJwt } = require('express-jwt');

const serverPort = process.env.PORT || 4005;
const app = express();
app.use(cors());

const dbConnection = mysql.createConnection({
    host: 'localhost',
    user: 'Nbadfinal',
    password: 'Nbadfinal123@',
    database: 'personal_budget_nbad'
});

const hashForJWT = 'a123easdwr3412dasd3213';

const jwtMiddleware = expressJwt({
    secret: hashForJWT,
    algorithms: ['HS256']
});

app.use(express.json());

dbConnection.connect((error) => {
    if (error) {
        console.error('Error connecting to MySQL:', error);
        process.exit(1);
    }
    console.log('Connected to MySQL');
});

const closeDbConnection = () => {
    dbConnection.end((error) => {
        if (error) {
            console.error('Error closing MySQL connection:', error);
        } else {
            console.log('MySQL connection closed');
        }
    });
};

function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function generateRandomSalt() {
    return crypto.randomBytes(32).toString('hex');
}

function hashPassword(password, salt) {
    const hash = crypto.createHash('sha256');
    hash.update(password + salt);
    return hash.digest('hex');
}

app.post('/api/register', async (req, res) => {
    const { firstName, lastName, password, email, phone } = req.body;
    const salt = generateRandomSalt();
    const hashedPassword = hashPassword(password, salt);
    const currentDate = formatDate(new Date());

    dbConnection.query(
        'INSERT INTO user (first_name, last_name, password, salt, created_date, email, phone_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [firstName, lastName, hashedPassword, salt, currentDate, email, phone],
        (error, results) => {
            if (error) {
                console.error(error);
                res.status(500).json({ success: false, error: error.sqlMessage });
            } else {
                res.json({ status: 200, success: true, response: results });
            }
        }
    );
});

app.post('/api/signin', async (req, res) => {
    const { password, email } = req.body;

    dbConnection.query('SELECT * FROM user WHERE email = ?', [email], (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to retrieve user' });
        } else {
            if (results.length > 0) {
                const user = results[0];
                const hashedPassword = hashPassword(password, user.salt);

                if (hashedPassword === user.password) {
                    const token = jwt.sign(
                        { email: user.email, userId: user.id },
                        hashForJWT,
                        { expiresIn: '5m' }
                    );

                    res.json({
                        success: true,
                        message: 'Login successful',
                        user: { email: user.email, firstName: user.first_name, lastName: user.last_name, userId: user.id },
                        token: token
                    });
                } else {
                    res.status(401).json({ success: false, message: 'Incorrect password' });
                }
            } else {
                res.status(404).json({ success: false, message: 'User not found' });
            }
        }
    });
});

app.get('/api/userBudgets', jwtMiddleware, (req, res) => {
    const userId = req.auth.userId;

    dbConnection.query(
        'SELECT * FROM user_budgets WHERE user_id = ?',
        [userId],
        (error, results) => {
            if (error) {
                console.error(error);
                res.status(500).json({ error: 'Failed to get budgets' });
            } else {
                res.json(results);
            }
        }
    );
});

app.post('/api/addExpense', jwtMiddleware, (req, res) => {
    const userId = req.auth.userId;
    const { date, categoryName, categoryId, amount } = req.body;

    if (!date || !categoryName || !categoryId || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid expense data' });
    }

    const sql = 'INSERT INTO expenses (userid, date, categoryid, categoryName, amount) VALUES (?, ?, ?, ?, ?)';
    const values = [userId, date, categoryId, categoryName, amount];

    dbConnection.query(sql, values, (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ success: false, error: error.sqlMessage });
        }

        const newExpense = {
            id: results.insertId,
            userId,
            date,
            categoryId,
            categoryName,
            amount
        };

        res.json({ success: true, message: 'Expense added successfully', expense: newExpense });
    });
});

app.get('/api/getExpenses', jwtMiddleware, async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ success: false, message: 'Date parameter is required' });
        }

        const sql = 'SELECT id, date, categoryName, amount FROM expenses WHERE userid = ? AND date = ?';
        const values = [userId, date];

        dbConnection.query(sql, values, (error, results) => {
            if (error) {
                console.error(error);
                res.status(500).json({ success: false, error: 'Failed to fetch expenses' });
            } else {
                res.json({ success: true, expenses: results });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

app.delete('/api/deleteBudget/:budgetId', jwtMiddleware, (req, res) => {
    const userId = req.auth.userId;
    const budgetId = req.params.budgetId;

    // You might want to add additional validation for budgetId

    const sql = 'DELETE FROM user_budgets WHERE id = ? AND user_id = ?';
    const values = [budgetId, userId];

    dbConnection.query(sql, values, (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ success: false, error: 'Failed to delete budget' });
        }

        if (results.affectedRows > 0) {
            res.json({ success: true, message: 'Budget deleted successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Budget not found or you do not have permission to delete it' });
        }
    });
});

app.delete('/api/deleteExpense/:expenseId', jwtMiddleware, (req, res) => {
    const userId = req.auth.userId;
    const expenseId = req.params.expenseId;

    // You might want to add additional validation for expenseId

    const sql = 'DELETE FROM expenses WHERE id = ? AND userid = ?';
    const values = [expenseId, userId];

    dbConnection.query(sql, values, (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ success: false, error: 'Failed to delete expense' });
        }

        if (results.affectedRows > 0) {
            res.json({ success: true, message: 'Expense deleted successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Expense not found or you do not have permission to delete it' });
        }
    });
});

app.post('/api/refreshAccessToken', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    try {
        const decoded = jwt.verify(refreshToken, hashForJWT);
        const newAccessToken = jwt.sign(
            { email: decoded.email, userId: decoded.userId },
            hashForJWT,
            { expiresIn: '5m' }
        );
        res.json({ success: true, message: 'Token refreshed successfully', accessToken: newAccessToken });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }
});

app.get('/', async (req, res) => {
     res.status(200).json({ success: true, message: 'Working as Expected!!' });
});

app.post('/api/signout', (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ success: false, message: 'Token not provided' });
    }

    try {
        jwt.verify(token, hashForJWT);
        res.setHeader('Clear-Token', 'true');
        res.json({ success: true, message: 'Logout successful' });
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
});

app.post('/api/addUserBudget', jwtMiddleware, (req, res) => {
    const userId = req.auth.userId;
    var { category, budgetAmount } = req.body;

    category = category.toLowerCase();

    if (!category || typeof budgetAmount !== 'number' || budgetAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid budget data' });
    }

    const sql = 'INSERT INTO user_budgets (user_id, category, budget_amount) VALUES (?, ?, ?)';
    const values = [userId, category, budgetAmount];

    dbConnection.query(sql, values, (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ success: false, error: error.sqlMessage });
        }

        const newBudget = {
            id: results.insertId,
            userId,
            category,
            budgetAmount
        };

        res.json({ success: true, message: 'Budget added successfully', budget: newBudget });
    });
});

const serverInstance = app.listen(serverPort, () => {
    console.log("Server on port"+ serverPort);
});

process.on('exit', () => {
    serverInstance.close();
    closeDbConnection();
    console.log('Server and MySQL connection closed');
});

module.exports = app;