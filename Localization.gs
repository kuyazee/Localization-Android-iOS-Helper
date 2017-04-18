// LIBRARIES/FRAMEWORKS
/*
  We overload Logger and use BetterLog instead since we can't log live code using the native Logger
  With this we can see the current Logs here at https://docs.google.com/spreadsheets/d/1LMngz1nB3ykCatIewd4hg49v1eHgtGF2mz--DCHgfbk/edit#gid=1737728411
  Using this inside loops may cause the algorithm to run quite slow.
*/
Logger = BetterLog.useSpreadsheet("1LMngz1nB3ykCatIewd4hg49v1eHgtGF2mz--DCHgfbk"); 

// Configurable properties

/* Number of supported languages */
var NUMBER_OF_LANGUAGES = 2;
var DEFAULT_HEADER_FIELDS = NUMBER_OF_LANGUAGES + 3;

/* 
  The script expects two columns for iOS and Android identifiers, respectively,
  and a column after that with all of the string values. This is the position of
  the iOS column.
*/
var FIRST_COLUMN_POSITION = 2;

/* The position of the header containing the strings "Identifier iOS" and "Identifier Android" */
var HEADER_ROW_POSITION = 1;

var OUTPUT_INCLUDES_COMMENTS = true;

/******* Constants *******/
// DEVICE TYPES 
var DEVICE_IOS      = 'iOS';
var DEVICE_ANDROID  = 'Android';

// Export
function onOpen() {
  Logger.log("onOpen");
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Custom Export To')
    .addItem('iOS', 'localizeForIOS')
    .addItem('Android', 'localizeForAndroid')
    .addToUi();
  Logger.log("onOpen");
}

function localizeForIOS() {
  Logger.log("localizeForIOS");
  getLocalizedStringFor(DEVICE_IOS);
}

function localizeForAndroid() {
  Logger.log("localizeForAndroid");
  getLocalizedStringFor(DEVICE_ANDROID);
}

function getLocalizedStringFor(deviceType) {

  var processedObject = new ProcessedObject(getSpreadsheetValues());
  var lss = new LocalizedStringSheet(processedObject);
  
  if (deviceType == DEVICE_IOS) {
    var sheets = lss.iosSheets();

    displayTexts_(sheets);
  } else if (deviceType == DEVICE_ANDROID) {
    var sheets = lss.androidSheets();

    displayTexts_(sheets);
  }
}

// UI Elements
function makeLabel(app, text, id) {
  var lb = app.createLabel(text);
  if (id) lb.setId(id);
  return lb;
}

function makeListBox(app, name, items) {
  var listBox = app.createListBox().setId(name).setName(name);
  listBox.setVisibleItemCount(1);
  
  var cache = CacheService.getPublicCache();
  var selectedValue = cache.get(name);
  Logger.log(selectedValue);
  for (var i = 0; i < items.length; i++) {
    listBox.addItem(items[i]);
    if (items[1] == selectedValue) {
      listBox.setSelectedIndex(i);
    }
  }
  return listBox;
}

function makeButton(app, parent, name, callback) {
  var button = app.createButton(name);
  app.add(button);
  var handler = app.createServerClickHandler(callback).addCallbackElement(parent);;
  button.addClickHandler(handler);
  return button;
}

function makeTextBox(app, name) { 
  var textArea = app.createTextArea().setWidth('100%').setHeight('100px').setId(name).setName(name);
  return textArea;
}

function displayTexts_(texts) {
  
  var app = UiApp.createApplication().setTitle('Export');

  for (var i = 0; i < texts.length; i++) {
    app.add(makeTextBox(app, 'json' + i));
    app.getElementById('json' + i).setText(texts[i]); 
  }
  
  var ss = SpreadsheetApp.getActiveSpreadsheet(); 
  ss.show(app);

  return app; 
}


// Creating iOS and Android strings


/*
  Creates the strings.xml file for Android.
*/
function makeAndroidString(object, textIndex, options) {

  var exportString = "";
  var prevIdentifier = "";
  
  exportString = '<?xml version="1.0" encoding="UTF-8"?>' + "\n";
  exportString += "<resources>\n";
  
  for(var i=0; i<object.length; i++) {
    
    var o = object[i];
    var identifier = o.identifierAndroid;
    
    var text = o.texts[textIndex];
    var comment = o.comments[textIndex];
    
    if (text == undefined || text == "") {
      continue;
    }
    
    if(identifier == "") {
      continue;
    }
  
    if(identifier != prevIdentifier && prevIdentifier != "") {
      exportString += "\t" + '</string-array>' + "\n";
      prevIdentifier = "";
    }
    
    if(identifier.indexOf("[]")>0) {
      

      if(identifier != prevIdentifier) {
        exportString += "\t" + '<string-array name="' + identifier.substr(0,identifier.length-2) + '">' + "\n";
      }
      
      if (OUTPUT_INCLUDES_COMMENTS) {
        exportString += "\t\t<!-- " + comment + " -->\n";
      }
      exportString += "\t\t"+'<item>'+o.text+'</item>' + "\n\n";
      prevIdentifier = identifier;
      
    } else {
      if (OUTPUT_INCLUDES_COMMENTS) {
        exportString += "\t<!-- " + comment + " -->\n";
      }
      exportString += "\t"+'<string name="'+identifier+'">'+text+'</string>' + "\n\n";
    }
  }
  
  exportString += "</resources>";
  
  return exportString;
}

