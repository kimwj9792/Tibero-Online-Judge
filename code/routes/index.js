var express = require('express');
var request = require('request');
var session = require('express-session');
var router = express.Router();

function to_minute(str) {
  var hour = str.substring(11, 13);
  var min = str.substring(14, 16);
  return parseInt(hour) * 60 + parseInt(min);
}

router.use(session({
  key: 'id',
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 // 쿠키 유효기간 1시간
  }
}));

var db = require("odbc")(),
  cn = "DRIVER={Tibero 6 ODBC Driver};SERVER=localhost;PORT=8629;DB=tibero;UID=HR;PWD=tibero";

db.openSync(cn);

/* GET home page. */
router.get('/', function(req, res, next) {
  db.query("SELECT * FROM employees ORDER BY EMPLOYEE_ID ASC", function(err, rows, moreResultSets) {
    if (err) {
      return console.log(err);
    }

    res.render('index', {
      title: 'Express',
      rows: rows
    });
  });
});

router.post('/login', function(req, res, next) {

  var inputid = req.body.userid;
  var inputpw = req.body.userpw;

  var sql = "SELECT * FROM usrs WHERE userid = '" + String(inputid) + "' AND password = '" + String(inputpw) + "'";
  console.log(sql);
  db.query(sql, function(err, rows, moreResultSets) {
    if (err) {
      console.log(err);
      res.send("<script>alert('ID 혹은 PW를 확인해 주세요.'); location.href = './'</script>");
    }

    // 여기에 세션달기
    console.log(JSON.stringify(rows));
    req.session.userid = inputid;
    req.session.username = rows[0].NAME;

    var sess = req.session;

    res.render('start', {
      sess: sess
    });
  });
});

router.get('/postpage', function(req, res, next) {
  res.render('postpage');
});

var RTEstring = '\n\n\n JDoodle - Timeout \nIf your program reads input, please enter the inputs in STDIN box above or try enable "Interactive" mode option above.\nPlease check your program has any endless loop. \nContact JDoodle support at jdoodle@nutpan.com for more information.';

router.post('/submit/:id', function(req, res, next) {
  var user = req.session.userid;

  var key = req.params.id;
  var sql = "SELECT testcaseinputtext, testcaseoutputtext FROM problems WHERE problemid = " + String(key);

  var rows = db.querySync(sql);
  var result;
  //console.log(rows[0]);
  var program = {
    script: String(req.body.code),
    stdin: String(rows[0].TESTCASEINPUTTEXT),
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

      console.log(user);
      var date = new Date();
      console.log(date);
      var resultmessage;
      if (body.output.trim() == String(rows[0].TESTCASEOUTPUTTEXT)) { // 성공
        resultmessage = 'CORRECT';
        db.beginTransactionSync();
        var ans = db.querySync("UPDATE usrs SET passproblemcount = passproblemcount + 1, submitproblemcount = submitproblemcount + 1 WHERE userid = '" + String(user) + "'");
        db.commitTransactionSync();

      } else if (body.output == RTEstring) { // 런타임에러
        resultmessage = 'RUNTIME ERROR';
        db.beginTransactionSync();
        var ans2 = db.querySync("UPDATE usrs SET submitproblemcount = submitproblemcount + 1 WHERE userid = '" + String(user) + "'");
        db.commitTransactionSync();

      } else if (body.memory == null && body.cpuTime == null) { // 컴파일에러
        resultmessage = 'COMPILE ERROR';
        db.beginTransactionSync();
        var ans3 = db.querySync("UPDATE usrs SET submitproblemcount = submitproblemcount + 1 WHERE userid = '" + String(user) + "'");
        db.commitTransactionSync();

      } else {
        resultmessage = 'WRONG ANSWER';
        db.beginTransactionSync();
        var ans4 = db.querySync("UPDATE usrs SET submitproblemcount = submitproblemcount + 1 WHERE userid = '" + String(user) + "'");
        db.commitTransactionSync();

      }
      db.beginTransactionSync();
      var query = db.querySync("insert into submit values(submit_submitid_seq.nextval,'" + String(user) + "'," + String(req.params.id) + ",'" + program.language + "','" + req.body.code + "','" + resultmessage + "'," + body.cpuTime + "," + body.memory + ",(SELECT TO_CHAR(systimestamp, 'YYYY-MM-DD HH:MI:SS') FROM dual));");
      db.commitTransactionSync();
      res.send('<script>alert("' + resultmessage + '"); location.href = "../viewProblem/' + key + '";</script>');
    });
});

