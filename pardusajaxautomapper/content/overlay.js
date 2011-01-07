//Original code by Pants Commander
//  Modified for Firefox extension by Darmani, with lots of help from http://kb.mozillazine.org
var PardusAjaxAutoMapper = {

should_do: false, //used to control fn_sendloop

           /**
            * Returns the table representing the map of the area surrounding the player.
            */
           fn_get_maptable: function(fi_main_frame) {
               var fo_maptable = null;
               var countNf=0;

               if ( fi_main_frame != null ) {
                   var fl_images = fi_main_frame.getElementsByTagName( "img" );
                   for ( var i = 0; i < fl_images.length; i++ ) {
                       if(fl_images[i].className=='nf') {
                           fo_maptable = fl_images[i].parentNode.parentNode.parentNode.parentNode;
                           countNf++;
                       }
                   }
                   this.gridSize=countNf;
                   this.gridMax=Math.sqrt(this.gridSize);
                   this.gridCenter=(this.gridMax-1)/2;
                   //alert("gridSize=" + this.gridSize + " gridMax=" + this.gridMax + " gridCenter=" + this.gridCenter);
                   return fo_maptable;
               }
           },

           /**
            * Finds a Pardus tab, then returns the main frame, or null.
            */
fn_get_main_frame: function( ) {
                       //try
                       //{
                       var tabs = document.getElementById("content").browsers;
                       for(var i = 0; i < tabs.length; i++) {
                           var doc=tabs[i].contentWindow.document;
                           if(doc && doc.domain && doc.domain.match(/pardus.at/)) {
                               var main=doc.getElementsByName("main");
                               if(main && main[0] ) {
                                   return main[0].contentWindow.document;
                               }
                           }
                       }
                       return null;
                       /*}
                         catch(exception)
                         {
                         return null;
                         }*/
                   },

fn_get_screen: function( fi_main_frame) {
                   this.squad='0';
                   this.starbase=false;
                   this.planet=false;
                   if(!fi_main_frame) {return;}
                   var loc=fi_main_frame.location;
                   if(loc && loc.href) {
                       if(loc.href.match(this.squadMatch)) {
                           this.squad='1';
                       }
                       if(loc.href.match(this.starbaseMatch)) {
                           this.starbase=true;
                       }
                       if(loc.href.match(this.planetMatch)) {
                           this.planet=true;
                       }
                   }
                   return loc.href;
},

                  /**
                    * Finds the sector
                    */
fn_get_sector: function( fi_main_frame ) {
                   //var table=fi_main_frame.getElementsByTagName( "table" );
                   //if(! table) { return ""; }
                   //var fl_sector_text = table[2].rows[0].cells[0].innerHTML;
                   var fl_sector_text = fi_main_frame.getElementById('sector').innerHTML;
                   fl_sector_text = this.fn_clean_whitespace(fl_sector_text);
                   return fl_sector_text;
               },

               /**
                * Returns the position
                * in the current sector (e.g. "[13, 10]", "[11, 4]") the player is currently located at.
                * Value is returned as a two-element array: [x, y]
                */
fn_get_position: function( fi_main_frame ) {
                     //var fl_position_text = fi_main_frame.getElementsByTagName( "table" )[2].rows[0].cells[1].innerHTML;
                     var fl_position_text = fi_main_frame.getElementById('coords').innerHTML;
                     var wormhole = fi_main_frame.getElementsByTagName( "table" )[3].rows[1].cells[0].innerHTML;
                     if(wormhole) {
                         wormhole.match(this.whMatch);
                         wormhole=this.whMatch.exec();
                     }
                     // if it's a wormhole then the match above gave us an array. otherwise, it's empty.
                     if(wormhole && wormhole[0].match(this.jumpMatch)) {
                         this.wormhole=wormhole[0].replace(this.jumpMatch,"").replace(/</,"");
                     }
                     else {
                         this.wormhole="";
                     }
                     fl_position_text = fl_position_text.replace( /\[|\]/g, "" );
                     fl_position_text = this.fn_clean_whitespace( fl_position_text );
                     var fo = fl_position_text.split( /,/ );
                     fo[0] = parseInt( fo[0] );
                     fo[1] = parseInt( fo[1] );
                     return fo;
                 },

                 /**
                  * Strips leading and trailing whitespace from a string, and returns the result.
                  */
fn_clean_whitespace: function( fi_to_clean ) {
                         return fi_to_clean.replace(/<.+?>/g,"").replace( /^\s+/, "" ).replace( /\s+$/g, "" );
                     },

                     /**
                      * Finds the base path where the user has installed his or her Pardus images.
                      * If the user has not installed the Pardus image pack, the path will be http://www.pardus.at/images.
                      * Finds the base path by looking for turns_16x16.png and identifying its base path.
                      */ 
fn_get_image_base_path: function( fi_main_frame ) {
                            var fl_images = fi_main_frame.getElementsByTagName( "img" );
                            for ( var i = 0; i < fl_images.length; i++ ) {
                                var fl_href = fl_images[i].src;
                                if ( fl_href.match( /turns_16x16.png/ ) ) {
                                    this.base_path = this.fn_clean_whitespace( fl_href.replace( /turns_16x16.png/, "" ) );
                                    return this.base_path;
                                }
                            }
                        },

                        /**
                         * Creates a "blank" 7x7x2 array for populating with map information.
                         */
fn_new_maparray: function( ) {
                     var fo = new Array( this.gridMax );
                     for ( var i = 0; i < this.gridMax; i++ ) {
                         fo[ i ] = new Array( this.gridMax );
                         for ( var j = 0; j < this.gridMax; j++ ) {
                             fo[ i ][ j ] = new Array( 2 );
                         }
                     }
                     return fo;
                 },

                 /**
                  * Returns 7x7x2 matrix containing the background and foreground image names used in the main map, stripped
                  * of their base path (e.g. http://www.pardus.at/images) of each square in the main map.
                  */
fn_get_map: function( fi_main_frame ) {
                // var fl_base_path = this.fn_get_image_base_path( );
                var fl_base_path = this.base_path || this.fn_get_image_base_path( fi_main_frame );
                //sometimes the base path will be represented as file:/// and sometimes as file://,
                //  fl_alternate_base_path accounts for the second possibility.
                var fl_alternate_base_path = this.alternate_base_path;
                if(!fl_alternate_base_path) {
                    fl_alternate_base_path = fl_base_path.replace( /\/\/\//, "//" );
                    this.abpMatch=new RegExp( fl_alternate_base_path )
                }
                // These must be in this order because fn_get_maptable also sets the gridSize etc.
                // Yes, that's a side effect, which is a bad thing.
                var fl_maptable = this.fn_get_maptable( fi_main_frame);
                var fo = this.fn_new_maparray( );

                for ( var i = 0; i < fl_maptable.rows.length; i++ ) {
                    var cells = fl_maptable.rows[i].cells;
                    for ( var j = 0; j < cells.length; j++ ) {
                        var fl_current_cell = cells[j];
                        /* Pardus has a simple, but odd, algorithm for making the map in HTML:
                         * 1. If a square does not have a building or ship on it, 
                         *      place the background image for that square (e.g. space, nebula) in an IMG inside the table cell.
                         * 2. If a square has a building or ship on it,
                         *      place the background image for that square as the background-image style attribute
                         *      and place the building, ship, monster etc. in an IMG inside the table cell.
                         * The following if-else accounts for each possibility and extracts the appropriate
                         *   image names.
                         */
                        var fl_img = fl_current_cell.getElementsByTagName( "img" )[0].src.replace( fl_base_path, "" );
                        var fl_backgroundImage = fl_current_cell.style.backgroundImage;
                        if ( fl_backgroundImage != "" ) {
                            //strip the url(...)
                            fl_backgroundImage = fl_backgroundImage.replace( /url\(/, "").replace( /\)/, "" )
                                //strip the base path (e.g. file:///c:/pardus)
                                fl_backgroundImage = fl_backgroundImage.replace( this.abpMatch, "" );
                            //strip paths like "images/" with no base path per se
                            fl_backgroundImage = fl_backgroundImage.replace( this.imagesMatch, "" );
                            fo[i][j][0] = fl_backgroundImage;
                            fo[i][j][1] = fl_img;
                        }
                        else {
                            fo[i][j][0] = fl_img;
                            fo[i][j][1] = "";
                        }
                    }
                }
                return fo;
            },

            /**
             * Transforms a square location and information about the square into an XML element to output.
             * e.g fn_square_xml( 3, 7, "energy.png", "brewery.png" )
             */
fn_square_xml: function( fi_x, fi_y, fi_background, fi_foreground, fi_wh ) {
                   //Easiest way to account for the change of limited field ranges
                   if(fi_background.match(/nodata/) || fi_foreground.match(/nodata/)) return "";
                   var fo = "<sq x=\"" + fi_x + "\" y=\"" + fi_y + "\" ";
                   fo    += "bg=\"" + fi_background + "\" fg=\"" + fi_foreground + "\" ";
                   fo    += "wh=\"" + fi_wh + "\"/>\n";

                   return fo;
               },

               /**
                * Returns true if the user is at the Pardus Nav screen; false otherwise.
                * Works by looking for the "Status", "Commands", and "Ship" image labels.
                * May need to be fast to avoid race conditions, so the function's awkward form
                *    is the result of preemptive optimization.
                *    2009: Now looks for status, sector, and coords elements.
                */
fn_is_nav_screen: function( fi_main_frame ) {
                      //var fo = false;
                      if ( fi_main_frame != null ) {
                          if(!fi_main_frame.getElementById('status')) {
                              return false;
                          }
                          if(!fi_main_frame.getElementById('sector')) {
                              return false;
                          }
                          if(!fi_main_frame.getElementById('coords')) {
                              return false;
                          }
                          return true;
                      }
                      return false;
/*                      if ( fi_main_frame != null ) {
                          var fl_imgs = fi_main_frame.getElementsByTagName( "img" );
                          var i = 0;
                          for ( ; i < fl_imgs.length; i++ ) {
                              if ( fl_imgs[i].src.match( /status\.png/, "" ) ) {
                                  break;
                              }
                          }
                          for ( ; i < fl_imgs.length; i++ ) {
                              if ( fl_imgs[i].src.match( /commands\.png/, "" ) ) {
                                  break;
                              }
                          }
                          for ( ; i < fl_imgs.length; i++ ) {
                              if ( fl_imgs[i].src.match( /ship\.png/, "" ) ) {
                                  fo = true;
                                  break;
                              }
                          }
                      }
                      return fo;
*/
                  },

fn_is_sb_screen: function(fi_main_frame) {
                     if(! this.starbase || this.fl_last_sector=="") {
                         return false;
                     }
                     if(fi_main_frame != null) {
                         var h1=fi_main_frame.getElementsByTagName( "h1" );
                         if(h1 && h1.wrappedJSObject) {
                             h1=h1.wrappedJSObject[0];
                         }
                         if(h1 && h1.innerHTML && h1.innerHTML.match(this.sbLogoMatch)) {
                             var sbname=h1.innerHTML;
                             if(this.lastsb==sbname) {
                                 return false;
                             }
                             this.lastsb=sbname;
                             return sbname;
                         }
                     }
                     return false;
                 },
fn_is_planet_screen: function(fi_main_frame) {
                     if(! this.planet || this.fl_last_sector=="") {
                         return false;
                     }
                     if(fi_main_frame != null) {
                         var h1=fi_main_frame.getElementsByTagName( "h1" );
                         if(h1 && h1.wrappedJSObject) {
                             h1=h1.wrappedJSObject[0];
                         }
                         if(h1 && h1.innerHTML && h1.innerHTML.match(this.planetLogoMatch)) {
                             var planetname=h1.innerHTML;
                             if(this.lastplanet==planetname) {
                                 return false;
                             }
                             this.lastplanet=planetname;
                             return planetname;
                         }
                     }
                     return false;
},

fn_snapshot_sb: function(h1, server) {
                    // ok, it's a starbase main screen, get the sb name
                    h1=h1.replace(/<a href=.*?<\/a>/g,'');
                    h1=h1.replace(/<img.*?>/g,'');
                    h1=h1.replace(/&/g,'&amp;');
                    var pos=this.fl_last_position;
                    var sec=this.fl_last_sector;
                    var sb='<sb uni="' + server + '" sector="' + sec + '" x="' + pos[0] + '" y="' + pos[1] + '" name="' + h1 + '" />';
                    this.toWrite = this.toWrite + sb;
},

fn_snapshot_planet: function(h1, server) {
                    // ok, it's a planet main screen, get the planet name
                    h1=h1.replace(/<a href=.*?<\/a>/g,'');
                    h1=h1.replace(/<img.*?>/g,'');
                    h1=h1.replace(/&/g,'&amp;');
                    var pos=this.fl_last_position;
                    var sec=this.fl_last_sector;
                    var sb='<sb uni="' + server + '" sector="' + sec + '" x="' + pos[0] + '" y="' + pos[1] + '" name="' + h1 + '" />';
                    this.toWrite = this.toWrite + sb;
},

fn_snapshot_nav: function(fl_main_frame, server) {
                         var fl_sector   = this.fn_get_sector(fl_main_frame);
                         var fl_position = this.fn_get_position(fl_main_frame);

                         var fl_squares = new Array( 49 );
                         var fl_write_snapshot=false;
                         var fl_visited_key;
                         var fl_pos_0 = fl_position[0];
                         var fl_pos_1 = fl_position[1];

                         //if the player has not moved, do nothing.
                         var fl_has_moved = ( fl_sector != this.fl_last_sector );
                         fl_has_moved     = fl_has_moved || ( fl_pos_0 != this.fl_last_position[0] );
                         fl_has_moved     = fl_has_moved || ( fl_pos_1 != this.fl_last_position[1] );
                         if(fl_has_moved) {
                             this.fl_last_sector   = fl_sector;
                             this.fl_last_position = fl_position;
                             fl_visited_key=fl_sector + fl_pos_0 + fl_pos_1;
                         }
                         if ( fl_has_moved && !this.visited[fl_visited_key]) {
                             this.visited[fl_visited_key]=1;
                             var fl_map = this.fn_get_map(fl_main_frame);
                             fl_map[this.gridCenter][this.gridCenter][2]=this.wormhole;

                             for ( var i = 0; i < fl_map.length; i++ ) {
                                 var fl_x = i + fl_pos_0 - this.gridCenter;
                                 for ( var j = 0, len=fl_map[i].length; j < len; j++ ) {
                                     var fl_y = j + fl_pos_1 - this.gridCenter;
                                     var seen_key=fl_sector + fl_x + fl_y;
                                     if(!this.seen[seen_key] || fl_map[j][i][2]) {
                                         // if we havent seen this, or this is a wormhole
                                         this.seen[seen_key]=1;
                                         var fl_background = fl_map[j][i][0];
                                         var fl_foreground = fl_map[j][i][1];
                                         var fl_wh = fl_map[j][i][2] || "";
                                         fl_write_snapshot=true;
                                         fl_squares[ i * this.gridMax + j ] = this.fn_square_xml( fl_x, fl_y, fl_background, fl_foreground, fl_wh);
                                     } // if not seen
                                 } // inner for loop
                             } // outer for loop

                             if(fl_write_snapshot) {
                                 this.numsnaps++;
                                 var towrite='<snap uni="' + server + '" sector="' + fl_sector + '" x="' + fl_pos_0 + '" y="' + fl_pos_1 +'" squad="' + this.squad + '">' ;
                                 for ( var i = 0; i < fl_squares.length; i++ ) {
                                     if(fl_squares[i]) {
                                         towrite = towrite + fl_squares[i];
                                     }
                                 }
                                 this.toWrite = this.toWrite + towrite + "</snap>\n";
                             } // write snapshot

                         } // has_moved
},

fn_snapshot: function() {
                 //if the user is not at the Nav screen, do nothing.
                 try {
                     var fl_main_frame=this.fn_get_main_frame();
                     var server=this.fn_get_screen(fl_main_frame);
                     if(server.match(/orion/)) {
                         server='orion';
                     } else if(server.match(/pegasus/)) {
                         server='pegasus';
                     } else if(server.match(/artemis/)) {
                         server='artemis';
                     } else {
                         return;
                     }
                     if ( true == this.fn_is_nav_screen(fl_main_frame) ) {
                         this.fn_snapshot_nav(fl_main_frame, server);
                     } // is a nav screen
                     else {
                         var sbscreen= this.fn_is_sb_screen(fl_main_frame);
                         var planetscreen= this.fn_is_planet_screen(fl_main_frame);
                         if(sbscreen) {
                             this.fn_snapshot_sb(sbscreen, server);
                         } // is a starbase screen
                         if(planetscreen) {
                             this.fn_snapshot_planet(planetscreen, server);
                         } // is a planet screen
                     }
                 } //try
                 catch ( fl_exception ) { 
                     alert('Error: '+fl_exception);
                     this.finish();
                 }
                 this.fn_sendloop();
             },

fn_senddata: function(dat, datatype, xmlroot) {
                 var fullUrl = "http://pardus.butterfat.net/fcgi/" + datatype + ".pl";
                 var httpRequest = new XMLHttpRequest();
                 httpRequest.open("POST", fullUrl, true);
                 httpRequest.onload = this.fn_infoReceived;
                 httpRequest.setRequestHeader('Content-Type','text/xml');
                 httpRequest.send('<'+xmlroot+'>' + dat + '</' + xmlroot + '>');
             },

fn_infoReceived: function() {
                     var output = httpRequest.responseText;
                     if(output.length) {
                         output = output.replace(/\W*$/, "");
                         if(output.length) {
                             this.finish();
                             var status = document.getElementById('pardusajaxmapperoff');
                             status.label = "Message!";
                             status.tooltipText = output;
                         }
                     }
                 },

fn_sendsnapshot: function() {
                     var now=new Date();
                     var sec=now.valueOf();
                     if(this.numsnaps>5 || 
                             (this.numsnaps>0 && this.lastsendtime +19000 < sec ) // milliseconds
                       ) {
                         this.numsnaps=0;
                         var dat=this.toWrite;
                         this.toWrite="";
                         this.lastsendtime=sec;
                         this.fn_senddata(dat,"snapshot", "pardusmap");
                     }
                 },

fn_sendloop: function() {
                 if(true == this.should_do ) {
                     gBrowser.removeEventListener("load", this.fn_pageLoad, true);
                     //this.fn_snapshot();
                     this.fn_sendsnapshot();
                     gBrowser.addEventListener("load", this.fn_pageLoad, true);
                     //window.setTimeout("PardusAjaxAutoMapper.fn_sendloop();", 1000);
                 } // if should_do
             },

fn_pageLoad: function() {
                 PardusAjaxAutoMapper.fn_snapshot();
             },

start: function(){
           var now=new Date();
           this.lastsendtime=now.valueOf();

           // variable map size
           this.gridSize=25;
           this.gridCenter=2;
           this.gridMax=5;

           this.numsnaps=0;
           this.toWrite = "";
           this.fl_last_sector = "";
           this.fl_last_position = [-1,-1];
           this.should_do = true;
           this.visited = new Object;
           this.seen = new Object;
           this.base_path = null;
           this.alternate_base_path = null;
           this.lastsb='';

           this.imagesMatch = new RegExp( "images\/" );
           this.whMatch = new RegExp( "Jump to [^<]*<" );
           this.jumpMatch = new RegExp( "Jump to " );
           this.squadMatch = new RegExp( "squad" );
           this.starbaseMatch = new RegExp( "starbase.php" );
           this.planetMatch = new RegExp( "planet.php" );
           this.sbLogoMatch = new RegExp( "foregrounds/starbase_" );
           this.planetLogoMatch = new RegExp( "foregrounds/planet_" );
           this.abpMatch = null;

           this.squad='0';
           this.starbase=false;
           this.planet=false;
           this.wormhole="";
           //this.output_textstream = this.fn_new_xml_output_file(); //textstream to write data to
           //alert("Starting Pardus Automapper");
           document.getElementById('pardusajaxautomapper_start').style.display="none";
           document.getElementById('pardusajaxautomapper_end').style.display=null;
           /*var statuson = document.getElementById('pardusajaxmapperon');
           var statusoff = document.getElementById('pardusajaxmapperoff');
           statuson.style.display="block";
           statusoff.style.display="none";*/
           gBrowser.addEventListener("load", this.fn_pageLoad, true);
       },

finish: function(){
            this.should_do = false;
            gBrowser.removeEventListener("load", this.fn_pageLoad, true);
            //alert("Stopping Pardus Automapper (" + this.numsnaps + ")");
            if(this.numsnaps>0) {
                this.fn_senddata(this.toWrite,"snapshot", "pardusmap");
            }
            document.getElementById('pardusajaxautomapper_start').style.display=null;
            document.getElementById('pardusajaxautomapper_end').style.display="none";
            /*var statuson = document.getElementById('pardusajaxmapperon');
            var statusoff = document.getElementById('pardusajaxmapperoff');
            statuson.style.display="none";
            statusoff.style.display="block";*/
        }

};
