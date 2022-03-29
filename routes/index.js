var express = require('express');
var router = express.Router();

var pg =require('pg');
var config = {
  user: 'xgnvqxmu',
  database: 'xgnvqxmu',
  password: 'qhwrA4fdZ48Q19tb4UiOR1txUgA0QM67',
  host: 'kandula.db.elephantsql.com',
  port: 5432,
  max: 100,
  idleTimeoutMillis: 30000,
};
var pool = new pg.Pool(config);
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/', function(req, res, next) {
  pool.connect(function(err,client,done){
    if(err){
      res.end('{"error" : "Error", "status" : 500');
    }
    client.query(`SELECT * FROM artikli`,[],function (err,result){
      done();
      if(err){
        console.info(err);
        res.sendStatus(500);
      }else{
        console.info(result.rows);
        res.render('index',{jela:result.rows});
      }
    })
  })
});




module.exports = router;
