const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// router.all('*', (req,res,next) => {
//   res.writeHead(200,{'Content-Type': 'text/plain; charset=utf-8'})
//   res.write('PAGE 없음')
//   res.end()
// })

module.exports = router;
