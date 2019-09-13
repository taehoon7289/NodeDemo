const express = require('express'),
    router = express.Router(),
    path = require('path');
const multer = require('multer')
const fs = require('fs')
const moment = require('moment')
const uuid4 = require('uuid4')
const MongoClient = require('mongodb').MongoClient
let database

const connectDB = () => {
  let databaseUrl = 'mongodb://localhost:27017'
  MongoClient.connect(databaseUrl,(err,db) => {
    if (err) throw err
    console.log('데이터베이스(몽고디비)에 연결되었습니다.')
    database = db.db('test')
  })
}
connectDB()

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

/**
 * 유저 정보 존재여부 확인
 * @param database
 * @param id
 * @param password
 * @param callback
 */
let authUser = (database, id, password, callback) => {
  let users = database.collection('users')
  users.find({
    id: id,
    password: password
  }).toArray((err, docs) => {
    if (err) {
      callback(err,null)
      return
    }
    if (docs.length > 0) {
      console.log('아이디[%s], 비밀번호[%s] 일치 확인', id, password)
      callback(null,docs)
    } else {
      console.log('유저 정보 없음')
      callback(null, null)
    }
  })
}

/**
 * 유저 추가
 * @param database
 * @param id
 * @param password
 * @param callback
 */
let addUser = (database, id, password, callback) => {
  let users = database.collection('users')
  users.insertMany([{
    id: id,
    password: password
  }], (err, result) => {
    if (err) {
      callback(err,result)
      return
    }
    if (result.insertedCount > 0) {
      console.log('유저 추가됨', result.insertedCount)
    } else {
      console.log('추가 안됨')
    }
    callback(null, result)
  })
}

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/login', function(req, res, next) {
  let id = req.query.id
  let password = req.query.password
  authUser(database,id,password, (err, docs) => {
    if (err) throw err
    if (docs) {
      console.dir('컬렉션')
      console.dir(docs)
      console.log(docs[0].id)
      console.log(docs[0].password)
    }
  })
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

router.get('/signup', function(req, res, next) {
  let id = req.query.id
  let password = req.query.password
  addUser(database,id,password, (err, result) => {
    if (err) throw err
    if (result && result.insertedCount > 0) {
      console.log("가입되었습니다.")
    }
  })
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
