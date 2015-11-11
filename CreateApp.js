
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
    qsocks: 'qsocks.bundle',
    serializeApp: 'serialize.bundle',
    dataTables: 'jquery.dataTables'
  }
});

var main = {};

require(['jquery', 'qsocks', 'serializeApp', 'dataTables'], function ($, qsocks, serializeApp, DataTable) {
  var appInfos = [];
  var backupInfos = [];

  var backupContent;
  var sheets, loadScript, embeddedmedia, thumbnail, stories, masterobjects, dimensions, measures, snapshots, properties, dataconnections;
  var fileInput = document.getElementById("json");
  var readFile = function () {
    var reader = new FileReader();
    reader.onload = function () {
      backupContent = JSON.parse(reader.result);
      //console.log( backupContent );
      loadScript = backupContent.loadScript;
      //sheets = backupContent.sheets;
      //embeddedmedia = backupContent.embeddedmedia;
      //thumbnail = backupContent.thumbnail;
      //stories = backupContent.stories;
      //masterobjects = backupContent.masterobjects;
      //dimensions = backupContent.dimensions;
      //measures = backupContent.measures;
      //snapshots = backupContent.snapshots;
      properties = backupContent.properties;
      //dataconnections = backupContent.dataconnections;
      
      //console.log( backupContent )
      
      for (var name in backupContent) {
        //console.log( backupContent[name]);
        switch (name) {
          case "sheets":
          case "stories":
          case "masterobjects":
            for (var i = 0; i < backupContent[name].length; i++) {
              //backupInfos.push(backupContent[name][i].qProperty.qInfo)
              backupInfos.push({ info: backupContent[name][i].qProperty.qInfo, data: backupContent[name][i] })
            }
            break;
          case "dimensions":
          case "measures":
          case "snapshots":
          case "bookmarks":
            for (var i = 0; i < backupContent[name].length; i++) {
              backupInfos.push({ info: backupContent[name][i].qInfo, data: backupContent[name][i] })
            }
            break;
          case "dataconnections":
            for (var i = 0; i < backupContent[name].length; i++) {
              console.log( backupContent[name][i] )
              backupInfos.push({ info: { qId: backupContent[name][i].qConnection.qId, qType: backupContent[name][i].qConnection.qType }, data: backupContent[name][i] })
              console.log( { info: { qId: backupContent[name][i].qConnection.qId, qType: backupContent[name][i].qConnection.qType }, data: backupContent[name][i] } )
            }
            break;          
        }
      }
      //console.log( backupInfos )
      for (var i = 0; i < appInfos.qInfos.length; i++) {
        var present = false;
        var d;
        for (var a = 0; a < backupInfos.length; a++) {
          if (appInfos.qInfos[i].qId == backupInfos[a].info.qId) {
            present = true;
            d = backupInfos[a];
            //console.log(d)
          }
        }
        if (present == true) {
          status.forUpdate.push(d)  //appInfos.qInfos[i]
        } else {
          status.forDelete.push(appInfos.qInfos[i])
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
      
      $( '#prestatus' ).html( '' );
      console.log( status )
      console.log('For delete: ' + status.forDelete.length);
      console.log('For insert: ' + status.forInsert.length);
      console.log('For update: ' + status.forUpdate.length);
      $( '#prestatus' ).append( 'For delete: ' +  status.forDelete.length + '</br>' ); 
      $( '#prestatus' ).append( 'For insert: ' +  status.forInsert.length + '</br>' );
      $( '#prestatus' ).append( 'For update: ' +  status.forUpdate.length + '</br>' );
      //  for( var i = 0; i < status.forUpdate.length; i++ ) {
      //    console.log( status.forUpdate[i].info.qType )
      //  }



    };
    reader.readAsBinaryString(fileInput.files[0]);
  };

  fileInput.addEventListener('change', readFile);

  function deleteObjects() {
    return Promise.all(status.forDelete.map(function (d) {
      if (d.qType === 'measure') {
        return main.app.destroyMeasure(d.qId).then( function() {
          return importData.push( [d.qType, '', d.qId, 'delete'] ); 
        });
      } else if (d.qType === 'dimension') {
        return main.app.destroyDimension(d.qId).then( function() {
          return importData.push( [d.qType, '', d.qId, 'delete'] ); 
        });;
      } else if (d.qType === 'snapshot' || d.qType === 'bookmark') {        
        return main.app.destoryBookmark(d.qId).then( function() {
          return importData.push( [d.qType, '', d.qId, 'delete'] ); 
        });;
      } else if (d.qType === 'variable') {
        return main.app.destroyVariableById(d.qId).then( function() {
          return importData.push( [d.qType, '', d.qId, 'delete'] ); 
        });;
      } else {
        return main.app.destroyObject(d.qId).then( function() {
          return importData.push( [d.qType, '', d.qId, 'delete'] ); 
        });
      }
    }));
  }

  function insertObjects() {
    return Promise.all(status.forInsert.map(function (d) {
      if (d.info.qType === 'measure') {
        return main.app.createMeasure(d.data).then(function (msg) {
          return importData.push( ['measure', d.data.qMetaDef.title, d.info.qId, 'create'] );  
        });
      } else if (d.info.qType === 'dimension') {
        return main.app.createDimension(d.data).then(function (msg) {
          return importData.push( ['dimension', d.data.qMetaDef.title, d.info.qId, 'create'] );
        })
      } else if (d.info.qType === 'snapshot' || d.info.qType === 'bookmark') {
        return main.app.createBookmark(d.data).then(function (msg) {
          var snapTitle;
          if (d.data.qMetaDef.title) {
            snapTitle = d.data.qMetaDef.title;
          } else {
            snapTitle = "Untitled";
          }

          //return console.log('Snapshot: "' + snapTitle + '" (' + d.info.qId + ') was created');
          return importData.push( ['snapshot', snapTitle, d.info.qId, 'create'] );
        })
      } else if (d.data.qProperty) {
        return main.app.createObject(d.data.qProperty).then(function (handle) {
          return handle.setFullPropertyTree(d.data).then(function () {
            //return console.log(d.info.qType + ' ID: ' + d.info.qId + ' was created');
            return importData.push( [d.info.qType, '', d.info.qId, 'create'] );
          });
        })
      }
      // if(d.info.qType === 'variable') {
      //   return main.app.destroyVariableById(d.data);
      // }
      
      //return main.app.destroyObject(d.data)      
      
    }));
  }

  function updateObjects() {
    return Promise.all(status.forUpdate.map(function (d) {
      if (d.info.qType === 'measure') {
        //console.log(d.data.qInfo.qType)
        return main.app.getMeasure(d.info.qId).then(function (obj) {
          return obj.setProperties(d.data).then(function (msg) {
            //return console.log('Measure: "' + d.data.qMetaDef.title + '" (' + d.info.qId + ') was updated');
            return importData.push( ['measure', d.data.qMetaDef.title, d.info.qId, 'modify'] );
          });
        })
      } else if (d.info.qType === 'dimension') {
        return main.app.getDimension(d.info.qId).then(function (obj) { 
          //console.log(d.data.qInfo.qType)            
          return obj.setProperties(d.data).then(function (msg) {
            //return console.log('Dimension: "' + d.data.qMetaDef.title + '" (' + d.info.qId + ') was updated');
            return importData.push( ['dimension', d.data.qMetaDef.title, d.info.qId, 'modify'] );
          });
        })
      }
      else if (d.info.qType === 'snapshot' || d.info.qType === 'bookmark') {
        //console.log(d.data.qInfo.qType)               
        return main.app.getBookmark(d.info.qId).then(function (obj) {
          return obj.setProperties(d.data).then(function (msg) {
            if (d.info.qType === 'snapshot') {
              //return console.log(d.info.qType + ': "' + d.data.title + '" (' + d.info.qId + ') was updated');
              return importData.push( [d.info.qType, d.data.title, d.info.qId, 'modify'] );
            } else {
              //return console.log(d.info.qType + ': "' + d.data.qMetaDef.title + '" (' + d.info.qId + ') was updated');
              return importData.push( [d.info.qType, d.data.qMetaDef.title, d.info.qId, 'modify'] );
            }
          });
        })
      }
      else
        if (d.info.qType === 'masterobject') {
          //console.log(d.data.qInfo.qType)               
          return main.app.getObject(d.info.qId).then(function (obj) {
            return obj.setProperties(d.data.qProperty).then(function (msg) {
              //return console.log('Masterobject: "' + d.data.qProperty.qMetaDef.title + '" (' + d.info.qId + ') was updated');
              return importData.push( ['masterobject', d.data.qProperty.qMetaDef.title, d.info.qId, 'modify'] );
            });
          })
        } else if (d.info.qType === 'folder') {

            return main.app.modifyConnection(d.info.qId,d.data.qConnection.qName, d.data.qConnection.qConnectionString, d.data.qConnection.qType ).then(function (msg) {
              //return console.log('--------------> DataConnector: "' + d.data.qConnection.qName + '" (' + d.info.qId + ') was updated');
              return importData.push( ['data connector', d.data.qConnection.qName, d.info.qId, 'modify'] );
            }).catch( function( error ) {
              return console.log( error )
            });

        } else if (d.data.qProperty) {
          return main.app.getObject(d.info.qId).then(function (obj) {
            return obj.setFullPropertyTree(d.data).then(function (msg) {
              //return console.log(d.info.qType + ': "' + d.data.qProperty.qMetaDef.title + '" (' + d.info.qId + ') was updated');
              return importData.push( [d.info.qType, d.data.qProperty.qMetaDef.title, d.info.qId, 'modify'] );
            });
          })
        }

    }));
  }

  function setScript() {
    return main.app.setScript(loadScript).then( function() {
      return importData.push( ['load script', '', '', 'modify'] );
    })
  }

  function setAppProperties() {
    return main.app.setAppProperties(properties).then( function() {
      return importData.push( ['app properties', '', '', 'modify'] );
    })
  }
  
  
  var prepareDataForCsv = function(data) {
  return new Promise(function(resolve, reject) {
      if( $('#serialize').prop('checked') == true ) {
        return serializeAppBundle( main.app ).then( function( data ) {
          
          var d = new Date();
            var dformat = d.getFullYear() + "" +("00" + (d.getMonth() + 1)).slice(-2) + "" + 
            ("00" + d.getDate()).slice(-2) + "-" + 
            ("00" + d.getHours()).slice(-2) + "" + 
            ("00" + d.getMinutes()).slice(-2) + "" + 
            ("00" + d.getSeconds()).slice(-2)          
          
          $( '#status' ).append( '--- JSON object generated successfully  --- <br /> ' );
          data = JSON.stringify(data, null, 2);
          var a = window.document.createElement('a');
              a.href = window.URL.createObjectURL(new Blob([data], {type: 'text/json'}));
              a.download = selectedAppText + '_' + dformat + '.json';
              a.text = 'Download';
              //$( '#download' ).append(a)  
              a.click();
              resolve('data');        
        })
      } else {
        resolve('data');
      }   
  });
};

  $("#go").on("click", function () {
    
    var table = $('#resultTable').DataTable();
    
    var rows = table
        .rows()
        .remove()
        .draw();    
    
    prepareDataForCsv('a').then( function() {
    
    
    deleteObjects().then(function () {
      console.log('all deleted')
      insertObjects().then(function () {
        console.log('all inserted')
        updateObjects().then(function () {
          console.log('all updated')
          setScript().then(function () {
            console.log('Load Script altered');
            setAppProperties().then(function () {
              console.log('App properties updated');
              main.app.doSave().then(function () {
                console.log('Saved');
                GenerateTable();
              })
            })
          })
        })
      })
    })
  })
  })


  var selectedApp = "Executive Dashboard.qvf";
  var status = { forUpdate: [], forDelete: [], forInsert: [] };
  
  var appConfig = {
    host: window.location.hostname,
    isSecure: window.location.protocol === "https:",
    appname: selectedApp
  };

  qsocks.Connect(appConfig).then(function (global) {
    return main.global = global;
  }).then(function () {
    return main.global.getDocList()
  }).then( function( docList ) {
    
		for( var i = 0; i < docList.length; i++) {
		  $('#docList')
		  .append($("<option></option>")
				  .attr("value",docList[i].qDocId)
				  .text(docList[i].qDocName));
		}    
    
  })
  
  var selectedAppText;
  
  $("#open").on("click", function () {
    var selectedApp = $('#docList').find(":selected").val();
    selectedAppText = $('#docList').find(":selected").text();
    
    main.global.openDoc(selectedApp)
    .then(function (app) {
      main.app = app;
      console.log('Open');
    })
    .then(function () {
      return main.app.getAllInfos()
    })
    .then(function (info) {
      appInfos = info;
      main.app.getConnections().then( function( connections ) {
        console.log( connections )
        console.log( appInfos )
        for( var i = 0; i < connections.length; i++) {
          appInfos.qInfos.push( { qId: connections[i].qId, qType: connections[i].qType } )
        }        
        console.log( appInfos )
      })    
    })            
  });
  
  var importData = new Array();
      //importData.push( ["Object Type", "Object Name", "Object Id", "Operation"] )
  
    $('#resultTable').DataTable( {
        "scrollY":        "500px",
        "scrollCollapse": true,
        "paging":         false      
      //"bPaginate": true,
      // "bLengthChange": false,
      // "bFilter": true,
      // "bSort": true,
      // "bInfo": false,
      // "bAutoWidth": false,
      // "sPaginationType":"full_numbers",
      //  "iDisplayLength": 50
    });
  
function GenerateTable() {
  var t = $('#resultTable').DataTable();
  for( var i = 0; i < importData.length; i++ ) {
    
    t.row.add( importData[i] ).draw( false );    
  }

    // //Create a HTML Table element.
    // //var table = document.createElement("TABLE");
    // //table.id = 'resultTable'
    // var table = $( '#resultTable' )    
    // table.border = "1";
 
    // //Get the count of columns.
    // var columnCount = importData[0].length;
 
    // //Add the header row.
    // var row = table.insertRow(-1);
    // for (var i = 0; i < columnCount; i++) {
    //     var headerCell = document.createElement("TH");
    //     headerCell.innerHTML = importData[0][i];
    //     row.appendChild(headerCell);
    // }
 
    // //Add the data rows.
    // for (var i = 1; i < importData.length; i++) {
    //     row = table.insertRow(-1);
    //     for (var j = 0; j < columnCount; j++) {
    //         var cell = row.insertCell(-1);
    //         cell.innerHTML = importData[i][j];
    //     }
    // }
 
    // var dvTable = document.getElementById("dvTable");
    // dvTable.innerHTML = "";
    // dvTable.appendChild(table);
    
}  
  
  
});  