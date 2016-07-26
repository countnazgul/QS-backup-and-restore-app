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

require(['jquery', 'qsocks', 'serializeApp', 'dataTables'], function ($, qsocks, serializeApp, DataTable) {

  var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
      sURLVariables = sPageURL.split('&'),
      sParameterName,
      i;

    for (i = 0; i < sURLVariables.length; i++) {
      sParameterName = sURLVariables[i].split('=');

      if (sParameterName[0] === sParam) {
        return sParameterName[1] === undefined ? true : sParameterName[1];
      }
    }
  };

  var ticket = getUrlParameter('qlikTicket');

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
  var importErrors = 0;
  var fileInput = document.getElementById("json");

  var appConfig = {
    host: window.location.hostname,
    isSecure: window.location.protocol === "https:"
    //appname: ''
  };

  var readFile = function () {
    var reader = new FileReader();
    reader.onload = function () {
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
          case "dataconnections":
            for (var i = 0; i < backupContent[name].length; i++) {
              backupInfos.push({
                info: {
                  qId: backupContent[name][i].qConnection.qId,
                  qType: backupContent[name][i].qConnection.qType
                },
                data: backupContent[name][i]
              })
            }
            break;
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
          //if (appInfos.qInfos[i].qType != 'folder' && appInfos.qInfos[i].qType != 'internet' && appInfos.qInfos[i].qType != 'ODBC' && appInfos.qInfos[i].qType != 'OLEDB') {
          status.forDelete.push(appInfos.qInfos[i])
          //}
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
    return Promise.all(status.forDelete.map(function (d) {
      //console.log(d.qType)
      if (d.qType === 'measure') {
        return main.app.destroyMeasure(d.qId).then(function () {
          return importData.push([d.qType, '', d.qId, 'delete']);
        });
      } else if (d.qType === 'dimension') {
        return main.app.destroyDimension(d.qId).then(function () {
          return importData.push([d.qType, '', d.qId, 'delete']);
        });
      } else if (d.qType === 'snapshot' || d.qType === 'bookmark') {
        return main.app.destoryBookmark(d.qId).then(function () {
          return importData.push([d.qType, '', d.qId, 'delete']);
        });
      } else if (d.qType === 'variable') {
        return main.app.destroyVariableById(d.qId).then(function () {
          return importData.push([d.qType, '', d.qId, 'delete']);
        });

      } else if (d.qType === 'folder') {
        return main.app.deleteConnection(d.qId).then(function () {
          return importData.push([d.qType, '', d.qId, 'delete']);
        });
      } else {
        return main.app.destroyObject(d.qId).then(function () {
          return importData.push([d.qType, '', d.qId, 'delete']);
        });
      }
    }));
  }

  function insertObjects() {
    return Promise.all(status.forInsert.map(function (d) {
      //console.log(d.info.qType)
      if (d.info.qType === 'measure') {
        return main.app.createMeasure(d.data).then(function (msg) {
          return importData.push(['measure', d.data.qMetaDef.title, d.info.qId, 'create']);
        });
      } else if (d.info.qType === 'dimension') {
        return main.app.createDimension(d.data).then(function (msg) {
          return importData.push(['dimension', d.data.qMetaDef.title, d.info.qId, 'create']);
        })
      } else if (d.info.qType === 'variable') {
        return main.app.createVariableEx(d.data).then(function (msg) {
          return importData.push(['variable', d.data.qName, d.info.qId, 'create']);
        })
      } else if (d.info.qType === 'snapshot' || d.info.qType === 'bookmark') {
        return main.app.createBookmark(d.data).then(function (msg) {
          var snapTitle;
          if (d.data.qMetaDef.title) {
            snapTitle = d.data.qMetaDef.title;
          } else {
            snapTitle = "Untitled";
          }
          return importData.push(['snapshot', snapTitle, d.info.qId, 'create']);
        })
      } else if (d.info.qType == 'folder' || d.info.qType == 'internet' || d.info.qType == 'ODBC' || d.info.qType == 'OLEDB') {
        //console.log(d.info.qType)
        return main.app.createConnection({
              qId: d.data.qConnection.qId,
              qName: d.data.qConnection.qName,
              qConnectionString: d.data.qConnection.qConnectionString,
              qType: d.data.qConnection.qType,
              qUserName: d.data.qUserName,
              qPassword: d.data.qPassword,
              qModifiedDate: d.data.qConnection.qModifiedDate,
              qLogOn: d.data.qConnection.qLogOn
            }).then(function(msg) {
              //console.log(msg);
              return importData.push([d.info.qType, d.data.qConnection.qName, /*d.info.qId*/ msg, 'create']);
            }).catch(function (error) {
              //console.log(error)
              importErrors++;
              return importData.push([d.info.qType, d.data.qConnection.qName, d.info.qId, 'Error: ' + error.message]);
            })
      }
       else if (d.data.qProperty) {
        return main.app.createObject(d.data.qProperty).then(function (handle) {
          return handle.setFullPropertyTree(d.data).then(function () {
            return importData.push([d.info.qType, '', d.info.qId, 'create']);
          });
        })
      }
    }))
  }

  function updateObjects() {
    return Promise.all(status.forUpdate.map(function (d) {
      if (d.info.qType === 'measure') {
        return main.app.getMeasure(d.info.qId).then(function (obj) {
          return obj.setProperties(d.data).then(function (msg) {
            return importData.push(['measure', d.data.qMetaDef.title, d.info.qId, 'modify']);
          });
        })
      } else if (d.info.qType === 'dimension') {
        return main.app.getDimension(d.info.qId).then(function (obj) {
          return obj.setProperties(d.data).then(function (msg) {
            return importData.push(['dimension', d.data.qMetaDef.title, d.info.qId, 'modify']);
          });
        })
      } else if (d.info.qType === 'variable') {
        return main.app.getVariableById(d.info.qId).then(function (obj) {
          return obj.setProperties(d.data).then(function (msg) {
            return importData.push(['variable', d.data.qName, d.info.qId, 'modify']);
          });
        })
      } else if (d.info.qType === 'snapshot' || d.info.qType === 'bookmark') {
        return main.app.getBookmark(d.info.qId).then(function (obj) {
          return obj.setProperties(d.data).then(function (msg) {
            if (d.info.qType === 'snapshot') {
              return importData.push([d.info.qType, d.data.title, d.info.qId, 'modify']);
            } else {
              return importData.push([d.info.qType, d.data.qMetaDef.title, d.info.qId, 'modify']);
            }
          });
        })
      } else
        if (d.info.qType === 'masterobject') {
          return main.app.getObject(d.info.qId).then(function (obj) {
            return obj.setProperties(d.data.qProperty).then(function (msg) {
              return importData.push(['masterobject', d.data.qProperty.qMetaDef.title, d.info.qId, 'modify']);
            });
          })
        }
        else if (d.info.qType === 'folder' || d.info.qType === 'internet' || d.info.qType === 'ODBC' || d.info.qType === 'OLEDB') {
          //return main.app.modifyConnection(d.info.qId, d.data.qConnection.qName, /*d.data.qConnection.qConnectionString*/ "C:\\Logs\\".replace(/\\\\/g, '\\'), d.data.qConnection.qType).then(function(msg) {
          return main.app.modifyConnection(d.info.qId,
            {
              qName: d.data.qConnection.qName,
              qConnectionString: d.data.qConnection.qConnectionString,
              qType: d.data.qConnection.qType,
              qUserName: "",
              qPassword: "",
              qModifiedDate: d.data.qConnection.qModifiedDate,
              qLogOn: d.data.qConnection.qLogOn
            }, false).then(function (msg) {
              return importData.push([d.info.qType, d.data.qConnection.qName, d.info.qId, 'modify']);
            }).catch(function (error) {
              console.log(error)
              importErrors++;
              return importData.push([d.info.qType, d.data.qConnection.qName, d.info.qId, 'Error: ' + error.message]);
            });
        }
        else { //if (d.data.qProperty && d.info.qType != 'folder' && d.info.qType != 'internet' && d.info.qType != 'ODBC' && d.info.qType != 'OLEDB') {
          return main.app.getObject(d.info.qId).then(function (obj) {
            return obj.setFullPropertyTree(d.data).then(function (msg) {
              return importData.push([d.info.qType, d.data.qProperty.qMetaDef.title, d.info.qId, 'modify']);
            });
          })
        }

    }));
  }

  function setScript() {
    return main.app.setScript(loadScript).then(function () {
      return importData.push(['load script', '', '', 'modify']);
    })
  }

  function setAppProperties() {
    return main.app.setAppProperties(properties).then(function () {
      return importData.push(['app properties', '', '', 'modify']);
    })
  }



  function GenerateTable() {
    var t = $('#resultTable').DataTable();
    for (var i = 0; i < importData.length; i++) {
      t.row.add(importData[i]).draw(false);
    }

    $('#loadingImg').css('display', 'none');
    $('#errorsCount').text('Errors: ' + importErrors);
    if (importErrors > 0) {
      $('#errorsCount').removeClass();
      $('#errorsCount').addClass('error');
    } else {
      $('#errorsCount').removeClass();
      $('#errorsCount').addClass('noerror');
    }
  }

  var qSocksConnect = function () {
    var selectedApp = $('#docList').find(":selected").val();
    if (selectedApp) {
      appConfig.appname = selectedApp;
    }

    if (ticket) {
      appConfig.ticket = ticket;
      console.log(ticket)
    }

    return qsocks.Connect(/*appConfig*/).then(function (global) {
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
            return variable.getProperties().then(function (properties) { return properties; });
          });
        }));
      });
    });

  };

  $("#open").on("click", function () {
    $('#errorsCount').text('');
    var table = $('#resultTable').DataTable();
    table
      .clear()
      .draw();

    $('#openDoc').css('visibility', 'hidden');
    $('#loadingImg').css('display', 'inline-block');

    var selectedApp = $('#docList').find(":selected").val();
    selectedAppText = $('#docList').find(":selected").text();

    try {
      main.global.connection.ws.close();
    } catch (ex) {

    }

    qSocksConnect().then(function () {
      main.global.openDoc(selectedApp).then(function (app) {
        main.app = app;
      })
        .then(function () {
          return main.app.getAllInfos()
        })
        .then(function (info) {
          appInfos = info;
          main.app.getConnections().then(function (connections) {
            for (var i = 0; i < connections.length; i++) {
              appInfos.qInfos.push({
                qId: connections[i].qId,
                qType: connections[i].qType
              })
            }

            getVariables(main.app).then(function (variables) {
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

  $.get('./backup-and-restore.qext', function (data) {
    $('#version').text('version: ' + data.version)
    $("#branchlink").attr("href", data.qlikbranch)
  })

  $('#resultTable').DataTable({
    "scrollY": "400px",
    "scrollCollapse": true,
    "paging": false,
    "createdRow": function (row, data, dataIndex) {      
      if (data[3].indexOf('Error') > -1) {
        $(row).addClass('rowerror');
      }
    }
  });


  $("#serialize").on("click", function () {
    $('#loadingImg').css('display', 'inline-block');
    serializeAppBundle(main.app).then(function (data) {

      var d = new Date();
      var dformat = d.getFullYear() + "" + ("00" + (d.getMonth() + 1)).slice(-2) + "" +
        ("00" + d.getDate()).slice(-2) + "-" +
        ("00" + d.getHours()).slice(-2) + "" +
        ("00" + d.getMinutes()).slice(-2) + "" +
        ("00" + d.getSeconds()).slice(-2);

      $('#loadingImg').css('display', 'none');
      data = JSON.stringify(data, null, 2);
      var fileName = selectedAppText + '_' + dformat + '.json';

      if (IEversion == false) {
        var a = window.document.createElement('a');
        a.style = "display: none";
        a.href = window.URL.createObjectURL(new Blob([data], {
          type: 'text/json'
        }));
        a.download = fileName;
        a.text = 'Download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        window.navigator.msSaveOrOpenBlob(new Blob([data], { type: "text/json" }), fileName);
      }
    })
  })

  var IEversion = detectIE();

  // detect IE --> returns version of IE or false, if browser is not Internet Explorer http://codepen.io/gapcode/pen/vEJNZN
  function detectIE() {
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf('MSIE ');
    if (msie > 0) {
      return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10); // IE 10 or older => return version number
    }

    var trident = ua.indexOf('Trident/');
    if (trident > 0) {
      var rv = ua.indexOf('rv:');
      return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10); // IE 11 => return version number
    }

    var edge = ua.indexOf('Edge/');
    if (edge > 0) {
      return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10); // Edge (IE 12+) => return version number
    }
    return false; // other browser
  }

  $("#go").on("click", function () {
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
      .then(function (results) {
        main.app.doSave().then(function (results) {
          GenerateTable();
          $('#json').replaceWith($("#json").clone());
          $('#go').prop('disabled', true);
          $('#serialize').prop('disabled', true);
          $('#prestatus').html('');
          $('#json').prop('disabled', true);
          $('#openDoc').text('No active document');
          main.global.connection.ws.close();
        });
      });
  })

  qSocksConnect().then(function () {
    return main.global.getDocList()
  }).then(function (docList) {
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
