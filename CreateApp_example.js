
var selectedApp = "Executive Dashboard.qvf";

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

require(['jquery', 'qsocks'], function ($, qsocks) {

  var measures1 = [
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
    
var measures = [
  {
      "qProperty": {
        "qInfo": {
          "qId": "tmaqpf",
          "qType": "masterobject"
        },
        "qMetaDef": {
          "title": "Revenue by Product",
          "description": "View revenue by product.",
          "tags": [
            "product",
            "revenue"
          ]
        },
        "qHyperCubeDef": {
          "qDimensions": [
            {
              "qLibraryId": "pmresb",
              "qDef": {
                "qGrouping": "N",
                "qFieldDefs": [],
                "qFieldLabels": [],
                "qSortCriterias": [
                  {
                    "qSortByAscii": 1,
                    "qSortByLoadOrder": 1,
                    "qExpression": {}
                  }
                ],
                "qNumberPresentations": [],
                "qActiveField": 0,
                "autoSort": true,
                "cId": "SBVPEh",
                "othersLabel": "Others"
              },
              "qOtherTotalSpec": {
                "qOtherMode": "OTHER_OFF",
                "qOtherCounted": {
                  "qv": "10"
                },
                "qOtherLimit": {
                  "qv": "0"
                },
                "qOtherLimitMode": "OTHER_GE_LIMIT",
                "qForceBadValueKeeping": true,
                "qApplyEvenWhenPossiblyWrongResult": true,
                "qOtherSortMode": "OTHER_SORT_DESCENDING",
                "qTotalMode": "TOTAL_OFF",
                "qReferencedExpression": {}
              },
              "qOtherLabel": {},
              "qTotalLabel": {},
              "qCalcCond": {}
            }
          ],
          "qMeasures": [
            {
              "qLibraryId": "NPPsJt",
              "qDef": {
                "qTags": [],
                "qGrouping": "N",
                "qNumFormat": {
                  "qType": "M",
                  "qnDec": 10,
                  "qUseThou": 0,
                  "qFmt": "$#,##0;($#,##0)",
                  "qDec": ".",
                  "qThou": ","
                },
                "qAccumulate": 0,
                "qActiveExpression": 0,
                "qExpressions": [],
                "autoSort": true,
                "cId": "CJdusf"
              },
              "qSortBy": {
                "qSortByNumeric": -1,
                "qSortByLoadOrder": 1,
                "qExpression": {}
              },
              "qAttributeExpressions": [],
              "qCalcCond": {},
              "showInPercent": false
            }
          ],
          "qInterColumnSortOrder": [
            1,
            0
          ],
          "qSuppressZero": true,
          "qSuppressMissing": true,
          "qInitialDataFetch": [
            {
              "qLeft": 0,
              "qTop": 0,
              "qWidth": 30,
              "qHeight": 3000
            }
          ],
          "qReductionMode": "N",
          "qMode": "K",
          "qPseudoDimPos": 0,
          "qNoOfLeftDims": -1,
          "qAlwaysFullyExpanded": true,
          "qMaxStackedCells": 3000,
          "qCalcCond": {}
        },
        "metadata": {},
        "showTitles": true,
        "title": "Revenue by Product",
        "subtitle": "",
        "footnote": "",
        "labels": {
          "auto": true,
          "headers": true,
          "overlay": true,
          "leaves": true,
          "values": true
        },
        "color": {
          "auto": false,
          "mode": "primary",
          "singleColor": "#276e27",
          "persistent": false,
          "measureScheme": "sg",
          "reverseScheme": false,
          "dimensionScheme": "12",
          "dimensionId": ""
        },
        "legend": {
          "dock": "auto",
          "showTitle": true
        },
        "visualization": "treemap",
        "masterVersion": 0.96
      },
      "qChildren": []
    }
  
]    

  var appConfig = {
    host: window.location.hostname,
    isSecure: window.location.protocol === "https:",
    appname: selectedApp
  };

  var app1;
  var globalQS;

  $("#open").on("click", function () {
    qsocks.Connect(appConfig).then(function (global) {
      globalQS = global;
      global.openDoc(selectedApp).then(function (app) {
        app1 = app;
        console.log('Doc "' + selectedApp + '" is open')
      })
    })
  });


  $("#replacenew").on("click", function () {

    function Measures() {
      return Promise.all(measures.map(function (measure) {
              return app1.createObject(measure.qProperty).then(function (obj) {
                return obj.setFullPropertyTree(measure).then(function (obj) {
                  console.log('Masterobject: "' + measure.qProperty.qMetaDef.title + '" (' + measure.qProperty.qInfo.qId + ') with ' + measure.qChildren.length + ' children(s) was created');
                  return obj;
                });
              });
      }))
    }

    Measures().then(function (data1) {

    });
  });

  $('#delete').on("click", function () {
    app1.getAllInfos().then(function (allobjects) {
      var allSheets = allobjects.qInfos.filter(function (obj) {
        return obj.qType === 'masterobject'
      })
      var count = 0;
      return Promise.all(allSheets.map(function (d) {

        switch (d.qType) {
          case "masterobject":
            return app1.destroyObject(d.qId).then(function (delmsg) {
              console.log('Measure ID: ' + d.qId + ' was deleted')
              if (delmsg == false) {
                console.log(delmsg)
              }
              count++;
              return delmsg;
            })
            break;
        }
      })).then(function () {
        console.log(count + ' measures was deleted')
      })
    })
  })

  $("#doSave").on("click", function () {
    app1.doSave().then(function () {
      console.log('Saved');
    })
  });

  $("#getMeasures").on("click", function () {
    app1.getAllInfos().then(function (allobjects) {
      //console.log( allobjects )
      var allSheets1 = allobjects.qInfos.filter(function (obj) {
        if (obj.qType === 'masterobject') {
          return obj.qId
        }
      })
      var ids = [];
      for (var i = 0; i < allSheets1.length; i++) {
        ids.push(allSheets1[i].qId)
      }
      console.log('Available measures: ' + ids.length)
      console.log(ids)
    });
  })
  
  // $("#close").on("click", function () {
  //   globalQS.connection.ws.close();
  //   console.log( 'Connection closed' )
  // })

});
