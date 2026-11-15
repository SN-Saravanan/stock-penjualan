const { validId } = require("../utils/validation");

const validateIdParam = (req, res, next, value) => {
  if (!validId(value)) {
    return res.status(400).json({ success: false, message: "ID harus berupa bilangan bulat positif" });
  }
  next();
};

module.exports = { validateIdParam };
