
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
    qsocks: 'qsocks.bundle'
  }
});

var main = {};

require(['jquery', 'qsocks'], function ($, qsocks) {
  var SUPPORTED_OBJECT_TYPES = ['story', 'sheet', 'measure', 'dimension', 'masterobject', 'snapshot'];
  var METHODS_MAP = ['sheets', 'measures', 'dimensions', 'masterobjects', 'snapshots', 'stories'];


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
      sheets = backupContent.sheets;
      embeddedmedia = backupContent.embeddedmedia;
      thumbnail = backupContent.thumbnail;
      stories = backupContent.stories;
      masterobjects = backupContent.masterobjects;
      dimensions = backupContent.dimensions;
      measures = backupContent.measures;
      snapshots = backupContent.snapshots;
      properties = backupContent.properties;
      dataconnections = backupContent.dataconnections;
      
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

      console.log( status )
      console.log('For delete: ' + status.forDelete.length);
      console.log('For insert: ' + status.forInsert.length);
      console.log('For update: ' + status.forUpdate.length);

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
        console.log(d.qType + ' ID: ' + d.qId + ' and its objects was deleted');
        return main.app.destroyMeasure(d.qId);
      } else if (d.qType === 'dimension') {
        console.log(d.qType + ' ID: ' + d.qId + ' was deleted');
        return main.app.destroyDimension(d.qId);
      } else if (d.qType === 'snapshot' || d.qType === 'bookmark') {        
        console.log(d.qType + ' ID: ' + d.qId + ' and its objects was deleted');
        return main.app.destoryBookmark(d.qId);
      } else if (d.qType === 'variable') {
        console.log(d.qType + ' ID: ' + d.qId + ' was deleted');
        return main.app.destroyVariableById(d.qId);
      } else {
        console.log(d.qType + ' ID: ' + d.qId + ' and its objects was deleted');
        return main.app.destroyObject(d.qId)
      }
    }));
  }

  function insertObjects() {
    return Promise.all(status.forInsert.map(function (d) {
      if (d.info.qType === 'measure') {
        return main.app.createMeasure(d.data).then(function (msg) {
          return 'a' //console.log('Measure: "' + d.data.qMetaDef.title + '" (' + d.info.qId + ') was created');  
        });
      } else if (d.info.qType === 'dimension') {
        return main.app.createDimension(d.data).then(function (msg) {
          return 'a' //console.log('Dimension: "' + d.data.qMetaDef.title + '" (' + d.info.qId + ') was created');
        })
      } else if (d.info.qType === 'snapshot' || d.info.qType === 'bookmark') {
        return main.app.createBookmark(d.data).then(function (msg) {
          var snapTitle;
          if (d.data.qMetaDef.title) {
            snapTitle = d.data.qMetaDef.title;
          } else {
            snapTitle = "Untitled";
          }

          return console.log('Snapshot: "' + snapTitle + '" (' + d.info.qId + ') was created');
        })
      } else if (d.data.qProperty) {
        return main.app.createObject(d.data.qProperty).then(function (handle) {
          return handle.setFullPropertyTree(d.data).then(function () {
            return console.log(d.info.qType + ' ID: ' + d.info.qId + ' was created');
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
            return console.log('Measure: "' + d.data.qMetaDef.title + '" (' + d.info.qId + ') was updated');
          });
        })
      } else if (d.info.qType === 'dimension') {
        return main.app.getDimension(d.info.qId).then(function (obj) { 
          //console.log(d.data.qInfo.qType)            
          return obj.setProperties(d.data).then(function (msg) {
            return console.log('Dimension: "' + d.data.qMetaDef.title + '" (' + d.info.qId + ') was updated');
          });
        })
      }
      else if (d.info.qType === 'snapshot' || d.info.qType === 'bookmark') {
        //console.log(d.data.qInfo.qType)               
        return main.app.getBookmark(d.info.qId).then(function (obj) {
          return obj.setProperties(d.data).then(function (msg) {
            if (d.info.qType === 'snapshot') {
              return console.log(d.info.qType + ': "' + d.data.title + '" (' + d.info.qId + ') was updated');
            } else {
              return console.log(d.info.qType + ': "' + d.data.qMetaDef.title + '" (' + d.info.qId + ') was updated');
            }
          });
        })
      }
      else
        if (d.info.qType === 'masterobject') {
          //console.log(d.data.qInfo.qType)               
          return main.app.getObject(d.info.qId).then(function (obj) {
            return obj.setProperties(d.data.qProperty).then(function (msg) {
              return console.log('Masterobject: "' + d.data.qProperty.qMetaDef.title + '" (' + d.info.qId + ') was updated');
            });
          })
        } else if (d.info.qType === 'folder') {
          console.log(d.data)               
          //return main.app.getObject(d.info.qId).then(function (obj) {
            console.log(d.info.qId,d.data.qConnection.qName, d.data.qConnection.qConnectionString, d.data.qConnection.qType)
            return main.app.modifyConnection(d.info.qId,d.data.qConnection.qName, d.data.qConnection.qConnectionString, d.data.qConnection.qType ).then(function (msg) {
              return console.log('--------------> DataConnector: "' + d.data.qConnection.qName + '" (' + d.info.qId + ') was updated');
            });
          //})
        } else if (d.data.qProperty) {
          return main.app.getObject(d.info.qId).then(function (obj) {
            return obj.setFullPropertyTree(d.data).then(function (msg) {
              return console.log(d.info.qType + ': "' + d.data.qProperty.qMetaDef.title + '" (' + d.info.qId + ') was updated');
            });
          })
        }

    }));
  }

  function setScript() {
    return main.app.setScript(loadScript)
  }

  function setAppProperties() {
    return main.app.setAppProperties(properties)
  }

  $("#go").on("click", function () {
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
                console.log('Saved')
              })
            })
          })
        })
      })
    })
  })

  var measure = [
    {
      "qInfo": {
        "qId": "NPPsJt",
        "qType": "measure"
      },
      "qMeasure": {
        "qLabel": "Revenue",
        "qDef": "Sum([Sales Quantity]*[Sales Price])",
        "qGrouping": "N",
        "qExpressions": [],
        "qActiveExpression": 0
      },
      "qMetaDef": {
        "title": "Revenue",
        "description": "The revenue.",
        "tags": [
          "revenue"
        ]
      }
    }]


  var selectedApp = "Executive Dashboard.qvf";
  var status = { forUpdate: [], forDelete: [], forInsert: [] };
  var appConfig = {
    host: window.location.hostname,
    isSecure: window.location.protocol === "https:",
    appname: selectedApp
  };

  qsocks.Connect(appConfig).then(function (global) {
    return main.global = global;
  })
    .then(function () {
      return main.global.openDoc(selectedApp)
    })
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
      
      
      
      for( var i = 0; i < appInfos.qInfos.length; i++ ) {
        //if( appInfos.qInfos[i].qId === '65b37b5d-7c71-4a8d-a97c-0288627a2b24' ) {
        //console.log( appInfos.qInfos[i].qType )
        //}
      }
    
    })





  $("#replacenew").on("click", function () {

    function MasterObjects() {
      return Promise.all(masterobjects.map(function (mo) {
        //return( mo )
        return app1.createObject(mo.qProperty).then(function (obj) {
          return obj.setFullPropertyTree(mo).then(function (obj) {
            console.log('Masterobject: "' + mo.qProperty.qMetaDef.title + '" (' + mo.qProperty.qInfo.qId + ') with ' + mo.qChildren.length + ' children(s) was created');
            return obj;
          });
        });
      }))
    }

    function Story() {
      return Promise.all(stories.map(function (st) {
        return app1.createObject(st.qProperty).then(function (obj) {
          return obj.setFullPropertyTree(st).then(function (obj) {
            console.log('Story: "' + st.qProperty.qMetaDef.title + '" (' + st.qProperty.qInfo.qId + ') with ' + st.qChildren.length + ' sheet(s) was created');
            return obj;
          });
        });
      }))
    }

    function Dimensions() {
      return Promise.all(dimensions.map(function (dim) {
        return app1.createDimension(dim).then(function (obj) {
          console.log('Dimension: "' + dim.qMetaDef.title + '" (' + dim.qInfo.qId + ') was created');
          return obj;
        })
      }))
    }

    function Measures() {
      return Promise.all(measure.map(function (measure) {
        return app1.createMeasure(measure).then(function (m) {
          //console.log( m )
          console.log('Measure: "' + measure.qMetaDef.title + '" (' + measure.qInfo.qId + ') was created');
          return m;
        })
      }))
    }
  
  

    //app1 = app;
    //MasterObjects().then( function( data ) {
    //console.log( data )
    //Story().then( function( data1 ) {
    //Dimensions().then( function( data1 ) {
    Measures().then(function (data1) {
      app1.doSave().then(function () {
        console.log('Saved');
      });
    })
    //          })          
    //        })
    //      });
    //});
    //});
   
  });


  $("#replace").on("click", function () {
    //   qsocks.Connect(appConfig).then(function (global) {
    //    	global.openDoc(selectedApp).then(function (app) {
    // Set load script
    app1.setScript(loadScript).then(function (msg) {
      console.log("Load script was altered");
    }).then(function () {
      return Promise.all(sheets.map(function (s) {
        //console.log( s.qProperty.qInfo.qId );
        return app1.createObject(s.qProperty).then(function (obj) {
          return obj.setFullPropertyTree(s).then(function (obj) {
            console.log('Sheet: "' + s.qProperty.qMetaDef.title + '" (' + s.qProperty.qInfo.qId + ') with ' + s.qChildren.length + ' object(s) was created');
            return obj;
          });
        });
      })).then(function () {

        return Promise.all(masterobjects.map(function (mo) {
          return app1.createObject(mo.qProperty).then(function (obj) {
            return obj.setFullPropertyTree(mo).then(function (obj) {
              console.log('Masterobject: "' + mo.qProperty.qMetaDef.title + '" (' + mo.qProperty.qInfo.qId + ') with ' + mo.qChildren.length + ' children(s) was created');
              return obj;
            });
          });

        })).then(function () {
          return Promise.all(stories.map(function (st) {
            return app1.createObject(st.qProperty).then(function (obj) {
              return obj.setFullPropertyTree(st).then(function (obj) {
                console.log('Story: "' + st.qProperty.qMetaDef.title + '" (' + st.qProperty.qInfo.qId + ') with ' + st.qChildren.length + ' sheet(s) was created');
                return obj;
              });
            });
          })).then(function () {
            return Promise.all(dimensions.map(function (dim) {
              return app1.createDimension(dim).then(function (obj) {
                console.log('Dimension: "' + dim.qMetaDef.title + '" (' + dim.qInfo.qId + ') was created');
                return obj;
              })
            })).then(function () {
              return Promise.all(measures.map(function (measure) {
                return app1.createMeasure(measure).then(function (m) {
                  //console.log( m )
                  console.log('Measure: "' + measure.qMetaDef.title + '" (' + measure.qInfo.qId + ') was created');
                  return m;
                })
              })).then(function () {
                return Promise.all(snapshots.map(function (sn) {
                  return app1.createBookmark(sn).then(function (obj) {
                    //console.log( obj )
                    var snapTitle;
                    if (sn.qMetaDef.title) {
                      snapTitle = sn.qMetaDef.title;
                    } else {
                      snapTitle = "Untitled";
                    }

                    console.log('Snapshot: "' + snapTitle + '" (' + sn.qInfo.qId + ') was created');
                    return obj;
                  })
                })).then(function () {
                  return app1.getConnections().then(function (connections) {
                    return Promise.all(connections.map(function (dc) {
                      return app.deleteConnection(dc.qId).then(function (obj) {
                        console.log('DataConnection: "' + dc.qName + '" (' + dc.qId + ') was deleted');
                        return obj;
                      })
                    })).then(function () {
                      return Promise.all(dataconnections.map(function (dc) {
                        return app1.createConnection(dc.qConnection).then(function (obj) {
                          console.log('DataConnection: "' + dc.qConnection.qName + '" (' + dc.qConnection.qId + ') was created');
                          return obj;
                        })
                      })).then(function () {
                        var props = {};
                        props.qTitle = properties.qTitle;
                        props.qThumbnail = properties.qThumbnail;
                        props.description = properties.description;
                        props.dynamicColor = properties.dynamicColor;

                        return app1.setAppProperties(properties).then(function () {
                          console.log('App properties was set');
                          console.log('All done')
                          return app.doSave().then(function () {
                            console.log('Saved!');
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
    //     });
    //    })
  })
  //   });
  //  });
  //});
  
  $('#delete').on("click", function () {
    // remove all sheets
    qsocks.Connect(appConfig).then(function (global) {
        	global.openDoc(selectedApp).then(function (app1) {
    app1.getAllInfos().then(function (allobjects) {
      var allSheets = allobjects.qInfos.filter(function (obj) {
        return obj.qType === 'sheet' || obj.qType === 'story' || obj.qType === 'masterobject' || obj.qType === 'dimension' || obj.qType === 'measure' || obj.qType === 'snapshot' || obj.qType === 'bookmark'
      })
      return Promise.all(allSheets.map(function (d) {

        switch (d.qType) {
          case "sheet":
          case "masterobject":
          case "story":
            return app1.destroyObject(d.qId).then(function (delmsg) {
              console.log(d.qType + ' ID: ' + d.qId + ' and its objects was deleted');
              if (delmsg == false) {
                console.log(delmsg)
              }
              return null
            })
            break;
          case "dimension":
            return app1.destroyDimension(d.qId).then(function (delmsg) {
              console.log('Dimension ID: ' + d.qId + ' was deleted')
              if (delmsg == false) {
                console.log(delmsg)
              }
              return null
            })
            break;
          case "measure":
            return app1.destroyMeasure(d.qId).then(function (delmsg) {
              console.log('Measure ID: ' + d.qId + ' was deleted')
              if (delmsg == false) {
                console.log(delmsg)
              }
              return null
            })
            break;
          case "snapshot":
          case "bookmark":
            return app1.destroyBookmark(d.qId).then(function (delmsg) {
              console.log('Snapshot ID: ' + d.qId + ' was deleted')
              if (delmsg == false) {
                console.log(delmsg)
              }
              return null
            })
            break;
        }

        return null
      })).then(function () {
        app1.doSave().then(function (msg) {
          app1.getAllInfos().then(function (allobjects) {
            var allSheets1 = allobjects.qInfos.filter(function (obj) {
              return obj.qType === 'measure';
            })
            console.log(allSheets1)
          });
          console.log('Saved')
        })
      })
    })
         })
      })
  })

  $("#doSave").on("click", function () {
    app1.doSave().then(function () {
      console.log('saved');
    })
  });

  $("#getMeasures").on("click", function () {
    app1.getAllInfos().then(function (allobjects) {
      var allSheets1 = allobjects.qInfos.filter(function (obj) {
        if (obj.qType === 'measure') {
          return obj.qId
        }
      })
      var ids = [];
      for (var i = 0; i < allSheets1.length; i++) {
        ids.push(allSheets1[i].qId)
      }
      console.log(ids)
    });
  })

  $("#serialize").on("click", function () {
    qsocks.Connect(appConfig).then(function (global) {
     	global.openDoc(selectedApp).then(function (app) {

        app.getAllInfos().then(function (objects) {
          console.log(objects);
        });
      });
    });
  });

});
