/**
 * @file Controller for the test class generator UI
 * @author Steffen Pegenau <@SteffenPegenau>
 */

'use strict';
var express = require('express');
var router = express.Router();
var fs = require('fs');
var util = require('../lib/util');
var path = require('path');
var requestStore = require('../lib/request-store');
var logger = require('winston');
var TemplateService = require('../lib/services/template');

router.get('/new', function (req, res) {
  if (!req.project) {
    res.render('error', { error: 'Error: No project attached to this request.' });
  } else {
    _getObjectDefinitions(req.project).then(function (objects) {
      _getTemplates('ApexClass').then(function (templates) {
        res.render('testclassgenerator/new.html', {
          testClasses: null,
          title: 'Create Unit Test Data Generators',
          objects: objects,
          className: req.query.className,
          metadataType: 'ApexClass',
          templates: templates,
          prefix: 'ArlUtd',
          initials: 'cpe',
          today: _todayFormated()
        });
      });

    });

  }
});

router.get('/description/:sObj', function (req, res) {
  if (!req.project) {
    res.render('error', { error: 'Error: No project attached to this request.' });
  } else if (!req.params.sObj) {
    res.render('error', { error: 'Error: No sObj specified.' });
  } else {

    var sObjName = req.params.sObj;
    var self = req.project.sfdcClient;
    var url = '/services/data/v' + self.apiVersion + '/sobjects/' + sObjName + '/describe';
    return new Promise(function (resolve, reject) {
      self.conn.request({
        method: 'GET',
        url: url,
        headers: { 'Content-Type': 'application/json' }
      }).then(function (data) {
        //res.send('<pre>\n' + JSON.stringify(data, null, 4) + '</pre>');
        res.send(JSON.stringify(data));
        resolve();
      }, function (err) {
        reject(err);
      });
    });
    
  }
});

function _todayFormated() {
  var date = new Date();

  var day = (date.getDate() < 10) ? '0' + date.getDate() : date.getDate();
  var month = (date.getMonth() < 10) ? '0' + date.getMonth() : date.getMonth();
  var year = date.getFullYear();

  return year + '-' + month + '-' + day;
}

function _getObjectDefinitions(project) {
  var self = project.sfdcClient;
  var url = '/services/data/v' + self.apiVersion + '/sobjects';
  return new Promise(function (resolve, reject) {
    self.conn.request({
      method: 'GET',
      url: url,
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(function (res) {
      var ret = {};
      res.sobjects.forEach(function (element, index, array) {
        ret[element.name] = element
      });
      resolve(ret);
    });
  });

}

function _getTemplates(typeXmlName) {
  return new Promise(function (resolve, reject) {
    var templateService = new TemplateService();
    templateService.getTemplatesForType(typeXmlName)
      .then(function (templates) {
        resolve(templates);
      })
      .catch(function (e) {
        reject(new Error('Could not retrieve templates: ' + e.message));
      })
      .done();
  });
}
module.exports = router;