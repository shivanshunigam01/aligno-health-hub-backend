const apiResponse = ({ res, statusCode = 200, success = true, message = 'OK', data = null, errors = null, pagination = null }) => res.status(statusCode).json({ success, message, data, errors, pagination, timestamp: new Date().toISOString() });
module.exports = apiResponse;
