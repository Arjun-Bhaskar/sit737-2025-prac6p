const express = require('express');
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

const app = express();
const PORT = 3005;

app.use(express.json());

// Enhanced Middleware
app.use((req, res, next) => {
    logger.info({
        message: 'Request received',
        method: req.method,
        url: req.url,
        ip: req.ip,
        headers: req.headers
    });
    next();
});

// Validate numbers with enhanced checks
const validateNumbers = (req, res, next) => {
    const { num1, num2 } = req.query;
    
    if (num1 === undefined || num2 === undefined) {
        logger.error('Missing parameters');
        return res.status(400).json({ 
            error: 'Both num1 and num2 are required',
            suggestion: 'Example: /add?num1=5&num2=3'
        });
    }
    
    if (isNaN(num1) || isNaN(num2)) {
        logger.error('Invalid parameters', { num1, num2 });
        return res.status(400).json({ 
            error: 'Both num1 and num2 must be valid numbers',
            received: { num1, num2 }
        });
    }
    
    req.num1 = parseFloat(num1);
    req.num2 = parseFloat(num2);
    next();
};

// Validate single number(for square root)
const validateSingleNumber = (req, res, next) => {
    const { num } = req.query;
    
    if (num === undefined) {
        logger.error('Missing parameter for square root');
        return res.status(400).json({ 
            error: 'num parameter is required',
            example: '/sqrt?num=25'
        });
    }
    
    if (isNaN(num)) {
        logger.error('Invalid parameter for square root', { num });
        return res.status(400).json({ 
            error: 'num must be a valid number',
            received: num 
        });
    }
    
    req.num = parseFloat(num);
    next();
};

// Basic Arithmetic Operations

//Addition
app.get('/add', validateNumbers, (req, res) => {
    circuitBreaker.execute(() => {
        const { num1, num2 } = req;
        const result = num1 + num2;
        logger.info(`Addition: ${num1} + ${num2} = ${result}`);
        res.json({ 
            operation: 'addition', 
            num1, 
            num2, 
            result,
            timestamp: new Date().toISOString()
        });
    }).catch(err => {
        logger.error('Addition service failure', { error: err });
        res.status(503).json({ 
            error: 'Service temporarily unavailable',
            fallback: 'Try again later'
        });
    });
});

//Subtraction
app.get('/subtract', validateNumbers, (req, res) => {
    circuitBreaker.execute(() => {
        const { num1, num2 } = req;
        const result = num1 - num2;
        logger.info(`Subtraction: ${num1} - ${num2} = ${result}`);
        res.json({ 
            operation: 'subtraction', 
            num1, 
            num2, 
            result,
            timestamp: new Date().toISOString()
        });
    }).catch(err => {
        logger.error('Subtraction service failure', { error: err });
        res.status(503).json({ 
            error: 'Service temporarily unavailable',
            fallback: 'Try again later'
        });
    });
});

// MULTIPLICATION
app.get('/multiply', validateNumbers, (req, res) => {
    circuitBreaker.execute(() => {
        const { num1, num2 } = req;
        const result = num1 * num2;
        logger.info(`Multiplication: ${num1} * ${num2} = ${result}`);
        res.json({ 
            operation: 'multiplication', 
            num1, 
            num2, 
            result,
            timestamp: new Date().toISOString()
        });
    }).catch(err => {
        logger.error('Multiplication service failure', { error: err });
        res.status(503).json({ 
            error: 'Service temporarily unavailable',
            fallback: 'Try again later'
        });
    });
});

//Divide
app.get('/divide', validateNumbers, (req, res) => {
    circuitBreaker.execute(() => {
        const { num1, num2 } = req;
        
        if (num2 === 0) {
            logger.error('Division by zero attempted', { num1, num2 });
            return res.status(400).json({ 
                error: 'Division by zero is not allowed',
                suggestion: 'Provide non-zero denominator'
            });
        }
        
        const result = num1 / num2;
        logger.info(`Division: ${num1} / ${num2} = ${result}`);
        res.json({ 
            operation: 'division', 
            num1, 
            num2, 
            result,
            timestamp: new Date().toISOString()
        });
    }).catch(err => {
        logger.error('Division service failure', { error: err });
        res.status(503).json({ 
            error: 'Service temporarily unavailable',
            fallback: 'Try again later'
        });
    });
});

// Advanced Arithmetic Operations
app.get('/power', validateNumbers, (req, res) => {
    const { num1, num2 } = req;
    const result = Math.pow(num1, num2);
    logger.info(`Exponentiation: ${num1}^${num2} = ${result}`);
    res.json({
        operation: 'exponentiation',
        base: num1,
        exponent: num2,
        result,
        timestamp: new Date().toISOString()
    });
});

app.get('/modulo', validateNumbers, (req, res) => {
    const { num1, num2 } = req;
    
    if (num2 === 0) {
        logger.error('Modulo by zero attempted');
        return res.status(400).json({
            error: 'Modulo by zero is undefined',
            suggestion: 'Provide non-zero modulus'
        });
    }
    
    const result = num1 % num2;
    logger.info(`Modulo: ${num1} % ${num2} = ${result}`);
    res.json({
        operation: 'modulo',
        dividend: num1,
        divisor: num2,
        result,
        timestamp: new Date().toISOString()
    });
});

app.get('/sqrt', validateSingleNumber, (req, res) => {
    const { num } = req;
    
    if (num < 0) {
        logger.error('Square root of negative number attempted');
        return res.status(400).json({
            error: 'Square root of negative numbers is not real',
            suggestion: 'Provide non-negative number',
            received: num
        });
    }
    
    const result = Math.sqrt(num);
    logger.info(`Square root: √${num} = ${result}`);
    res.json({
        operation: 'square_root',
        radicand: num,
        result,
        timestamp: new Date().toISOString() //converting date to string
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// error handling
app.use((err, req, res, next) => {
    logger.error('System error occurred', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        params: req.query
    });
    
    res.status(500).json({
        error: 'Internal server error',
        reference: `ErrorID-${Date.now()}`,
        support: 'contact support@calculator.com'
    });
});

// Start server
app.listen(PORT, () => {
    logger.info(`Enhanced calculator microservice running on port ${PORT}`);
    console.log(`Server running: http://localhost:${PORT}`);
});