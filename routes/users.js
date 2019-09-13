const express = require('express'),
    router = express.Router(),
    path = require('path');
const multer = require('multer')
const fs = require('fs')
const moment = require('moment')
const uuid4 = require('uuid4')

let storage = multer.diskStorage({
  destination: (req,file,callback) => {
    let uploadPath = path.join('uploads',moment().format('YYYYMMDD'), 'origin')
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    callback(null, uploadPath)
  },
  filename: (req,file,callback) => {
    let filename = file.originalname
    let filenamelength = filename.length
    let fileLastIndexOf = filename.lastIndexOf('.')
    callback(null,uuid4()+filename.substring(fileLastIndexOf,filenamelength))
  }
})

let upload = multer({
  storage: storage,
  limits: {
    files: 10,
    fileSize: 1024*1024*1024
  }
})

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/login', function(req, res, next) {
  req.session.user = {
    id: req.query.id,
    password: req.query.password
  }
  res.write(JSON.stringify({
    id: req.query.id,
    password: req.query.password,
    cookies: req.cookies
  }))
  res.end()
});

router.post('/login', function(req, res, next) {
  res.write(JSON.stringify({id: req.body.id, password: req.body.password}))
  res.end()
});

router.get('/info', (req,res,next) => {
  if (req.session.user) {
    res.write('login')
  } else {
    res.write('no login')
  }
  res.end()
})

router.post('/upload',upload.array('file',10), (req,res,next) => {
  try {
    let files = req.files
    files.forEach((item) => {
      console.log(item)
      let originalname = item.originalname,
          filename = item.name,
          mimetype = item.mimetype,
          size = item.size
      console.log('originalname: %s, filename: %s, mimetype: %s, size: %d',originalname,filename,mimetype,size)
    })
  } catch (e) {
    console.log(e)
  }
  res.write("success")
  res.end()
})

module.exports = router;
