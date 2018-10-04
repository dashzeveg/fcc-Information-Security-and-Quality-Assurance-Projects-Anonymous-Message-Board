/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const expect = require('chai').expect;
const ConvertHandler = require('../controllers/convertHandler.js');

module.exports = function (app) {
  
  const convertHandler = new ConvertHandler();
  
  app.route('/api/threads/:board')
    .get(convertHandler.threadList)
    .post(convertHandler.newThread)
    .put(convertHandler.reportThread)
    .delete(convertHandler.deleteThread);
  
    
  app.route('/api/replies/:board')
    .get(convertHandler.replyList)
    .post(convertHandler.newReply)
    .put(convertHandler.reportReply)
    .delete(convertHandler.deleteReply);

};
