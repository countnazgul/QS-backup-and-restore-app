
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

require(['jquery', 'qsocks'], function($, qsocks) {

  var backupContent;
  var sheets, loadScript, embeddedmedia, thumbnail, stories, masterobjects, dimensions, measures, snapshots, properties, dataconnections;
  var fileInput = document.getElementById("json");
  var readFile = function () {
          var reader = new FileReader();
          reader.onload = function () {
              //document.getElementById('out').innerHTML = reader.result;
              backupContent = JSON.parse( reader.result );
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
          };
          reader.readAsBinaryString(fileInput.files[0]);
      };
  
  fileInput.addEventListener('change', readFile); 
 
 
	var selectedApp = "94318f12-5911-4f37-86ab-5050cb3f3a7e"; //"Executive Dashboard.qvf" ; 
  //"TestCreate.qvf";
	var appConfig = {
	  host: window.location.hostname,
	  isSecure: window.location.protocol === "https:",
	  appname: selectedApp
	};	
  
  $( "#replace" ).on( "click", function() {
    qsocks.Connect( appConfig ).then( function( global ) {
     	global.openDoc( selectedApp ).then( function( app ) {
        // Set load script
        app.setScript( loadScript ).then( function( msg ) {
          console.log( "Load script was altered" );
          // remove all sheets
          app.getAllInfos().then( function( allobjects ) {
            var allSheets = allobjects.qInfos.filter( function( obj ) {
              return obj.qType === 'sheet'|| obj.qType === 'story' || obj.qType === 'masterobject' || obj.qType === 'dimension' || obj.qType === 'measure' || obj.qType === 'snapshot'
            }) //.then( function() {
            Promise.all( allSheets.map(function( d ) {

                    switch( d.qType ) {
                      case "sheet":
                      case "masterobject":
                      case "story":
						//console.log( d.qType + ' ' + d.qId )
                        return app.destroyObject( d.qId ).then( function( delmsg ) {
                          console.log( d.qType + ' ID: ' + d.qId + ' and its objects was deleted' );
						  if( delmsg == false ) {
							console.log( delmsg )
						  }
                          return null                 
                        })
                        break;
                      case "dimension":
					  //console.log( 'Dimension ' + d.qId )
                        return app.destroyDimension( d.qId ).then( function( delmsg ) {
                          console.log( 'Dimension ID: ' + d.qId + ' was deleted' )
                          if( delmsg == false ) {
							console.log( delmsg )
						  }
                          return null                            
                        })
                        break;
                      case "measure":
						 //console.log( 'Measure ' + d.qId )
                         return app.destroyMeasure( d.qId ).then( function( delmsg ) {
                          console.log( 'Measure ID: ' + d.qId + ' was deleted' )
                          if( delmsg == false ) {
							console.log( delmsg )
						  }
                          return null                            
                        })
                        break;
                      case "snapshot":
                         return app.destroyBookmark( d.qId ).then( function( delmsg ) {
                          console.log( 'Snapshot ID: ' + d.qId + ' was deleted' )
                          if( delmsg == false ) {
							console.log( delmsg )
						  }
                          return null                            
                        })
                        break;						
                    }
                    return null
            })).then( function() {
                      
                      Promise.all(sheets.map(function(s) {
                        //console.log( s.qProperty.qInfo.qId );
                        return app.createObject( s.qProperty ).then( function( obj ) {
                          return obj.setFullPropertyTree( s ).then( function( obj ) {
                            console.log( 'Sheet: "' + s.qProperty.qMetaDef.title + '" (' + s.qProperty.qInfo.qId + ') with ' + s.qChildren.length + ' object(s) was created' );                
                          });
                        });
                      })).then( function() {

                        Promise.all(masterobjects.map(function( mo ) {
                          return app.createObject( mo.qProperty ).then( function( obj ) {
                            return obj.setFullPropertyTree( mo ).then( function( obj ) {
                              console.log( 'Masterobject: "' + mo.qProperty.qMetaDef.title + '" (' + mo.qProperty.qInfo.qId + ') with ' + mo.qChildren.length + ' children(s) was created' );
                            });
                          });

                      })).then( function() {
                        Promise.all(stories.map(function( st ) {
                          return app.createObject( st.qProperty ).then( function( obj ) {
                            return obj.setFullPropertyTree( st ).then( function( obj ) {
                              console.log( 'Story: "' + st.qProperty.qMetaDef.title + '" (' + st.qProperty.qInfo.qId + ') with ' + st.qChildren.length + ' sheet(s) was created' );
                            });
                          });
                        })).then( function() {
                        Promise.all(dimensions.map(function( dim ) {
                          return app.createDimension( dim ).then( function( obj ) {
                            console.log( 'Dimension: "' + dim.qMetaDef.title + '" (' + dim.qInfo.qId + ') was created' );
                          })
                        })).then( function() {
                        Promise.all(measures.map(function( measure ) {
                          return app.createMeasure( measure ).then( function( obj ) {
                            console.log( 'Measure: "' + measure.qMetaDef.title + '" (' + measure.qInfo.qId + ') was created' );
                          })
                        })).then( function() {
                        Promise.all(snapshots.map(function( sn ) {
                          return app.createBookmark( sn ).then( function( obj ) {
							//console.log( obj )
                            console.log( 'Snapshot: "' + sn.qMetaDef.title + '" (' + sn.qInfo.qId + ') was created' );
                          })
                        })).then( function() {
                          app.getConnections().then( function( connections ) {
                            Promise.all(connections.map(function( dc ) {
                              return app.deleteConnection( dc.qId ).then( function( obj ) {                     
                                console.log( 'DataConnection: "' + dc.qName + '" (' + dc.qId + ') was deleted' );
                              })
                            })).then( function() {                                                        
                            Promise.all(dataconnections.map(function( dc ) {
                              return app.createConnection( dc.qConnection ).then( function( obj ) {                            
                                console.log( 'DataConnection: "' + dc.qConnection.qName + '" (' + dc.qConnection.qId + ') was created' );
                              })
                            })).then( function() {                          
                          var props = {};
                          props.qTitle = properties.qTitle;
                          props.qThumbnail = properties.qThumbnail;
                          props.description = properties.description;
                          props.dynamicColor = properties.dynamicColor;
                                                                        
                          app.setAppProperties( properties ).then( function() {
                          console.log( 'App properties was set' );
                        console.log('All done')
                        app.doSave().then( function() {
                          console.log( 'Saved!' );
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
  });
  });
  })
  });
    })
  })
//})
                      
                      // }));     
  
  
  $( "#serialize" ).on( "click", function() {
    qsocks.Connect( appConfig ).then(function(global) {
     	global.openDoc( selectedApp ).then(function(app) {

        app.getAllInfos().then( function( objects ) {  
          console.log( objects ) 
          // for( var i = 0; i < objects.qInfos.length; i++ ) {
          //   app.destroyObject( objects.qInfos[i].qId ).then( function( msg ) {
          //     if( msg == true ) {
          //     app.doSave().then( function() {
          //       console.log( 'Saved' )
          //       app.getAllInfos().then( function( objects ) {
          //           console.log( objects )
          //       })									 
          //     })
          //       } else {
          //       console.log( 'Failed to delete object' )
          //     }
          //   });
          // }
        });
      });    
    });  
  });  
	
	// qsocks.Connect( appConfig ).then(function(global) {
	// 	global.openDoc( selectedApp ).then(function(app) {
	// 		console.log( app )
			
			//  app.createObject(sheet).then( function( resp ) {
			//  	console.log( resp )
			// 	resp.createChild( child ).then( function( chi ) {
			// 		console.log( chi )
 			// 		app.doSave().then( function() {
			// 			console.log( 'Saved' )
			// 		});			 
			// 	});				 	
			//  });
			

			 		// app.destroyObject( "BeshrAu" ).then( function( msg ) {
			 		// 	  if( msg == true ) {
			 		// 		app.doSave().then( function() {
					// 			console.log( 'Saved' )
					// 			app.getAllInfos().then( function( objects ) {
					// 					console.log( objects )
					// 			})									 
			 		// 		})
					//   	  } else {
					// 	  	console.log( 'Failed to delete object' )		
					// 	  }
					//    })					
	// 	});
  // });  
  //});

