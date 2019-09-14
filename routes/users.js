const express = require('express'),
    router = express.Router(),
    path = require('path');
const multer = require('multer')
const fs = require('fs')
const moment = require('moment')
const uuid4 = require('uuid4')
const crypto = require('crypto')
const MongoClient = require('mongodb').MongoClient
const mongoose = require('mongoose')
let database
let UserSchema
let UserModel

const databaseUrl = 'mongodb://localhost:27017/test'
const connectDB = () => {
  // 데이터 베이스 연결 시도
  mongoose.Promise = global.Promise
  mongoose.connect(databaseUrl)
  database = mongoose.connection

  /* MongoClient 이용한 mongodb 접속
  MongoClient.connect(databaseUrl,(err,db) => {
    if (err) throw err
    console.log('데이터베이스(몽고디비)에 연결되었습니다.')
    database = db.db('test')
  })
  */
}
const createUserSchema = () => {
  UserSchema = mongoose.Schema({
    id: { type: String, require: true, unique: true },
    hashed_password: {type: String, required: true},
    salt: {type: String, required: true},
    name: {type: String, index: 'hashed'},
    age: {type: Number, 'default': -1},
    created_at: {type: Date, index: {unique: false}, 'default': Date.now()},
    updated_at: {type: Date, index: {unique: false}, 'default': Date.now()}
  })

  // virtual 생성
  UserSchema
      .virtual('password')
      .set(function (password) {
        this._password = password
        this.salt = this.makeSalt()
        this.hashed_password = this.encryptPassword(password)
        console.log('virtual password 호출됨', this.hashed_password)
      })
      .get(function () {
        return this._password
      })

  //
  UserSchema.method('encryptPassword', function (plainText, inSalt) {
    if (inSalt) {
      return crypto.createHmac('sha1', inSalt).update(plainText).digest('hex')
    } else {
      return crypto.createHmac('sha1', this.salt).update(plainText).digest('hex')
    }
  })

  UserSchema.method('makeSalt', function () {
    return Math.round((new Date().valueOf() * Math.random())) + ''
  })

  UserSchema.method('authenticate', function (plainText, inSalt, hashed_password) {
    if (inSalt) {
      console.log('authenticate 호출됨 : %s -> %s : %s', plainText, this.encryptPassword(plainText,inSalt), hashed_password)
      return this.encryptPassword(plainText,inSalt) === hashed_password
    } else {
      console.log('authenticate 호출됨 : %s -> %s : %s', plainText, this.encryptPassword(plainText), hashed_password)
      return this.encryptPassword(plainText) === hashed_password
    }
  })

  UserSchema.path('id').validate(function (id) {
    return id.length
  }, 'id 값이 없습니다.')

  UserSchema.static('findById', function (id, callback) {
    return this.find({id: id}, callback)
  })
  UserSchema.static('findAll', function (callback) {
    return this.find({}, callback)
  })
  console.log('UserSchema 스키마정의함')
}
connectDB()

database.on('error', console.error.bind(console,'mongoose connection error.'))
database.on('open',() => {
  console.log('데이터베이스에 연결되었습니다.', databaseUrl)
  // 스키마정의
  createUserSchema()
  // UserModel 정의
  try {
    UserModel = mongoose.model('users', UserSchema)
  } catch (err) {
    UserModel = mongoose.model.users
  }
  console.log('UserModel 정의함.')
})
database.on('disconnected', () => {
  console.log('연결이 끊어졌습니다.')
  setTimeout(connectDB, 5000)
})

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
  UserModel.findById(id,(err,results) => {
    if (err) {
      callback(err, null)
      return
    }
    console.log('아이디[%s], 비밀번호[%s]로 검색결과',id,password)
    if (results.length > 0) {
      if (results[0].password === password) {
        callback(null,results)
      } else {
        console.log('패스워드 다름')
        callback(null,null)
      }
    } else {
      console.log('검색결과없음')
      callback(null,null)
    }
  })
  /*
  UserModel.find({id: id, password:password}, (err,result) => {
    if (err) {
      callback(err, null)
      return
    }
    console.log('아이디[%s], 비밀번호[%s]로 검색결과',id,password)
    if (result.length > 0) {
      callback(null,result)
    } else {
      console.log('검색결과없음')
      callback(null,null)
    }
  })
  */

  /*
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
  */
}

/**
 * 유저 추가
 * @param database
 * @param id
 * @param password
 * @param callback
 */
let addUser = (database, id, password, callback) => {
  let user = new UserModel({id: id, password: password})
  console.log('useruseruseruseruseruseruseruser', user)
  user.save((err,result) => {
    if (err) {
      callback(err,null)
      return
    }
    console.log(result)
    console.log('유저 추가됨')
  })

  /*
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
  */
}

/**
 * 유저 리스트
 * @param database
 * @param callback
 */
let userList = (database,callback) => {
  UserModel.findAll((err,results) => {
    if (err) {
      throw err
      callback(err, null)
    }
    callback(null,results)
  })
}

/* GET users listing. */
router.get('/', function(req, res, next) {
  userList(database, (err, results) => {
    res.write(JSON.stringify(results))
    res.end()
  })
});

router.get('/:id', function(req, res, next) {
  UserModel.findById(req.params.id,(err,results) => {
    res.write(JSON.stringify(results))
    res.end()
  })
});

router.get('/login', function(req, res, next) {
  let id = req.query.id
  let password = req.query.password
  authUser(database,id,password, (err, docs) => {
    if (err) throw err
    if (docs) {
      console.dir('컬렉션')
      console.dir(docs)
      req.session.user = {
        id: id,
        password: password
      }
    }
    res.redirect('info')
  })
});

router.get('/signup', function(req, res, next) {
  console.log('????????????????????????')
  let id = req.query.id
  let password = req.query.password
  console.log('11222')
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
