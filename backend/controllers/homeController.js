const path = require('path');

const getHomePage = (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
};

module.exports = { getHomePage };