router.get('/temp', function(req, res, next) {
  res.render('temp');
});

router.get('/start', function(req, res, next) {
  var sess = req.session;
  console.log(req.session.userid);
  if (String(req.session.userid) == 'undefined') {
    res.send('<script>alert("세션이 유효하지 않습니다. 로그인 해주세요."); location.href = "/";</script>');
  }
  res.render('start', {
    sess: sess
  });
});

router.get('/makeProblem', function(req, res, next) {
  var session = req.session;
  if (String(req.session.userid) == 'undefined') {
    res.send('<script>alert("세션이 유효하지 않습니다. 로그인 해주세요."); location.href = "/";</script>');
  }
  res.render('makeProblem');
});

router.post('/makeProblem', function(req, res, next) {
  var sess = req.session;
  var input = req.body;

  var sql = "INSERT INTO problems VALUES(PROBLEMS_SEQ.NEXTVAL, '" + input.problemName + "' , '" + input.problemContent + "' , '" + input.problemSampleInput + "' , '" + input.problemSampleOutput + "' , '" + input.problemInput + "' , '" + input.problemOutput + "' , " + parseFloat(input.timeLimit) + " , " + parseInt(input.memoryLimit) + ");";

  db.query(sql, function(err, rows, moreResultSets) {
    if (err) {
      console.log(err);
      res.send('<script>alert("문제 생성 중 오류가 발생했습니다."); location.href = "viewProblem"; </script>');
    } else {
      res.send('<script>alert("문제가 생성되었습니다!"); location.href = "viewProblem"; </script>');
    }
  });
});
router.get('/viewProblem', function(req, res, next) {
  var sess = req.session;
  if (String(req.session.userid) == 'undefined') {
    res.send('<script>alert("세션이 유효하지 않습니다. 로그인 해주세요."); location.href = "/";</script>');
  }
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

router.get('/viewProblem/:id', function(req, res, next) {
  var user = req.session.userid;
  if (String(req.session.userid) == 'undefined') {
    res.send('<script>alert("세션이 유효하지 않습니다. 로그인 해주세요."); location.href = "/";</script>');
  }
  var sql = "SELECT * FROM problems WHERE TO_NUMBER(problemid) = " + String(req.params.id);
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
  var user = req.session.userid;
  if (String(req.session.userid) == 'undefined') {
    res.send('<script>alert("세션이 유효하지 않습니다. 로그인 해주세요."); location.href = "/";</script>');
  }
  res.render('makeContest');
});

router.post('/postContest', function(req, res, next) {
  var sess = req.session;
  var input = req.body;
  if (String(req.session.userid) == 'undefined') {
    res.send('<script>alert("세션이 유효하지 않습니다. 로그인 해주세요."); location.href = "/";</script>');
  }
  console.log(input);
  var contestsql = db.querySync("insert into contest values(contest_contestid_seq.nextval,'" + sess.userid + "','" + input.contestName + "' , '" + input.contestExplain + "',REPLACE('" + input.startTime + "', 'T', ' '),REPLACE('" + input.endTime + "', 'T', ' '));");

  var contestidrow = db.querySync("SELECT contestid FROM (SELECT * FROM contest ORDER BY contestid DESC) WHERE ROWNUM = 1;")
  var contestid = parseInt(contestidrow[0].CONTESTID);
  console.log(contestid);

  var contestmembers = req.body.contestMembers;
  var conMemSplit = contestmembers.split('\r\n');
  for (var i in conMemSplit) {
    db.querySync("INSERT INTO contestjoiners VALUES(" + contestid + ", '" + String(conMemSplit[i]) + "')"); // 쿼리에서 알맞은 위치에 추가
  }
  var contestproblems = req.body.contestProblems;
  var conProbSplit = contestproblems.split('\r\n');
  for (var i in conProbSplit) {
    db.querySync("INSERT INTO contestproblems VALUES(" + contestid + ", " + conProbSplit[i] + ")"); // 쿼리에서 알맞은 위치에 추가
  }
  res.send('<script>alert("대회가 생성되었습니다!"); location.href = "/viewContest";</script>');
});

router.get('/viewContest', function(req, res, next) {
  if (String(req.session.userid) == 'undefined') {
    res.send('<script>alert("세션이 유효하지 않습니다. 로그인 해주세요."); location.href = "/";</script>');
  }
  var rows = db.querySync("SELECT contestid, title, explain, createrid, TO_CHAR(starttime, 'YYYY-MM-DD HH:MI') AS go, TO_CHAR(endtime, 'YYYY-MM-DD HH:MI') AS stop FROM contest");
  res.render('viewContest', {
    rows: rows
  });
});
router.get('/viewContest/:id', function(req, res, next) {
  if (String(req.session.userid) == 'undefined') {
    res.send('<script>alert("세션이 유효하지 않습니다. 로그인 해주세요."); location.href = "/";</script>');
  }



  db.beginTransactionSync();
  var contestrows = db.querySync("SELECT contestid, title, explain, createrid, TO_CHAR(starttime, 'YYYY-MM-DD HH:MI') AS go, TO_CHAR(endtime, 'YYYY-MM-DD HH:MI') AS stop FROM contest WHERE contestid = " + req.params.id);
  db.beginTransactionSync();
  var joinersql = "SELECT contestjoinerid FROM contestjoiners WHERE contestid = " + req.params.id + " ORDER BY contestjoinerid ASC";
  var joinerrows = db.querySync(joinersql);
  db.commitTransactionSync();
  var problemsql = "SELECT problemid FROM contestproblems WHERE contestid = " + String(req.params.id) + " ORDER BY problemid ASC";
  db.beginTransactionSync();
  var problemrows = db.querySync(problemsql);
  db.commitTransactionSync();
  var problemnamesql = "SELECT problemname FROM problems WHERE problemid IN (SELECT problemid FROM contestproblems WHERE contestid = " + req.params.id + ") ORDER BY problemid ASC";
  db.beginTransactionSync();
  var problemnamerows = db.querySync(problemnamesql);
  db.commitTransactionSync();
  var sql = "SELECT contestjoinerid, problemid, SUM(DECODE(result, 'CORRECT', 0, NVL2(result, 1, 0))) AS wrongcount, MIN(DECODE(result, 'CORRECT', submittime)) - (SELECT starttime FROM contest WHERE contestid = " + req.params.id + ") AS timediff FROM ((SELECT * FROM (SELECT contestjoinerid FROM contestjoiners WHERE contestid = " + req.params.id + ") u NATURAL JOIN (SELECT problemid FROM contestproblems WHERE contestid = " + req.params.id + ") p) d LEFT OUTER JOIN (SELECT * FROM submit WHERE submittime BETWEEN (SELECT starttime FROM contest WHERE contestid = " + req.params.id + ") AND (SELECT endtime FROM contest WHERE contestid = " + req.params.id + ")) s ON (contestjoinerid = submituserid AND problemid = submitproblemid)) GROUP BY (contestjoinerid, problemid) ORDER BY contestjoinerid, problemid;";
  db.beginTransactionSync();
  var rows = db.querySync(sql);
  db.commitTransactionSync();


  var penalty = 10;
  for (var k = 0; k < joinerrows.length; k++) {
    joinerrows[k].PASSCOUNT = 0;
    joinerrows[k].TOTALPENALTY = 0;
  }
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].TIMEDIFF != null) {
      rows[i].TIMEDIFF = to_minute(rows[i].TIMEDIFF);
      rows[i].ACCEPT = true;
      for (var j = 0; j < joinerrows.length; j++) {
        if (rows[i].CONTESTJOINERID == joinerrows[j].CONTESTJOINERID) {
          joinerrows[j].PASSCOUNT = joinerrows[j].PASSCOUNT + 1;
          joinerrows[j].TOTALPENALTY = joinerrows[j].TOTALPENALTY + rows[i].TIMEDIFF;
        }
      }
    } else {
      rows[i].TIMEDIFF = 0;
      rows[i].ACCEPT = false;
    }
    rows[i].TIMEDIFF += rows[i].WRONGCOUNT * penalty;

  }
  res.render('contestInfo', {
    contestrows: contestrows,
    rows: rows,
    joinerrows: joinerrows,
    problemrows: problemrows,
    problemnamerows: problemnamerows
  });
});
router.get('/myContest', function(req, res, next) {
  if (String(req.session.userid) == 'undefined') {
    res.send('<script>alert("세션이 유효하지 않습니다. 로그인 해주세요."); location.href = "/";</script>');
  }
  var rows = db.querySync("SELECT contestid, title, explain, createrid, TO_CHAR(starttime, 'YYYY-MM-DD HH:MI') AS go, TO_CHAR(endtime, 'YYYY-MM-DD HH:MI') AS stop FROM contest WHERE contestid IN (SELECT contestid FROM contestjoiners WHERE contestjoinerid = '" + String(req.session.userid) + "')");
  res.render('viewContest2', {
    rows: rows
  });
});
router.get('/problemInfo', function(req, res, next) {
  if (String(req.session.userid) == 'undefined') {
    res.send('<script>alert("세션이 유효하지 않습니다. 로그인 해주세요."); location.href = "/";</script>');
  }
  res.render('problemInfo');
});
router.get('/viewRanking', function(req, res, next) {
  var sess = req.session;
  if (String(req.session.userid) == 'undefined') {
    res.send('<script>alert("세션이 유효하지 않습니다. 로그인 해주세요."); location.href = "/";</script>');
  }
  var rows = db.querySync("SELECT NAME, PASSPROBLEMCOUNT, SUBMITPROBLEMCOUNT, ROUND(PASSPROBLEMCOUNT / SUBMITPROBLEMCOUNT, 4) * 100 AS ANSWERRATE FROM USRS WHERE SUBMITPROBLEMCOUNT <> 0 ORDER BY PASSPROBLEMCOUNT DESC;");

  res.render('viewRanking', {
    rows: rows
  });
});
router.get('/rival', function(req, res, next) {
  var sess = req.session;
  if (String(req.session.userid) == 'undefined') {
    res.send('<script>alert("세션이 유효하지 않습니다. 로그인 해주세요."); location.href = "/";</script>');
  }
  var rows = db.querySync("SELECT * FROM usrs INNER JOIN (SELECT submituserid, (utl_match.edit_distance_similarity(original, other)-1) AS sim FROM (SELECT LISTAGG(submitproblemid, ',') WITHIN GROUP(ORDER BY submitproblemid) AS original FROM submit WHERE result = 'CORRECT' AND submituserid = '" + String(req.session.userid) + "' GROUP BY submituserid) NATURAL JOIN (SELECT submituserid, LISTAGG(submitproblemid, ',') WITHIN GROUP(ORDER BY submitproblemid) other FROM submit WHERE result = 'CORRECT' AND submituserid <> '" + String(req.session.userid) + "' GROUP BY submituserid)) ON userid = submituserid WHERE ROWNUM <= 5 ORDER BY sim DESC;");

  res.render('rival', {
    rows: rows
  });
});
module.exports = router;
