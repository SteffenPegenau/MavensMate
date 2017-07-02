'use strict';
angular.module('testClassGenerator', [])
    .config(function ($interpolateProvider) {
        $interpolateProvider.startSymbol('{[{').endSymbol('}]}');
    })
    .controller('testClassGeneratorController', ['$scope', '$http', function ($scope, $http) {
        var ctr = this;

        ctr.description = null;

        ctr.prefix = "ArlUtd";
        ctr.date = _todayFormated();
        ctr.initials = "cpe";
        ctr.classToAdd = "";

        ctr.newClass = {};
        ctr.newClass.type = "";
        ctr.newClass.title = "";
        ctr.newClass.createNew = false;
        ctr.newClass.key = "";

        ctr.filterChangeableFields = function(field) {
            return !field.calculated && field.createable;
        };

        ctr.tree = $("#tree").dynatree({
            onActivate: function (node) {
                // Only child nodes are interesting...
                if (node.parent.parent != null) {
                    ctr.newClass.type = node.data.type;
                    ctr.newClass.createNew = node.data.createNew;
                    ctr.newClass.title = node.data.title;
                    ctr.newClass.key = node.data.type + '-' + node.data.title;
                    ctr.description = node.parent.data.description;
                    $scope.$digest();
                }
            },
            //persist: false,
            children: [],
            debugLevel: 2
        });

        ctr.addClass = function (className) {
            console.log("called " + className);
            _getDescription(className)
                .then(function (desc) {
                    ctr.description = desc;
                    console.log(ctr.description);
                    var classObj = {
                        title: className,
                        isFolder: true,
                        children: [
                            {
                                title: "New Instance...",
                                type: className,
                                createNew: true,
                            }
                        ],
                        key: className,
                        description: ctr.description
                    };
                    //children.push(classObj);
                    var node = $("#tree").dynatree("getRoot");
                    var childNode = node.addChild(classObj);

                    // Remove from Select List
                    $("#option-" + className).remove();
                });

        };

        ctr.addInstance = function () {
            ctr.newClass.createNew = false;
            ctr.newClass.key = ctr.newClass.type + '-' + ctr.newClass.title;
            console.log(ctr.newClass);
            var tree = $('#tree').dynatree('getTree');
            var node = tree.getNodeByKey(ctr.newClass.type);
            var child = node.addChild(ctr.newClass);
            try {
                child.activate();
            }
            catch (err) {
                //document.getElementById("demo").innerHTML = err.message;
            }

            //tree.activateKey(ctr.newClass.key);
        };

        ctr.updateInstance = function () {
            var node = $("#tree").dynatree("getActiveNode");
            node.data.title = ctr.newClass.title;
            node.render();
            console.log(node);
        };

        ctr.createFiles = function () {
            var node = $("#tree").dynatree("getRoot");
            console.log("Drin!");
            async.eachOfSeries(node.getChildren(), function (child, key, callback) {
                var subclasses = [];
                async.eachOfSeries(child.getChildren(), function (instance, i, cb) {
                    console.log(instance);
                    if (!instance.data.createNew) {
                        var obj = {
                            name: instance.data.title,
                        };
                        subclasses.push(obj);
                    }
                    cb();
                });

                var paramPayload = {
                    api_name: ctr.prefix + child.data.title,
                    creating_user: ctr.initials,
                    release_date: ctr.date,
                    base_name: child.data.title,
                    subclasses: subclasses,
                    fields: ctr.description.fields.filter(ctr.filterChangeableFields)
                };

                console.log(paramPayload);
                var opts = {
                    ajax: {
                        type: 'POST',
                        url: '/app/metadata',
                        data: JSON.stringify({
                            metadataTypeXmlName: 'ApexClass',
                            templateValues: paramPayload,
                            template: {
                                name: ctr.template,
                                file_name: $("option[value='" + ctr.template + "']").attr("file_name")
                            }
                        })
                    },
                    message: {
                        label: 'Creating new metadata for ' + paramPayload.api_name + '...'
                    }
                };


                mavensmate.request(opts)
                    .then(function (res) {
                        showToast(res.result.message, 'success');
                        callback();
                    }, function (err) {
                        console.error(err);
                        callback();
                    });

            }, function (err) {
                if (err) {
                    console.error(err);
                }
                hideLoading();
            });
        };

        function _getDescription(sObjName) {
            return new Promise(function (resolve, reject) {
                var url = '/app/testclassgenerator/description/' + sObjName + '?pid=' + findGetParameter('pid');
                $http.get(url)
                    .then(function (description) {
                        resolve(description.data);
                    }, function (err) {
                        reject(err);
                    });
            });

        }
        function findGetParameter(parameterName) {
            var result = null,
                tmp = [];
            location.search
                .substr(1)
                .split("&")
                .forEach(function (item) {
                    tmp = item.split("=");
                    if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
                });
            return result;
        }

        function _todayFormated() {
            var date = new Date();

            var day = (date.getDate() < 10) ? '0' + date.getDate() : date.getDate();
            var month = (date.getMonth() + 1 < 10) ? '0' + (date.getMonth() + 1) : date.getMonth() + 1;
            var year = date.getFullYear();

            return year + '-' + month + '-' + day;
        }
    }]);