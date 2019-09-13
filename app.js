const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const logger = require('morgan');

const cors = require('cors')
const app = express();
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(expressSession({
    secret: 'test',
    resave: true,
    saveUninitialized: true
}))
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors())

/**
 * 미들웨어 정의
 */
app.use((req,res,next) => {
    console.log('정적파일 호출 아닌 미들웨어 :: %s', '#0')
    next()
})

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
