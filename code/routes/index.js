var express = require('express');
var request = require('request');
var router = express.Router();

var accessToken = '7c1af6b96b5649721bba04ce43000029';
var endpoint = '06f964c9.compilers.sphere-engine.com';

var db = require("odbc")(),
  cn = "DRIVER={Tibero 6 ODBC Driver};SERVER=localhost;PORT=8629;DB=tibero;UID=HR;PWD=tibero";

/* GET home page. */
router.get('/', function(req, res, next) {
  db.open(cn, function(err) {
    if (err) {
      return console.log(err);
    }

    //we now have an open connection to the database
    db.query("SELECT * FROM employees ORDER BY EMPLOYEE_ID ASC", function(err, rows, moreResultSets) {
      if (err) {
        return console.log(err);
      }

      res.render('index', {
        title: 'Express',
        rows: rows
      });

      //if moreResultSets is truthy, then this callback function will be called
      //again with the next set of rows.
    });
  });
});

router.get('/postpage', function(req, res, next) {
  res.render('postpage');
});

router.post('/submit', function(req, res, next) {
  var program = {
      script : req.body.code,
      stdin: '1 2',
      language: "cpp14",
      versionIndex: "0",
      clientId: "566da05e3f99eacbc144bd02203424b",
      clientSecret:"6f5cae39f3b33cc14635d77adf13d21da29ddee9dba2026d45404dca0337b0b5"
  };
  request({
      url: 'https://api.jdoodle.com/execute',
      method: "POST",
      json: program
  },
  function (error, response, body) {
      console.log('error:', error);
      console.log('statusCode:', response && response.statusCode);
      console.log('body:', body);

        res.render('gogo', {error: error, response: response, body:body});
  });
});

router.get('/getSubmission', function(req, res, next){

})
module.exports = router;
