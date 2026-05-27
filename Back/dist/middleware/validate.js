"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const validate = (schema) => (req, res, next) => {
    try {
        const parsed = schema.parse({ body: req.body, params: req.params, query: req.query });
        if (parsed.body)
            req.body = parsed.body;
        if (parsed.params)
            req.params = parsed.params;
        // Avoid reassigning req.query directly because in some environments it's read-only
        // Use parsed.query only for validation result, do not overwrite Express internals
        next();
    }
    catch (err) {
        return res.status(400).json({ message: 'Validation error', details: err.errors ?? err.message });
    }
};
exports.validate = validate;
exports.default = exports.validate;