/*
  Creates the Localizable.strings file and a Localizable enum for iOS.
*/
function makeIosString(object, textIndex, options) {

  var exportString = "";
  
  if (IOS_INCLUDES_LOCALIZABLE_ENUM) {
  
    exportString += "// MARK: - Localizable enum\n\n"
  
    exportString += "enum Localizable {\n\n"
          
    for(var i=0; i<object.length; i++) {
        
      var o = object[i];
      var text = o.texts[textIndex];
    
      if (text == undefined || text == "") {
        continue;
      }
    
      var identifier = o.identifierIos;
      
      if (identifier == "") {
        continue;
      }
        
      exportString += "    /// " + text + "\n";
      exportString += "    static let " + identifier + " = \"" + identifier + "\"\n\n";
    }
    
    exportString += "}\n\n"
    exportString += "// MARK: - Strings\n\n";
  }

  for(var i=0; i<object.length; i++) {
    var o = object[i];
    var identifier = o.identifierIos;
    var text = o.texts[textIndex];
    var comment = o.comments[textIndex];
    
    if (text == undefined || text == "") {
      continue;
    }
    
    if(identifier == "") {
      continue;
    }
    
    if (OUTPUT_INCLUDES_COMMENTS) {
        exportString += "/" + "* " + comment + " *" + "/\n";
    }
    exportString += '"' + identifier + '" = "' + text + "\";\n\n";
  }
  
  return exportString;
}


// PROTOTYPE

var MainSpreadSheet = function() {
  return SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
};

// values is data taken from sheet.getRange()
var ProcessedObject = function(values) {
  this.values = values;

  var objs = [];
  for (var i = 0; i < values.length; i++) {
    var object = values[i];

    var shouldBreakCounter = 0;
    for (var j = 0; j < (DEFAULT_HEADER_FIELDS); j++) {
      if (object[j] == "") {
        shouldBreakCounter++;
      } else {
        break; // end loop if object has values so as to not waste computation time/power
      }
    }

    if ((shouldBreakCounter == (DEFAULT_HEADER_FIELDS))) { 
      break; // end loop because spreadsheet has ended
    }

    objs.push(object);
  }

  this.objects = objs;

  var objectsCopy = objs;
  var keys = objectsCopy.shift();
  this.keys = keys;
  
  var processed = [];
  for (var j = 0; j < objectsCopy.length; j++) {
    var iteratedObject = objectsCopy[j];

    var Object = {};
    var texts = [];

    for (var i = 0; i < DEFAULT_HEADER_FIELDS; i++) {
      if (i == 0) {
        Object.comment = iteratedObject[i];
      } else if (i == 1) {
        Object.iosKey = iteratedObject[i];
      } else if (i == 2) {
        Object.androidKey = iteratedObject[i];
      } else {
        texts.push(iteratedObject[i]);
      }
    }

    Object.texts = texts;

    processed.push(Object);
  }

  this.processed = processed;  
};

// platform should be string, object should be ProcessedObject
var LocalizedStringSheet = function(object) {
  this.object = object;

  this.androidSheets = function() {
    var objects = object.processed;
    var exportStrings = [];

    for (var language = 0; language < NUMBER_OF_LANGUAGES; language++) {
      var exportString = "";
      
      exportString = '<?xml version="1.0" encoding="UTF-8"?>' + "\n";
      exportString += "<resources>\n";

      for (var i = 0; i < objects.length; i++) {
        var element = objects[i];

        if (OUTPUT_INCLUDES_COMMENTS) {
          exportString += "\t<!-- " + element.comment + " -->\n";
        }
        exportString += "\t"+'<string name="'+element.androidKey+'">'+element.texts[language]+'</string>' + "\n\n";
          
      }

      exportString += "</resources>";

      exportStrings.push(exportString);
    }

    return exportStrings;
  };

  this.iosSheets = function() {
    var objects = object.processed;
    var exportStrings = [];

    for (var language = 0; language < NUMBER_OF_LANGUAGES; language++) {
      var exportString = "";

      for (var i = 0; i < objects.length; i++) {
        var element = objects[i];

        var comment = element.comment;
        var iosKey = element.iosKey;
        var texts = element.texts;

        // if (IOS_INCLUDES_LOCALIZABLE_ENUM) { } // TODO DO DIS
        
        if (OUTPUT_INCLUDES_COMMENTS) {
            exportString += "/" + "* " + comment + " *" + "/\n";
        }
        exportString += '"' + iosKey + '" = "' + texts[language] + "\";\n\n";
      }

      exportStrings.push(exportString);
    }
    
    return exportStrings;
  };
};

function getSpreadsheetValues() {
  var sheet = new MainSpreadSheet();
  var values = sheet.getRange(HEADER_ROW_POSITION, 1, sheet.getMaxRows(), DEFAULT_HEADER_FIELDS).getValues();

  return values;
}

// function getObjects() {
//   var processedObject = new ProcessedObject(getSpreadsheetValues());
//   var lss = new LocalizedStringSheet(processedObject);
//   Logger.log(lss.iosSheets()[0]);
//   Logger.log(lss.iosSheets()[1]);
//   // lss.androidSheets();
// }
