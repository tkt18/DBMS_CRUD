//use path module
const path = require("path");
//use express module
const express = require("express");
//use hbs view engine
const hbs = require("hbs");
//use bodyParser middleware
const bodyParser = require("body-parser");
//use mysql database
const app = express();
const sqlite3 = require("sqlite3");

const db = new sqlite3.Database("./database.sqlite", (err) => {
  if (err) {
    console.error("Erro opening database " + err.message);
  } else {
    db.run(
      "create table movies (\
            movieId integer constraint movies_pk primary key autoincrement,\
            title   varchar(255),\
            genres  varchar(255)\
        );",
      (err) => {
        if (err) {
          console.log(err);
        }
      }
    );
    db.run(
      "create table tags (\
            tagId integer constraint tags_pk primary key autoincrement,\
            tag   varchar(255)\
        );",
      (err) => {
        if (err) {
          console.log(err);
        }
      }
    );
    db.run(
      "create table genome_scores (\
            movieId   integer references movies on update cascade on delete cascade,\
            tagId     integer references tags on update cascade on delete cascade,\
            relevance float,\
            constraint genome_scores_pk primary key (movieId, tagId)\
        );",
      (err) => {
        if (err) {
          console.log(err);
        }
      }
    );
  }
});

//set views file
app.set("views", path.join(__dirname, "views"));
//set view engine
app.set("view engine", "hbs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//set folder public as static folder for static file
app.use("/assets", express.static(__dirname + "/public"));

//route for homepage
app.get("/", (req, res) => {
  db.all(
    "select m.title, t.tag, g.relevance, g.movieId, g.tagId from genome_scores g \
          join movies m on g.movieId = m.movieId \
          join tags t on g.tagId = t.tagId\
          limit 100;",
    [],
    (err, results) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      console.log(results);
      res.status(200).render("view", { results: results });
    }
  );
});

//route for insert data
app.post("/save/", (req, res) => {
  var reqBody = req.body;
  db.run(
    `INSERT INTO genome_scores (movieId, tagId, relevance) VALUES (?,?,?)`,
    [reqBody.movie_id, reqBody.tag_id, reqBody.relevance],
    function (err, result) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(200).redirect('/');
    }
  );
});
//route for update data
app.patch("/update/", (req, res, next) => {
  var reqBody = re.body;
  db.run(
    `UPDATE genome_scores set movieId = ?, tagId = ?, relevance = ? WHERE movieId = ?`,
    [reqBody.movie_id, reqBody.tag_id, reqBody.relevance],
    function (err, result) {
      if (err) {
        res.status(400).json({ error: res.message });
        return;
      }
      res.status(200).redirect('/');
    }
  );
});

//route for delete data
app.post('/delete',(req, res) => {
  console.log([req.body.movie_id, req.body.tag_id]);
  db.run(
    `DELETE FROM genome_scores WHERE movieId= ? AND tagId= ?`,
    [req.body.movie_id, req.body.tag_id],
    (err, result) => {
      
      if (err) {
        res.json({ error: err });
        return;
      }
      res.redirect('/');
    }
  );
});

//searching
app.get('/searching', function(req, res){

  // input value from search
  var val = req.query.search;
  var q = `SELECT * FROM ${req.query.table} where ${req.query.table === "movies" ? "title" : "tag"} LIKE '${req.query.search}%' LIMIT 20;`;
  // console.log(q);

  if(val === "" ){
    res.send("");
  }
  else{
    db.all(q, (err, rows) => {
      if (err) {
        res.status(400).json({"error":err.message});
        return;
      }
      res.send(rows);
    });
  }
 
 });

//server listening
app.listen(8000, () => {
  console.log("Server is running at port 8000");
});
