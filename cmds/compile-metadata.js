/* compile-metadata commander component
 * To use add require('../cmds/compile-metadata.js')(program) to your commander.js based node executable before program.parse
 */
'use strict';

var util 							= require('../lib/util').instance;
var Project 					= require('../lib/project');
var Metadata 					= require('../lib/metadata');

module.exports = function(program) {

	program
		.command('compile-metadata')
		.alias('compile')
		.version('0.0.1')
		.description('Compiles metadata')
		.action(function(/* Args here */){
			
			var self = this;

			util.getPayload()
				.then(function() {
					global.project = new Project();
					return global.project.initialize();
				})
				.then(function() {
					var metadata = Metadata.classify(global.payload.files);
					return global.sfdcClient.toolingCompile(metadata);
				})
				.then(function(result) {
					util.respond(self, result);
				})
				['catch'](function(error) {
					util.respond(self, 'Could not compile metadata', false, error);
				})
				.done();	
		});
	
};