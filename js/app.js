/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
 //cordova.file.applicationDirectory +
var ruta_archivos = "pages/";
var modo = 0;
var db = null;
var hoy = new Date();
var app_nombre = "demozip";
db = window.openDatabase("base", "1.0", app_nombre, 2 * 1024 * 1024);
var apiurl = "http://www.reportes.cl/paat/";
var api = apiurl + "apiqlik.php";
var usuario;
var appd;
var rol_usuario = "1";
var prefijo = "dm";
var pathname = window.location.pathname;
var timestamp = new Date().getUTCMilliseconds();
var n_paquete = "app"+timestamp;

var app = {

    initialize: function() {
        document.addEventListener('deviceready', app.onDeviceReady, false);
        document.addEventListener('resume', app.onDeviceResume, false);
        document.addEventListener('pause', app.onDevicePause, false);
        document.addEventListener("backbutton", function (e) {  e.preventDefault(); }, false );
    },

    Usuario: function(id, usuario, mail, ruta) {
        this.id = id;
        this.usuario = usuario;
        this.mail = mail;
        this.ruta = ruta;
    },

    Salir: function(a){
      //si a es verdadero pregunta por salir, sino lo hace automáticamente.
      if(a){
        navigator.notification.confirm(
          '¿Estas seguro?',  
           this.Salir(false),
          'Deseas Salir',
          'Si quiero Salir,Cancelar' 
        );
      }else{
          console.log("Salimos de la APP, se acabó");
      }
    },

    Appd: function(id, nombre, plataforma, version) {
        this.id = id;
        this.nombre = nombre;
        this.plataforma = plataforma;
        this.version = version;
    },

    logerror: function(e) {
      console.log("FileSystem Error");
      console.dir(e);
    },

    writeLog: function(str) {
      if(!logOb) return;
      var log = str + " [" + (new Date()) + "]\n";
      console.log("going to log "+log);
      logOb.createWriter(function(fileWriter) {
        fileWriter.seek(fileWriter.length);
        var blob = new Blob([log], {type:'text/plain'});
        fileWriter.write(blob);
        console.log("ok, in theory i worked");
      }, app.logerror);
    },

    inicio: function(){

      alert("inicio");

      db.transaction(app.validaUsuario, function(err){
        alert("Error base de datos usuarios: "+err.code);
      }); 

    },

    onDeviceResume: function() {
        alert("Resumen");
    },
    onDevicePause: function() {
        alert("Pause");
    },

    onDeviceReady: function() {

      window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function(dir) {
        console.log("Directorio principal",dir);
        dir.getFile("log.txt", {create:true}, function(file) {
          console.log("Log ubicado en: ", file);
          logOb = file;
          app.writeLog("App lista con el Log");      
        });
      }, function (err) {
        console.log("ERROR leyendo el directorio");
          console.log(err);
        });

      var tiene_usuario;
      var tiene_paquete;
      var num_paquete;

      appd = new app.Appd(1,app_nombre,device.platform,device.version);
      alert(JSON.stringify(appd));
        //alert(api);

      //  alert(cordova.file.applicationDirectory); 
       // alert(cordova.file.dataDirectory);
       //alert(pathname.indexOf('index.html'));
       //alert(app.ruta_aplicativo());
       if(pathname.indexOf('index.html') >= 0 ){
           db.transaction(app.crear_db, app.errorDB, function(){

            alert("Base de Datos iniciada correctamente");

           });
           
           app.valida_actualizacion_app(function(x){
            if(x){
              throw new Error("App Desactualizada");
              alert("APP obsoleta, lo siento tenemos que cerrar el aplicativo");
              app.Salir(false);
              return false;
            }else console.log("App buena, está al día");
            
           app.existe_usuario_db(function(a){
              tiene_usuario = a;
              alert("Tiene Usuario creado en BD Local: " + tiene_usuario);
              app.existe_paquete_descargado(function(a,b,c){
                tiene_paquete = a;
                num_paquete = c;
                alert("Tiene Paquete creado en BD Local: " + tiene_paquete);
                if(a){
                  alert("Obteniendo paquete desde la ruta almacenada en bd local");
                  alert("Ruta que está en la BD local es: " + b + ", pero vamos a ver si hay algo nuevo en el servidor remoto.");
                  app.probar_internet(function(a){
                  if(a){
                    app.version_paquete(c, function(a,b,c1){

                            if(a){
                              alert("Se obtuvo la siguiente ruta desde el servidor, con la version para descargarse: " + b);
                              if(b==""){
                                throw new Error("Ruta del paquete viene vacia");
                                return false;
                              }

                              if(c1 != num_paquete){
                                    alert("Tenemos una nueva version del paquete para descargar.");
                                    app.descarga_contenidos(b,c1,function(x,y1){
                                      if(x){
                                        alert("NUEVA descarga completada");
                                        db.transaction(function(tx){ app.guardaArchivoDescargado(tx,b,c1,y1,function(a){
                                          if(a){

                                            app.inicio();

                                          }else{
                                            alert("no se pudo guardar LA NUEVA descarga en la BD");
                                            app.Salir(false);
                                          }

                                        }) }, app.errorDB);
                                      }else alert("falló la NUEVA descarga");

                                    });


                              }else{
                                    alert("Los paquetes estan al día, no es necesario bajar nada");
                                    app.inicio();
                              }



                            }else alert("No se pudo obtener información del paquete");

                    });
                  }else{
                      alert("No tienes internet, no podemos saber si hay algo nuevo en el server - lo siento.");
                  } 
                  });
                  //se debe setear la ruta para que se comience a obtener las paginas
                    //app.protocolo_inicio();
                }else{
                  alert("no encontrado, vamos a descargar por primera vez el paquete desde internet");
                  app.probar_internet(function(a){
                  if(a){
                    //mandamos 0 para que sepa que tiene que traer la última actualizada.
                    app.version_paquete("0",function(a,b,c1){
                        if(a){
                          alert("bajando paquete con ruta: " + b);
                          if(b==""){
                            throw new Error("Ruta del paquete viene vacia");
                            return false;
                          }
                          app.descarga_contenidos(b,c1,function(x,y1){
                            if(x){
                              alert("primera descarga completada");
                              db.transaction(function(tx){ app.guardaArchivoDescargado(tx,b,c1,y1,function(a){
                                if(a){

                                  app.inicio();

                                }else{
                                  alert("no se pudo guardar en la BD");
                                  app.Salir(false);
                                }
                              }) }, app.errorDB);

                            }else{
                               alert("por algún motivo, no se logró descargar nada y falló la primera descarga"); 
                               app.Salir(false);
                            } 

                          });
                        }else{
                          alert("No se pudo obtener información del paquete, como es la primera vez no podemos continuar.");
                          app.Salir(false);
                        } 
                    });
                  }else{
                      alert("No tienes internet, no podemos bajar el paquete - conéctate, te tenemos que sacar desde el aplicativo");
                      app.Salir(false);
                  } 
                  });
                  //no existe paquete, se tiene que bajar.
                 // db.transaction(app.validaUsuario, app.errorDB); 
                }
              });//fin existe paquete descargado
           });//fin existe usuario
          });//fin valida_actualizacion
       }




    },

    valida_actualizacion_app: function(callback){
        app.probar_internet(function(a){
            if(a){
              cordova.getAppVersion.getVersionNumber(function (version) {
                console.log("Version del aplicativo: "+version);
                app.necesita_actualizar_app(version, function(c){
                  if(!c){
                    console.log("No se necesita actualizar");
                    callback(false);
                  }else if(c){
                    app.cargar_pagina("desactualizado.html");
                    callback(true);
                  }
                });
              });
            }else{
              console.log("Sin Internet");
              callback(false);
            }
        });
    },

    necesita_actualizar_app: function(v, callback){
        if(!window.axios)
        {
          console.log("Axios NO existe");
          throw new Error("Axios NO EXISTE");
          callback(false);
        }
        var appv = v;
        var appn = appd.nombre;
        axios.get(api+'/updates_app?transform=1&filter[]=APP,eq,'+appn+'&filter[]=version,eq,'+appv)
        .then(response => {
            if (typeof response.data === 'undefined' && response.data.length == 0) {
                console.log("Error al intentar obtener los registros.");
            }else{
               if(response.data["updates_app"]!=""){
                  var json = JSON.parse(JSON.stringify(response.data["updates_app"][0]));
                  if(json.estado_up == 1){
                     alert("Tienes una actualización disponible para tu aplicación.");
                     console.log("Abriendo: "+json.url_up);
                     window.open(json.url_up, '_system');
                     callback(true);
                  }else callback(false);
               }else{
                  callback(false);
               }
            }
        })
    },

    validaUsuario: function(tx) {
         tx.executeSql('SELECT * FROM USUARIO', [], app.existe_usuario, app.errorDB);
    },

    existe_usuario: function(tx, results) {
        var len = results.rows.length;
        console.log("Tabla usuarios: " + len + " filas encontradas.");
        if(len=="0"){
             app.cargar_pagina('login.html');
        }else{
            var data = results.rows.item(0);
            app.cargar_pagina('admin.html');                        
        }
    },

    enviar_login: function(usuario,clave, callback){

           if(nombre == "") callback(0);
           if(clave == "") callback(0);
           
           axios.get(api+'/usuarios?transform=1&filter[]=rol,eq,'+rol_usuario+'&filter[]=usuario,eq,'+usuario.toLowerCase()+'&filter[]=clave,eq,'+clave.toLowerCase())
              .then(response => {
                  if (typeof response.data === 'undefined' && response.data.length == 0) {
                      console.log("Error al intentar obtener los registros.");
                  }else{
                      var resp = response.data["usuarios"];
                     if(resp!=""){
                        var json = JSON.parse(JSON.stringify(resp[0]));
                        try{
                          window.localStorage.setItem(prefijo+"_usuario", json.usuario.toLowerCase());
                          window.localStorage.setItem(prefijo+"_mail", json.correo.toLowerCase());
                          window.localStorage.setItem(prefijo+"_nombre", json.nombre + ' ' + json.apellido );
                          db.transaction(function(tx){ app.guardaUsuario(tx, 1,usuario,json.correo,function(data){

                            if(data){
                              alert("Usuario almacenado correctamente en la BD Local");
                              callback(1);
                            }else{
                              alert("Usuario no pudo ser almacenado");
                              callback(0);
                            }

                          }) }, function(){ callback(0); });
                          //se debe obtener el ID
                        }catch(error) {
                            console.error(error);
                            callback(0);
                        }
                        
                     }else{
                        callback(0);
                     }
                  }
              })
        },

    cargar_pagina: function(pagina){
      window.location = ruta_archivos + pagina;
    },

    onResume: function() {
        alert(api);
    },

    onPause: function() {
        alert(api);
    },

    crear_db: function(tx) {
     //tx.executeSql('DROP TABLE USUARIOS');
     //usuario = new app.Usuario('Fiesta', 'Ford');
     tx.executeSql('CREATE TABLE IF NOT EXISTS AVANCES (id integer primary key autoincrement, data, t TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
     tx.executeSql('CREATE TABLE IF NOT EXISTS USUARIO (id, usuario, mail, ruta)');
     tx.executeSql('CREATE TABLE IF NOT EXISTS ACTUALIZADOR (id integer primary key autoincrement, archivo , paquete, ruta, t TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
     tx.executeSql('CREATE TABLE IF NOT EXISTS APP (id integer primary key, nombre, plataforma, version)');
     tx.executeSql('INSERT OR IGNORE INTO APP (id, nombre, plataforma, version) VALUES (1,"'+app_nombre+'","'+device.platform+'", "'+device.version+'")');
    },

    existe_paquete_descargado: function(callback) {
        db.transaction(function(tx){ 
        tx.executeSql('select * from ACTUALIZADOR', [], function(tx, results){ 
            var len = results.rows.length;
            if(len>0){
                callback(true, results.rows.item(0).ruta, results.rows.item(0).paquete);
            }else{
                callback(false,"","");
            }
            
        }, app.errorDB);

        });
    },

    existe_usuario_db: function(callback) {
        db.transaction(function(tx){ 
        tx.executeSql('select * from USUARIO where id > 0', [], function(tx, results){ 
            var len = results.rows.length;
            if(len>0){
                callback(true);
            }else{
                callback(false);
            }
            
        }, app.errorDB);

        });
    },

    ruta_aplicativo: function() {
        var path = window.location.pathname;
        path = path.substr( path, path.length - 10 );
        return path;
    },

    version_paquete: function(num, callback){
        if(!window.axios)
        {
          console.log("Axios NO existe");
          throw new Error("Axios NO EXISTE");
          callback(0,"","");
        }
        var appn = appd.nombre;
        //axios.get(api+'/paquete_app?transform=1&filter[]=APP,eq,'+appn+'&filter[]=paquete,eq,'+num)
        axios.get(api+'/paquete_app?transform=1&filter[]=APP,eq,'+appn+'&filter[]=estado_up,eq,1')
        .then(response => {
            if (typeof response.data === 'undefined' && response.data.length == 0) {
                console.log("Error al intentar obtener los registros.");
            }else{
              var data = response.data["paquete_app"];
               if(data!=""){
                  var json = JSON.parse(JSON.stringify(data[0]));
                  callback(1,json.url_up, json.paquete);
               }else{
                  callback(0,"","");
               }
            }
        })
    },

    trae_ruta_paquete: function(callback) {
        db.transaction(function(tx){ 
        tx.executeSql('select ruta from ACTUALIZADOR', [], function(tx, results){ 
            var len = results.rows.length;
            if(len>0){
                callback(true, results.rows.item(0).ruta);
            }else{
                callback(false, "");
            }
            
        }, errorCB);

        });
    },

    guardaArchivoDescargado: function(tx, archivo, paquete, ruta, callback){
      tx.executeSql('INSERT INTO ACTUALIZADOR (archivo , paquete, ruta) VALUES ("'+archivo+'", "'+paquete+'", "'+ruta+'")',[], 
        function(transaction, result) {
                console.log(result.insertId);
                callback(true);
        }, function(transaction, error) {
                console.log(error);
                callback(false);
        });
    },

    guardaUsuario: function(tx,id,usuario,mail, callback){
        tx.executeSql('INSERT INTO USUARIO (id, usuario, mail, ruta) VALUES ('+id+', "'+usuario+'", "'+mail+'", "'+ruta_archivos+'")',[], 
        function(transaction, result) {
                console.log(result.insertId);
                callback(true);
        }, function(transaction, error) {
                console.log(error);
                callback(false);
        });
    },

    guardaApp: function(tx,nombre, plataforma, version){
        tx.executeSql('INSERT INTO APP (id, nombre, plataforma, version) VALUES (1,"'+nombre+'","'+plataforma+'", "1")');
    },

    queryDB: function(tx) {
        tx.executeSql('SELECT * FROM USUARIO', [], this.listar_db, this.errorDB);
    },

    listar_db: function(tx, results) {
        var len = results.rows.length;
        console.log("TABLA USUARIO tiene: " + len + " fila(s).");
        for (var i=0; i<len; i++){
            console.log("Row = " + i + " ID = " + results.rows.item(i).id + " Data =  " + results.rows.item(i).data);
        }
    },

    errorDB: function(err) {
        alert("Error en la base de datos: "+err.code+" | "+err.message);
       // alert(JSON.stringify(err));
    },

    exitoDB: function() {
        console.log("Conexion Local Establecida");
        db.transaction(this.queryDB, this.errorDB, function(){ alert("3"); });
    },

    borrar_db: function(callback) {
      db.transaction(function(tx){ 
          tx.executeSql('DROP TABLE USUARIO');
          tx.executeSql('DROP TABLE AVANCES');
      }, this.errorDB ,function(data){
          callback("1");
      }, function(){ alert("4"); });
    },

    probar_internet: function(callbackFn) {
        var file = apiurl + "pixel.php";
        $.ajax({
          url: file,
          success: function(data) {
            modo = 1;
            callbackFn(true);
          },
          error: function(data) {
            modo = 0;
            callbackFn(false);
          }
        });
    },

    listDir: function(path){
      window.resolveLocalFileSystemURL(path,
        function (fileSystem) {
          var reader = fileSystem.createReader();
          reader.readEntries(
            function (entries) {
              console.log(entries);
            },
            function (err) {
              console.log(err);
            }
          );
        }, function (err) {
          console.log(err);
        }
      );
    },

    descarga_contenidos: function(url,nombre,callback){

      var correl = new Date().valueOf();


      let permissions = cordova.plugins.permissions;

      console.log("Revisado los permisos");
      console.log(permissions);

      var ft = new FileTransfer();
      ft.onprogress = function(progressEvent) {
          if (progressEvent.lengthComputable) {
              var perc = Math.floor(progressEvent.loaded / progressEvent.total * 100);
              console.log("Descargando: "+perc);
          }
      };

      var ProgressCallback = function(progressEvent){
      var percent =  Math.round((progressEvent.loaded / progressEvent.total) * 100);
            console.log(percent + "%");
      };

      permissions.checkPermission(permissions.READ_EXTERNAL_STORAGE, function(status){
        console.log('Revisando Permisos READ_EXTERNAL_STORAGE');
        if(!status.hasPermission){
          throw new Error("No tiene permisos para leer la tarjeta externa");
          callback(false,"");
        }else{
          console.log('Tiene Permisos READ_EXTERNAL_STORAGE');
          cordova.plugins.diagnostic.getExternalSdCardDetails(function(details){
              alert(JSON.stringify(details));
              console.log(details);
              details.forEach(function(detail){
                //&& details.freeSpace > 100000
                alert("En "+detail.path+", puede escribir: " + detail.canWrite+ ", espacio disponible: " + detail.freeSpace );
                  if(detail.canWrite && detail.freeSpace > 100000 && detail.type == "application"){
                      cordova.file.externalSdCardDirectory = detail.filePath;
                      console.log(JSON.stringify(cordova.file));
                        
                        if(cordova.file.externalDataDirectory == null){
                          alert("External Data NO Existe");
                          throw new Error("External Data NO Existe");
                          callback(false,"");
                        }

                        /*console.log("Creando Directorios en "+cordova.file.externalDataDirectory);
                        window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory, function(fileSystem) {
                              console.log("Root = " + cordova.file.externalDataDirectory);
                              fileSystem.getDirectory("curso"+correl, {create: true, exclusive: false},
                              function(dirEntry) {
                                  dirEntry.getFile("curso.txt", {create: true, exclusive: false}, function (fileEntry) {
                                      console.log("File = " + fileEntry.fullPath);
                                  }, function (error) {
                                      console.log("1.-"+error.code);
                                      callback(false);
                                  });
                              }, function (error) {
                                console.log("2.-"+error.code);
                                 callback(false);
                              });
                         }, function (error) {
                              console.log("3.-"+error.code);
                              callback(false);
                         });*/

                        console.log("Fin Creando Directorios");

                         window.requestFileSystem(LocalFileSystem.PERSISTENT,0,function(fileSystem) {

                              var updatedir = "app"+nombre;

                              alert("Nombre del directorio: " + updatedir);

                              fileSystem.root.getDirectory(updatedir+'/', {create: true}, function (dirEntry) {
                                  fileSystem.root.getDirectory(updatedir+'/pages/', {create: true}, function (dirUser) {
                                      console.log("Creados los Directorios");
                                      var archivoURL = url;
                                      console.log("DESTINO DE LOS ARCHIVOS A SER DESCARGADOS "+dirUser.toURL());
                                      ft.download(archivoURL, dirUser.toURL() + "/"+updatedir+".zip", function(entry) {
                                          console.log("Descarga Completada");
                                          console.log(entry);
                                          console.log("Listando archivos del nuevo directorio");
                                          app.listDir(cordova.file.externalSdCardDirectory +  updatedir +"/");
                                          console.log("Ruta de ZIP descargado: "+entry.nativeURL);
                                          //ruta del aplicativo que administra Android: cordova.file.externalApplicationStorageDirectory
                                          zip.unzip(entry.nativeURL, cordova.file.externalSdCardDirectory + "/" + updatedir ,
                                          function(code) {
                                               console.log("resultado zip: " + code);
                                               if(code == 0){
                                                    console.log("Archivo descomprimido con exito.");
                                                    var ruta_final = cordova.file.externalSdCardDirectory + "/" +updatedir;
                                                    app.listDir(ruta_final);
                                                    callback(true,ruta_final);
                                               }
                                               if(code == -1){
                                                    throw new Error("No se pudo descomprimir.");
                                                    alert("No pudo ser descomprimido el archivo");
                                                    callback(false,"");
                                               }
                                               
                                          }, ProgressCallback);
                                         
                                           //cordova.file.applicationDirectory = ruta WWW nativa
                                           //cordova.file.dataDirectory = Ruta Data 

                                      }, function(err) { callback(false,""); alert("Descarga falló: " + JSON.stringify(err)); });
                                  }, function(err) { callback(false,""); alert("2do nivel no captado: " + JSON.stringify(err)); });
                              }, function(err) { callback(false,""); alert("1er nivel no captado: " + JSON.stringify(err)); });
                          }, function(err) { callback(false,""); alert("solicitud rechazada: " + JSON.stringify(err)); }); 





                  }else{
                    alert("Super error, no se puede escribir en la memoria, no tiene espacio libre la SD o no existe una ruta Android");
                  }
              });
          }, function(error){
              console.error("Error desde el plugin cordova.plugins.diagnostic: "+error);
              callback(false);
          });
        }
      }, null)

      /*cordova.plugins.diagnostic.getExternalSdCardDetails(function(details){
          console.log(details);
          details.forEach(function(detail){
              if(detail.canWrite && details.freeSpace > 100000){
                  cordova.file.externalSdCardDirectory = detail.filePath;
                  console.log("ruta SD --> " + detail.filePath);
              }
          });
      }, function(error){
          console.error(error);
      });*/

      


     /*

     */

    } 

    
};

app.initialize();