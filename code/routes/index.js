var express = require('express');
var router = express.Router();

var db = require("odbc")(),
  cn = "DRIVER={Tibero 6 ODBC Driver};SERVER=localhost;PORT=8629;DB=tibero;UID=HR;PWD=tibero";

/* GET home page. */
router.get('/', function(req, res, next) {
  db.open(cn, function (err) {
    if (err) {
        return console.log(err);
    }
    else{
      console.log("Connection Success!!");
    }
    //we now have an open connection to the database
    db.query("SELECT * FROM employees", function (err, rows, moreResultSets) {
    if (err) {
        return console.log(err);
    }

    console.log(rows);

    //if moreResultSets is truthy, then this callback function will be called
    //again with the next set of rows.
});
});

  res.render('index', { title: 'Express' });
});

module.exports = router;
