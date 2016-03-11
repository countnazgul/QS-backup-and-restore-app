### Qlik Sense Mashup for Backup and Restore apps

Using the [SerializeApp](https://github.com/mindspank/serializeapp) from [Alexander Karlsson](https://github.com/mindspank) we can export the QS app ( without the data ) to json file. This will include all objects - sheets, dimension and measures, stories etc. Then this file can be put under version control or can be stored just as a backup.

The next step is to use the json file to import it back when is needed. And this is what (part of) this mashup is supposed to do.
This mashup provide both export the app to json and import the json file.

#### Supported objects
* sheets ( with all containing objects )
* stories
* master objects
* dimensions
* measures
* snapshots
* bookmarks
* variables
* app properties - like name, thumbnail, description etc.
* load script
* fields

#### Installation
***Works with QS version >=2.1.1***
* QS Desktop - unzip the release in `C:\Users\[USERNAME]\Documents\Qlik\Sense\Extensions`
* QS Server
  - login to QMC
  - naviagete to "Extensions"
  - press "Improt" button (bottom of the page)
  - pick the release zip file
  - press "Import" button
  - (verify that the import process finished without errors from the notification popup)

#### Backup
During the export the app is not changed in any way. The generated file will be automatically downloaded to your download folder.

#### Restore
The restore process will read the existing app objects and will compare them with the objects from the backup file.

* existing objects - the objects which are present in the current app and in the json file will be updated with the properties from the json file
* missing objects - objects that are present in the current app and not present in the json file will be deleted from the app (see exclusions below)
* new objects - objects which are present in the json file and not present in the current app will be created in the app

Few exclusions:
Some objects are excluded from the overall process ( for now )

* embedded media - the actual media files will not be deleted ( if needed ) and they will stay in the content library. At the current moment I haven't found a method that can include these files in the backup process.
* data connectors - connectors will not be deleted or inserted. I'm facing a bug with the method in the Engine API that when updating a connector new ID is assigned instead using the ID from the json file

After the restore process is finished the app will be saved to preserve the changes. It's highly recommended to reload the app after the restore process ( my plan is to add this as an option in the following releases )

#### Usage

* Navigate to the mashup web page (for example: [http://localhost:4848/extensions/backup-and-restore/backup-and-restore.html](http://localhost:4848/extensions/backup-and-restore/backup-and-restore.html)). The mashup will automatically establish connection with the QS Engine
* Pick an app from the dropdown and press "Open" ( can take some time. depends on the app size )
* At this point "Backup" button is active ( if you need to only backup an app or just backup before restore )
* Choose the json backup file
* After this you will see the statistics - how many objects will be deleted, inserted and updated. Deleted objects will always be more. This number include all the sheets objects (including the sheets itself) but the json file count only the sheets ( the objects in the sheets are sheets children and they are included in the sheet object itself )
* press the "Restore" button and wait for the process to finish. After the process is done the result table will be populated with more detail about the objects that were processed.
* That's it! If you have the app already open just refresh the browser tabs where this app is open.

#### Note

If the file is unable to download in IE please make sure that your "File download" option is set to "Enabled" in IE Security Settings for Internet

#### Change log
v0.9.5 (11/03/2016)
  * fix - downloading the serialized app file works in Firefox 
  
v0.9.3 (18/01/2016)
  * fix - downloading the serialized app file works in IE 11+

v0.9.2 (17/01/2016)
  * fix - opening multiple apps is performed correctly

v0.9.0 (03/01/2016)
  * add - "variables" support
  * update - qsocks to v2.1.5
  * update - serializeapp to v1.0.3
  * fix - no need to refresh the page to switch the apps

Please report and issues in the [Github issue tracker](https://github.com/countnazgul/QS-backup-and-restore-app/issues)

![Screenshot](https://raw.githubusercontent.com/countnazgul/QS-backup-and-restore-app/master/images/backup_and_restore.png)
