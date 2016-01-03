var me = {
  config: {
    host: window.location.hostname,
    isSecure: window.location.protocol === "https:",
    appname: null
  },
  baseurl: './'
};

require.config({
  baseUrl: me.baseurl,
  paths: {
    qsocks: 'js/qsocks.bundle',
    serializeApp: 'js/serialize.bundle',
    dataTables: 'js/jquery.dataTables'
  }
});

var main = {};

require(['jquery', 'qsocks', 'serializeApp', 'dataTables'], function($, qsocks, serializeApp, DataTable) {

  $('#open').prop('disabled', true);
  $('#go').prop('disabled', true);
  $('#serialize').prop('disabled', true);
  $('#json').prop('disabled', true);
  $('#loadingImg').css('display', 'inline-block');

  var appInfos = [];
  var backupInfos = [];
  var selectedAppText;
  var backupContent, loadScript, properties;
  var status = {
    forUpdate: [],
    forDelete: [],
    forInsert: []
  };
  var importData = new Array();
  var fileInput = document.getElementById("json");

  var appConfig = {
    host: window.location.hostname,
    isSecure: window.location.protocol === "https:",
    appname: null
  };

  var readFile = function() {
    var reader = new FileReader();
    reader.onload = function() {
      backupContent = JSON.parse(reader.result);
      loadScript = backupContent.loadScript;
      properties = backupContent.properties;

      for (var name in backupContent) {
        switch (name) {
          case "sheets":
          case "stories":
          case "masterobjects":
            for (var i = 0; i < backupContent[name].length; i++) {
              backupInfos.push({
                info: backupContent[name][i].qProperty.qInfo,
                data: backupContent[name][i]
              })
            }
            break;
          case "dimensions":
          case "measures":
          case "snapshots":
          case "bookmarks":
          case "variables":
            for (var i = 0; i < backupContent[name].length; i++) {
              backupInfos.push({
                info: backupContent[name][i].qInfo,
                data: backupContent[name][i]
              })
            }
            break;
            // case "dataconnections":
            //     for (var i = 0; i < backupContent[name].length; i++) {
            //         backupInfos.push({
            //             info: {
            //                 qId: backupContent[name][i].qConnection.qId,
            //                 qType: backupContent[name][i].qConnection.qType
            //             },
            //             data: backupContent[name][i]
            //         })
            //     }
            //     break;
        }
      }

      for (var i = 0; i < appInfos.qInfos.length; i++) {
        var present = false;
        var d;
        for (var a = 0; a < backupInfos.length; a++) {
          if (appInfos.qInfos[i].qId == backupInfos[a].info.qId) {
            present = true;
            d = backupInfos[a];
          }
        }
        if (present == true) {
          status.forUpdate.push(d)
        } else {
          if (appInfos.qInfos[i].qType != 'folder' && appInfos.qInfos[i].qType != 'internet' && appInfos.qInfos[i].qType != 'ODBC' && appInfos.qInfos[i].qType != 'OLEDB') {
            status.forDelete.push(appInfos.qInfos[i])
          }
        }
      }

      for (var a = 0; a < backupInfos.length; a++) {
        var present1 = false;
        for (var i = 0; i < appInfos.qInfos.length; i++) {
          if (appInfos.qInfos[i].qId.toString() === backupInfos[a].info.qId.toString()) {
            present1 = true;
          }
        }

        if (present1 == false) {
          status.forInsert.push(backupInfos[a])
        }
      }

      $('#prestatus').html('');
      $('#prestatus').append('For delete: ' + status.forDelete.length + '; ');
      $('#prestatus').append('For insert: ' + status.forInsert.length + '; ');
      $('#prestatus').append('For update: ' + status.forUpdate.length + '; ');
      $('#go').prop('disabled', false);
      $('#serialize').prop('disabled', false);
    };
    reader.readAsBinaryString(fileInput.files[0]);
  };

  fileInput.addEventListener('change', readFile);

  function deleteObjects() {
    return Promise.all(status.forDelete.map(function(d) {
      //console.log(d.qType)
      if (d.qType === 'measure') {
        return main.app.destroyMeasure(d.qId).then(function() {
          return importData.push([d.qType, '', d.qId, 'delete']);
        });
      } else if (d.qType === 'dimension') {
        return main.app.destroyDimension(d.qId).then(function() {
          return importData.push([d.qType, '', d.qId, 'delete']);
        });
      } else if (d.qType === 'snapshot' || d.qType === 'bookmark') {
        return main.app.destoryBookmark(d.qId).then(function() {
          return importData.push([d.qType, '', d.qId, 'delete']);
        });
      } else if (d.qType === 'variable') {
        return main.app.destroyVariableById(d.qId).then(function() {
          return importData.push([d.qType, '', d.qId, 'delete']);
        });
      } else {
        return main.app.destroyObject(d.qId).then(function() {
          return importData.push([d.qType, '', d.qId, 'delete']);
        });
      }
    }));
  }

  function insertObjects() {
    return Promise.all(status.forInsert.map(function(d) {
      if (d.info.qType === 'measure') {
        return main.app.createMeasure(d.data).then(function(msg) {
          return importData.push(['measure', d.data.qMetaDef.title, d.info.qId, 'create']);
        });
      } else if (d.info.qType === 'dimension') {
        return main.app.createDimension(d.data).then(function(msg) {
          return importData.push(['dimension', d.data.qMetaDef.title, d.info.qId, 'create']);
        })
      } else if (d.info.qType === 'variable') {
        return main.app.createVariableEx(d.data).then(function(msg) {
          return importData.push(['variable', d.data.qName, d.info.qId, 'create']);
        })
      } else if (d.info.qType === 'snapshot' || d.info.qType === 'bookmark') {
        return main.app.createBookmark(d.data).then(function(msg) {
          var snapTitle;
          if (d.data.qMetaDef.title) {
            snapTitle = d.data.qMetaDef.title;
          } else {
            snapTitle = "Untitled";
          }
          return importData.push(['snapshot', snapTitle, d.info.qId, 'create']);
        })
      } else if (d.data.qProperty) {
        return main.app.createObject(d.data.qProperty).then(function(handle) {
          return handle.setFullPropertyTree(d.data).then(function() {
            return importData.push([d.info.qType, '', d.info.qId, 'create']);
          });
        })
      }
    }))
  }

  function updateObjects() {
    return Promise.all(status.forUpdate.map(function(d) {
      if (d.info.qType === 'measure') {
        return main.app.getMeasure(d.info.qId).then(function(obj) {
          return obj.setProperties(d.data).then(function(msg) {
            return importData.push(['measure', d.data.qMetaDef.title, d.info.qId, 'modify']);
          });
        })
      } else if (d.info.qType === 'dimension') {
        return main.app.getDimension(d.info.qId).then(function(obj) {
          return obj.setProperties(d.data).then(function(msg) {
            return importData.push(['dimension', d.data.qMetaDef.title, d.info.qId, 'modify']);
          });
        })
      } else if (d.info.qType === 'variable') {
        // qDef = JSON.stringify(d.data.qDefinition);
        // qName = JSON.stringify(d.data.qName);
        // var patches = [{
        //         "qOp": "replace",
        //         "qPath": "/qDefinition",
        //         "qValue": qDef
        //       },{
        //         "qOp": "replace",
        //         "qPath": "/qName",
        //         "qValue": qName
        //       }];

        return main.app.getVariableById(d.info.qId).then(function(obj) {
          return obj.setProperties(d.data).then(function(msg) {
              return importData.push(['variable', d.data.qName, d.info.qId, 'modify']);
          });
        })
      } else if (d.info.qType === 'snapshot' || d.info.qType === 'bookmark') {
        return main.app.getBookmark(d.info.qId).then(function(obj) {
          return obj.setProperties(d.data).then(function(msg) {
            if (d.info.qType === 'snapshot') {
              return importData.push([d.info.qType, d.data.title, d.info.qId, 'modify']);
            } else {
              return importData.push([d.info.qType, d.data.qMetaDef.title, d.info.qId, 'modify']);
            }
          });
        })
      } else
      if (d.info.qType === 'masterobject') {
        return main.app.getObject(d.info.qId).then(function(obj) {
          return obj.setProperties(d.data.qProperty).then(function(msg) {
            return importData.push(['masterobject', d.data.qProperty.qMetaDef.title, d.info.qId, 'modify']);
          });
        })
      }
      //  else if (d.info.qType === 'folder') {
      //     return main.app.modifyConnection(d.info.qId, d.data.qConnection.qName, d.data.qConnection.qConnectionString, d.data.qConnection.qType).then(function(msg) {
      //         return importData.push(['data connector', d.data.qConnection.qName, d.info.qId, 'modify']);
      //     }).catch(function(error) {
      //         return console.log(error)
      //     });
      // }
      else if (d.data.qProperty && d.info.qType != 'folder' && d.info.qType != 'internet' && d.info.qType != 'ODBC' && d.info.qType != 'OLEDB') {
        return main.app.getObject(d.info.qId).then(function(obj) {
          return obj.setFullPropertyTree(d.data).then(function(msg) {
            return importData.push([d.info.qType, d.data.qProperty.qMetaDef.title, d.info.qId, 'modify']);
          });
        })
      }

    }));
  }

  function setScript() {
    return main.app.setScript(loadScript).then(function() {
      return importData.push(['load script', '', '', 'modify']);
    })
  }

  function setAppProperties() {
    return main.app.setAppProperties(properties).then(function() {
      return importData.push(['app properties', '', '', 'modify']);
    })
  }

  function GenerateTable() {
    var t = $('#resultTable').DataTable();
    for (var i = 0; i < importData.length; i++) {
      t.row.add(importData[i]).draw(false);
    }

    $('#loadingImg').css('display', 'none');
  }

  var qSocksConnect = function() {
    return qsocks.Connect(appConfig).then(function(global) {
      return main.global = global;
    })
  }

  function getVariables(app) {

            return app.createSessionObject({
                    qVariableListDef: {
                            qType: 'variable',
    			qShowReserved: false,
    			qShowConfig: false,
                            qData: {
                                    info: '/qDimInfos'
                            },
                            qMeta: {}
                    },
                    qInfo: { qId: "VariableList", qType: "VariableList" }
            }).then(function (list) {
                    return list.getLayout().then(function (layout) {
                            return Promise.all(layout.qVariableList.qItems.map(function (d) {
                                    return app.getVariableById(d.qInfo.qId).then(function (variable) {
                                            return variable.getProperties().then(function(properties) { return properties; });
                                    });
                            }));
                    });
            });

    };

  $("#open").on("click", function() {
    $('#openDoc').css('visibility', 'hidden');
    $('#loadingImg').css('display', 'inline-block');

    var selectedApp = $('#docList').find(":selected").val();
    selectedAppText = $('#docList').find(":selected").text();

   //if( main.app ) {
       main.global.connection.ws.close();
   //}

   qSocksConnect().then(function() {
    main.global.openDoc(selectedApp)
      .then(function(app) {
        main.app = app;

      })
      .then(function() {
        return main.app.getAllInfos()
      })
      .then(function(info) {

        appInfos = info;
        //console.log(JSON.stringify(appInfos))
        main.app.getConnections().then(function(connections) {
          for (var i = 0; i < connections.length; i++) {
            appInfos.qInfos.push({
              qId: connections[i].qId,
              qType: connections[i].qType
            })
          }

          getVariables(main.app).then(function(variables) {
            // console.log(variables)

            for (var i = 0; i < variables.length; i++) {
              appInfos.qInfos.push({
                qId: variables[i].qInfo.qId,
                qType: variables[i].qInfo.qType
              })
            }

          })

          $('#json').prop('disabled', false);
          $('#loadingImg').css('display', 'none');
          $('#openDoc').css('visibility', 'visible');
          $('#serialize').prop('disabled', false);
          $('#openDoc').text('"' + selectedAppText + '"' + ' open');
        })
      })
    })
  });

  $('#resultTable').DataTable({
      "scrollY": "400px",
      "scrollCollapse": true,
      "paging": false
    });

  $("#serialize").on("click", function() {
    $('#loadingImg').css('display', 'inline-block');
    serializeAppBundle(main.app).then(function(data) {

      var d = new Date();
      var dformat = d.getFullYear() + "" + ("00" + (d.getMonth() + 1)).slice(-2) + "" +
        ("00" + d.getDate()).slice(-2) + "-" +
        ("00" + d.getHours()).slice(-2) + "" +
        ("00" + d.getMinutes()).slice(-2) + "" +
        ("00" + d.getSeconds()).slice(-2);

      $('#loadingImg').css('display', 'none');
      data = JSON.stringify(data, null, 2);
      var a = window.document.createElement('a');
      a.href = window.URL.createObjectURL(new Blob([data], {
        type: 'text/json'
      }));
      a.download = selectedAppText + '_' + dformat + '.json';
      a.text = 'Download';
      a.click();
    })
  })

  $("#go").on("click", function() {
    $('#loadingImg').css('display', 'inline-block');
    var table = $('#resultTable').DataTable();

    var rows = table
      .rows()
      .remove()
      .draw();

    Promise.all([
        deleteObjects(),
        insertObjects(),
        updateObjects(),
        setScript(),
        setAppProperties()
      ])
      .then(function(results) {
        main.app.doSave().then(function(results) {
        GenerateTable()
      });
      });

  })

  // qsocks.Connect(appConfig).then(function(global) {
  //   return main.global = global;
  // })
  qSocksConnect().then(function() {
    return main.global.getDocList()
  }).then(function(docList) {

    for (var i = 0; i < docList.length; i++) {
      $('#docList')
        .append($("<option></option>")
          .attr("value", docList[i].qDocId)
          .text(docList[i].qDocName));
    }

    $('#loadingImg').css('display', 'none');
    $('#open').prop('disabled', false);
  })

});
