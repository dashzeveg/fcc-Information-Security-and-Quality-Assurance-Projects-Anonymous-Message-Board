/*
*
*
*       Complete the handler logic below
*       
*       
*/
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const CONNECTION_STRING = process.env.DB;

function StockHandler() {
  this.default = function(req, res){
    res.send('hihi')
  };
  
  this.threadList = function(req, res) {
    let board = req.params.board;
    
    MongoClient.connect(CONNECTION_STRING, function(err, db) {
      if(err){
        res.json({"message": "db connection error", "error": err});
      }else{
        let query = {};
        db.collection("anonymousmessageboard_"+board).find(query, {reported: 0, delete_password: 0, "replies.delete_password": 0, "replies.reported": 0})
        .sort({bumped_on: -1})
        .limit(10)
        .toArray(function(err, docs) {
          db.close();
          if(err){
            res.json({"message": "Error occurred while finding", "error": err});
          }else{
            docs.forEach(function(doc){
              doc.replycount = doc.replies.length;
              if(doc.replies.length > 3) {
                doc.replies = doc.replies.slice(-3);
              }
            });
            res.json(docs);
          }
        });
      }
    });
  };
  
  this.newThread = function(req, res) {
    let board = req.params.board;
    
    MongoClient.connect(CONNECTION_STRING, function(err, db) {
      if(err){
        res.json({"message": "db connection error", "error": err});
      }else{
        let query = { 
          text: req.body.text,
          created_on: new Date(),
          bumped_on: new Date(),
          reported: false,
          delete_password: req.body.delete_password,
          replies: []
        };
        db.collection("anonymousmessageboard_"+board).insertOne(query, function(err, doc) {
          db.close();
          if(err){
            res.json({"message": "Error occurred while inserting", "error": err});
          }else{ 
            res.redirect('/b/'+board+'/');
          }
        });
      }
    });
  };
  
  this.reportThread = function(req, res){
    let board = req.params.board;
    
    MongoClient.connect(CONNECTION_STRING, function(err, db) {
      if(err){
        res.json({"message": "db connection error", "error": err});
      }else{
        let query = {_id: new ObjectId(req.body.thread_id)};
        db.collection("anonymousmessageboard_"+board).findAndModify(
          query,
          [],
          {$set: {reported: true}},
          function(err, doc) {
            db.close();
            if(err){
              res.json({"message": "Error occurred while findAndModify", "error": err});
            }else{
              res.json({"message": "reported"});
            }
          }
        );
      }
    });
  };
  
  this.deleteThread = function(req, res){
    let board = req.params.board;
    
    MongoClient.connect(CONNECTION_STRING, function(err, db) {
      if(err){
        res.json({"message": "db connection error", "error": err});
      }else{
        let query = {_id: new ObjectId(req.body.thread_id), delete_password: req.body.delete_password};
        db.collection("anonymousmessageboard_"+board).findAndModify(
          query,
          [],
          {},
          {remove: true, new: false},
          function(err, doc) {
            db.close();
            if(err){
              res.json({"message": "Error occurred while findAndModify", "error": err});
            }else{
              if (doc.value === null) {
                res.json({"message": "incorrect password"});
              } else {
                res.json({"message": "success"});
              }
            }
          }
        );
      }
    });
  };
  
  this.replyList = function(req, res) {
    let board = req.params.board;
    
    MongoClient.connect(CONNECTION_STRING, function(err, db) {
      if(err){
        res.json({"message": "db connection error", "error": err});
      }else{
        let query = {_id: new ObjectId(req.query.thread_id)};
        db.collection("anonymousmessageboard_"+board).find(query, {reported: 0, delete_password: 0, "replies.delete_password": 0, "replies.reported": 0})
        .toArray(function(err, docs) {
          db.close();
          if(err){
            res.json({"message": "Error occurred while finding", "error": err});
          }else{
            res.json(docs[0]);
          }
        });
      }
    });
  };
  
  this.newReply = function(req, res){
    let board = req.params.board;

    MongoClient.connect(CONNECTION_STRING, function(err, db) {
      if(err){
        res.json({"message": "db connection error", "error": err});
      }else{
        let reply = {
          _id: new ObjectId(),
          text: req.body.text,
          created_on: new Date(),
          reported: false,
          delete_password: req.body.delete_password
        };
        
        db.collection("anonymousmessageboard_"+board).findAndModify(
          {_id: new ObjectId(req.body.thread_id)},
          [],
          {$set: { bumped_on: new Date() }, $push: { replies: reply }},
          function(err, doc) {
            db.close();
            if(err){
              res.json({"message": "Error occurred while findAndModify", "error": err});
            }else{
              res.redirect('/b/'+board+'/'+req.body.thread_id);
            }
          }
        );
      }
    });
  };
  
  this.reportReply = function(req, res){
    let board = req.params.board;
    
    MongoClient.connect(CONNECTION_STRING, function(err, db) {
      if(err){
        res.json({"message": "db connection error", "error": err});
      }else{
        let query = {_id: new ObjectId(req.body.thread_id),
          "replies._id": new ObjectId(req.body.reply_id)};
        db.collection("anonymousmessageboard_"+board).findAndModify(
          query,
          [],
          { $set: { "replies.$.reported": true } },
          function(err, doc) {
            db.close();
            if(err){
              res.json({"message": "Error occurred while findAndModify", "error": err});
            }else{
              res.json({"message": "reported"});
            }
          }
        );
      }
    });
  };
  
  
  this.deleteReply = function(req, res){
    let board = req.params.board;
    
    MongoClient.connect(CONNECTION_STRING, function(err, db) {
      if(err){
        res.json({"message": "db connection error", "error": err});
      }else{
        let query = {
          _id: new ObjectId(req.body.thread_id),
          replies: { $elemMatch: { _id: new ObjectId(req.body.reply_id), delete_password: req.body.delete_password } }
        };
        db.collection("anonymousmessageboard_"+board).findAndModify(
          query,
          [],
          { $set: { "replies.$.text": "[deleted]" } },
          function(err, doc) {
            db.close();
            if(err){
              res.json({"message": "Error occurred while findAndModify", "error": err});
            }else{
              if (doc.value === null) {
                res.json({"message": "incorrect password"});
              } else {
                res.json({"message": "success"});
              }
            }
          }
        );
      }
    });
  };
  
}

module.exports = StockHandler;