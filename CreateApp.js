
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
  var sheets, loadScript, embeddedmedia, thumbnail, stories, masterobjects;
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
          };
          reader.readAsBinaryString(fileInput.files[0]);
      };
  
  fileInput.addEventListener('change', readFile); 
 
 
	var selectedApp = "Executive Dashboard.qvf" ; 
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
              return obj.qType === 'sheet'|| obj.qType === 'story' || obj.qType === 'masterobject'
            })
                         
            //  for( var i = 0; i < allSheets.length; i++ ) {
            //    var sheet = allSheets[i];
            //    app.destroyObject( sheet.qId ).then( function( delmsg ) {
                 
            //    });
            //  }
             
            Promise.all(allSheets.map(function(d) {
                    return app.destroyObject( d.qId ).then( function( delmsg ) {
                      if( d.qType === 'sheet' ) {
                        console.log( 'Sheet ID: ' + d.qId + ' and its objects was deleted' )
                      } else if( d.qType === 'story' ) {
                        console.log( 'Story ID: ' + d.qId + ' was deleted' )
                      } else if( d.qType === 'masterobject' ) {
                        console.log( 'Masterobject ID: ' + d.qId + ' was deleted' )
                      }                      
                      return null                                                        
                    })
            })).then( function() {
                      
                      Promise.all(sheets.map(function(s) {
                        //console.log( s.qProperty.qInfo.qId );
                        return app.createObject( s.qProperty ).then( function( obj ) {
                          return obj.setFullPropertyTree( s ).then( function( obj ) {
                            console.log( 'Sheet: "' + s.qProperty.qMetaDef.title + '" (' + s.qProperty.qInfo.qId + ') with ' + s.qChildren.length + ' object(s) was created' );                
                          });
                        });
                      })).then( function() {

                        Promise.all(masterobjects.map(function(mo) {
                          return app.createObject( mo.qProperty ).then( function( obj ) {
                            return obj.setFullPropertyTree( mo ).then( function( obj ) {
                              console.log( 'Masterobject: "' + mo.qProperty.qMetaDef.title + '" (' + mo.qProperty.qInfo.qId + ') with ' + mo.qChildren.length + ' children(s) was created' );
                            });
                          });

                      })).then( function() {
                        Promise.all(stories.map(function(st) {
                          return app.createObject( st.qProperty ).then( function( obj ) {
                            return obj.setFullPropertyTree( st ).then( function( obj ) {
                              console.log( 'Story: "' + st.qProperty.qMetaDef.title + '" (' + st.qProperty.qInfo.qId + ') with ' + st.qChildren.length + ' sheet(s) was created' );
                            });
                          });
                        })).then( function() {
                        
                        
                        
                        console.log('All done')
                        app.doSave().then( function() {
                          console.log( 'Saved!' );
                        }) 
                      })
                      })
          });
        });         
      });
    });    
  });
  });
  })

                      
                      
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
});

