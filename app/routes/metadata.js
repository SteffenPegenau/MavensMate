/**
 * @file Controller for the metadata creation UIs
 * @author Joseph Ferraro <@joeferraro>
 */

'use strict';

var express         = require('express');
var router          = express.Router();
var Promise         = require('bluebird');
var requestStore    = require('../lib/request-store');
var logger          = require('winston');
var TemplateService = require('../lib/services/template');

router.get('/:type/new', function(req, res) {
  if (!req.project) {
    res.render('error', { error: 'Error: No project attached to this request.' });
  } else {
    _getTemplates(req.params.type)
      .then(function(templates) {
        logger.debug(templates);
        var locals = {
          templates : templates,
          metadataType: req.params.type,
          title: 'New '+req.params.type
        };
        res.render('metadata/new.html', locals);
      })
      .catch(function(e) {
        logger.error(e);function _getTemplates(typeXmlName) {
  return new Promise(function(resolve, reject) {
    var templateService = new TemplateService();
    templateService.getTemplatesForType(typeXmlName)
      .then(function(templates) {
        resolve(templates);
      })
      .catch(function(e) {
        reject(new Error('Could not retrieve templates: '+e.message));
      })
      .done();
  });
}
        res.render('metadata/new.html', {
          title: 'New Metadata'
        });
      })
      .done();
  }
});

router.get('/:type/templates/:fileName', function(req, res) {
  var templateService = new TemplateService();
  templateService.getTemplateBody(req.params.type, req.params.fileName)
    .then(function(body) {
      res.send(body);
    })
    .catch(function(e) {
      res.status(500).send('Error: '+e.message);
    })
    .done();
});

router.post('/', function(req, res) {
  var commandExecutor = req.app.get('commandExecutor');
  var obj = {
    project: req.project,
    name: 'new-metadata',
    body: req.body,
    editor: req.editor
  };
  console.log(obj);
  var request = commandExecutor.execute(obj);
  var requestId = requestStore.add(request);
  return res.send({
    status: 'pending',
    id: requestId
  });
});

function _getTemplates(typeXmlName) {
  return new Promise(function(resolve, reject) {
    var templateService = new TemplateService();
    templateService.getTemplatesForType(typeXmlName)
      .then(function(templates) {
        resolve(templates);
      })
      .catch(function(e) {
        reject(new Error('Could not retrieve templates: '+e.message));
      })
      .done();
  });
}

module.exports = router;