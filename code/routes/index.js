var express = require('express');
var request = require('request');
var router = express.Router();

var accessToken = '7c1af6b96b5649721bba04ce43000029';
var endpoint = '06f964c9.compilers.sphere-engine.com';

var problemCount = 1;
var contestCount = 0;

var db = require("odbc")(),
  cn = "DRIVER={Tibero 6 ODBC Driver};SERVER=localhost;PORT=8629;DB=tibero;UID=HR;PWD=tibero";

db.open(cn, function(err) {
  if (err) {
    return console.log(err);
  }
});

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

var RTEstring = '\n\n\n JDoodle - Timeout \nIf your program reads input, please enter the inputs in STDIN box above or try enable "Interactive" mode option above.\nPlease check your program has any endless loop. \nContact JDoodle support at jdoodle@nutpan.com for more information.';

router.post('/submit/:id', function(req, res, next) {
  var program = {
    script: req.body.code,
    stdin: '9 4 2 8 5',
    language: "cpp14",
    versionIndex: "0",
    clientId: "566da05e3f99eacbc144bd02203424b",
    clientSecret: "6f5cae39f3b33cc14635d77adf13d21da29ddee9dba2026d45404dca0337b0b5"
  };
  request({
      url: 'https://api.jdoodle.com/execute',
      method: "POST",
      json: program
    },
    function(error, response, body) {
      console.log('error:', error);
      console.log('statusCode:', response && response.statusCode);
      console.log('body:', body);

      if (body.memory == null && body.cpuTime == null) {
        if (body.output == RTEstring) {
          res.send('<script>alert("런타임 에러"); location.href = "../viewProblem";</script>');
        } else {
          res.send('<script>alert("컴파일 에러"); location.href = "../viewProblem";</script>');
        }
      } else {
        if (body.output.trim() == "9") {
          res.send('<script>alert("정답입니다"); location.href = "../viewProblem";</script>');
        } else {
          res.send('<script>alert("틀렸습니다"); location.href = "../viewProblem";</script>');
        }
      }
    });
});

router.get('/temp', function(req, res, next) {
  res.render('temp');
});

router.get('/start', function(req, res, next) {
  res.render('start');
});

router.get('/makeProblem', function(req, res, next) {
  res.render('makeProblem');
});

router.post('/makeProblem', function(req, res, next) {
  var input = req.body;
  problemCount++;

  var data = [parseInt(problemCount), input.problemName, input.problemContent, input.problemSampleInput,
    input.problemSampleOutput, input.problemInput, input.problemOutput, parseFloat(input.timeLimit), parseInt(input.memoryLimit)
  ];
  console.log(data);
  db.query("INSERT INTO problems VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)", data, function(err, rows, moreResultSets) {
    if (err) {
      console.log(err);
      res.send('<script>alert("문제 생성 중 오류가 발생했습니다."); location.href = "viewProblem"; </script>');
    } else {
      res.send('<script>alert("문제가 생성되었습니다!"); location.href = "viewProblem"; </script>');
    }
  });
});
router.get('/viewProblem', function(req, res, next) {
  db.query("SELECT * FROM problems ORDER BY problemid ASC", function(err, rows, moreResultSets) {
    if (err) {
      return console.log(err);
    }
    console.log(rows);
    res.render('viewProblem', {
      rows: rows
    });
  });
});

router.get('/viewProblem/:id', function(req, res, next){

  var sql = "SELECT * FROM problems WHERE TO_NUMBER(problemid) = " + String(req.params.id);
  console.log(sql);
  db.query(sql, function(err, rows, moreResultSets) {
    if (err) {
      return console.log(err);
    }
    res.render('problemInfo', {
      rows: rows
    });
  });
});

router.get('/makeContest', function(req, res, next) {
  res.render('makeContest');
});
router.get('/viewContest', function(req, res, next) {
  res.render('viewContest');
});
router.get('/myContest', function(req, res, next) {
  res.render('myContest');
});
router.get('/problemInfo', function(req, res, next) {
  res.render('problemInfo');
});
router.get('/viewRanking', function(req, res, next) {
  res.render('viewRanking');
});
module.exports = router;
