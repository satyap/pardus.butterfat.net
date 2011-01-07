// ==UserScript==
// @name           Pardus Autopilot
// @namespace      pardus.butterfat.net
// @description    Follow a defined route
// @include        http://*.pardus.at/main.php
// @author         satyap
// @version        1.2

// ==/UserScript==

// Changelog:
//
// 20090505: Version 1.2: Based on feedback from 'Pants', added an autopilot
// step button instead of a fully-automatic course follower.
//
// 20090428: Added a way to delete courses, and made the block blend in a little under the Cargo panel.
// 20090426: First release.

function PardusAutopilot() {
    var pathname_id='PardusBfatAutoPathname';
    var buttons_id='PardusBfatAutoButtons';
    var buttontable_id='PardusBfatAutoButtonsTable';
    var select_id='PardusBfatAutoSelector';
    var mybuttons_id='PardusBfatAutoMyButtons';

    function copy_table() {
        // returns an empty table, suitable for populating your own stuff
        function panelside(base) {
            return '<td style="background-image:url(' + base + '.png);background-repeat:repeat-y"></td>'
        }
        function paneledge(base) {
            return '<td style="width: 182px;background-image:url(' + base + '.png);background-repeat:repeat-x"></td>';
        }
        function panelcorner(base) {
            return '<td style="width:14px;height:9px;vertical-align:top;"><img src="' + base + '.png"/></td>';
        }
        var cornerstyle_td='width:14px;height:14px;vertical-align:top;';
        var img=document.getElementsByTagName('img');
        var stat;
        var status_start=0;
        for(var i=0; i<img.length;i++) {
            status_start=img[i].src.indexOf('status.png');
            if(status_start!=-1) {
                stat=img[i];
                break;
            }
        }
        if(!stat)
            return;
        var base=stat.src.substring(0,status_start);


        var tbl=document.createElement('table');
        tbl.id=buttontable_id
        tbl.border="0";
        tbl.cellSpacing="0";
        tbl.cellPadding="0";
        tbl.innerHTML='<tr>' +
            panelcorner(base + 'text1') +
            paneledge(base + 'text2') +
            panelcorner(base + 'text3') +
            '</tr><tr>' +
            panelside(base + 'text4') +
            '<td id="' + mybuttons_id + '"></td>' +
            panelside(base + 'text5') +
            '</tr>' +
            '<tr>' +
            panelcorner(base + 'text6') +
            paneledge(base + 'text7') +
            panelcorner(base + 'text8') +
            '</tr>'
            ;

        return tbl;
    }

    function BindArguments(fn) // magic closure stuff.
    {
        var args = [];
        for (var n = 1; n < arguments.length; n++)
            args.push(arguments[n]);
        return function () { return fn.apply(this, args); };
    }

    function gather_navgrid() {
        var img = document.getElementsByTagName('img');

        var x=0;
        var y=0;
        var navgrid=new Array();
        var count=0;
        for(i = 0; i < img.length; i++) {
            if(img[i].getAttribute('class') == 'nf') {
                count+=1;
                if(x==0) {
                    navgrid[y]=new Array;
                }
//                var oldstyle = (img[i].getAttribute('style') == undefined) ? '' : img[i].getAttribute('style');
//                if (oldstyle != '' && oldstyle[oldstyle.length - 1] != ';') oldstyle += ';';
//                img[i].setAttribute('style', oldstyle); // save any existing styles before we touch it.
//                img[i].id="nf" + y + "_" + x;
//                navgrid[y][x] = new Array(img[i], oldstyle, 0);
                navgrid[y][x] = new Array(img[i], 0);

                x += 1;
                if(x>6) {
                    y += 1;
                    x = 0;
                }
            }
        }
        return navgrid;
    }

    function is_integer(n) {
        return !isNaN(parseInt(n));
    }

    function eavesdrop(nf) {
        var a=nf.parentNode;
        if( a.tagName.toUpperCase()!='A')
            return;
        var cl=a.getAttribute('onclick');
        if(cl.indexOf('nav')==-1) {
            return;
        }
        var start=cl.indexOf('(');
        var end=cl.indexOf(')');
        var id=cl.substring(start+1, end);
        a.addEventListener('click', BindArguments(store_click, id), false);
    }

    function store_click(id) {
        if(!GM_getValue('follow')) {
            return;
        }
        var current_path=GM_getValue('current_path');
        if(!current_path || current_path.length<=0) {
            return;
        }
        var path=GM_getValue('path_' + current_path);
        if(!path) {
            path="";
        }
        path += " "+id;
        //GM_log("path: " + path);
        GM_log("recorded: " + id);
        GM_setValue('path_' + current_path, path);
    }

    function save_pathname(pathname) {
        var pathnames=GM_getValue('pathnames');
        if(pathnames && pathnames.length>0) {
            var plist=pathnames.split('|');
            for(var i=0;i < plist.length;i++) {
                if(pathname==plist[i]) {
                    return;
                }
            }
            pathnames += '|' + pathname;
        } else {
            pathnames=pathname;
        }
        GM_setValue('current_path', pathname);
        GM_setValue('pathnames', pathnames);
    }

    function get_all_pathnames() {
    }

    function get_pathname() {
        var pathname=document.getElementById(select_id).value;
        if(pathname && pathname.length>0) {
            GM_setValue('current_path', pathname);
            return true;
        }
        return false;
    }

    function remove_course() {
        var pathname=document.getElementById(select_id).value;
        if(!pathname || pathname.length<1) {
            GM_log('Bad pathname given');
            return;
        }
        var pathnames=GM_getValue('pathnames');
        if(!pathnames || pathnames.length<1) {
            GM_log('No pathnames stored');
            return
        }
        var plist=pathnames.split('|');
        var plist2=new Array;
        GM_log(plist.join('|'));
        pathnames='';
        for(var i=0;i < plist.length;i++) {
            if(pathname==plist[i]) {
                GM_setValue('path_' + plist[i], '');
                //delete plist[i];
            } else {
                plist2[plist2.length]=plist[i];
            }

        }
        GM_setValue('pathnames', plist2.join('|'));
        GM_log(plist.join('|'));
        reset_buttons();
    }

    function start_follow() {
        var pathname=document.getElementById(pathname_id);
        GM_log(pathname);
        pathname=pathname.value;
        if(pathname && pathname.length>0) {
            GM_setValue('follow', true);
            GM_setValue('path_' + pathname, '');
            save_pathname(pathname);
            record();
            reset_buttons();
        }
        else {
            alert("Put a path name in the text box");
        }
    }

    function stop_follow() {
        GM_setValue('follow', false);
        reset_buttons();
    }

    function engage() {
        if(get_pathname()) {
            GM_setValue('engage', true);
            GM_setValue('idx', 0);
            autopilot();
        }
    }

    function disengage() {
        GM_setValue('engage', false);
        reset_buttons();
    }

    function record() {
        if(!GM_getValue('follow')) {
            return;
        }
        var navgrid=gather_navgrid();
        for(var i=0; i <= 6; i++) {
            for(var j=0; j <= 6; j++) {
                eavesdrop(navgrid[i][j][0]);
            }
        }
    }

    function autopilot() {
        if(!GM_getValue('engage')) {
            return;
        }
        pathname=GM_getValue('current_path');
        var idx=GM_getValue('idx');
        if(!idx || isNaN(idx)) {
            idx=0;
        }
        var pathstring=GM_getValue('path_' + pathname)
            if(!pathstring || pathstring.length<1) {
                alert('No course laid in');
                disengage();
            }
        var path=pathstring.split(' ');
        //GM_log("path: " + GM_getValue('path'));
        //GM_log("idx: " + idx);
        //GM_log("pathNode: " + path[idx]);
        if(idx < path.length-1 && !is_integer(path[idx])) {
            idx += 1;
        }
        //GM_log("idx: " + idx);
        //GM_log("pathNode: " + path[idx]);
        //GM_log("path length: " + path.length);
        //GM_log("is_int: " + is_integer(path[idx]));
        if(idx < path.length && path[idx]) {
            if(is_integer(path[idx])) {
                GM_log("nav_to: " + path[idx]);
                nav(path[idx]);
            }
            GM_setValue('idx', idx+1);
        } else {
            disengage();
            //alert("We have arrived.");
        }

    }

    function reset_buttons() {
        var b=document.getElementById(buttontable_id);
        b.parentNode.removeChild(b);
        add_buttons();
    }

    function create_button(title, on_event, eventlistener, append_to) {
        var b1=document.createElement('input');
        b1.value=title;
        b1.type="button";
        b1.addEventListener(on_event, eventlistener, false);
        append_to.appendChild(b1)
        return b1;
    }

    function create_textbox(id, append_to) {
        var b1=document.createElement('input');
        b1.type="text";
        b1.id=id;
        b1.style.width="170px;";
        append_to.appendChild(b1)
        return b1;
    }

    function br(append_to) {
        append_to.appendChild(document.createElement('br'));
    }

    function add_options(s,options) {
        for(var i=0; i<options.length;i++) {
            var o=document.createElement('option');
            o.appendChild(document.createTextNode(options[i]));
            o.value=options[i];
            s.appendChild(o);
        }
    }

    function add_buttons() {
        var my_buttons=document.createElement('div');
        var select=document.createElement('select');
        var pathnames=GM_getValue('pathnames');
        var tb=create_textbox(pathname_id, my_buttons);
        my_buttons.id=buttons_id;
        br(my_buttons);
        var following=GM_getValue('follow');
        var engaged=GM_getValue('engage');
        if(following) {
            create_button('Finish course', 'click', stop_follow, my_buttons);
        } else {
            create_button('Lay in Course', 'click', start_follow, my_buttons);
        }
        br(my_buttons);
        if(pathnames) {
            select.id=select_id;
            add_options(select, GM_getValue('pathnames').split("|"));
            my_buttons.appendChild(select);
        }
        if(engaged) {
            create_button('Drop to impulse', 'click', disengage, my_buttons);
        } else {
            if(!following)
                    create_button('Engage', 'click', engage, my_buttons);
        }
        br(my_buttons);
        if(!following && !engaged) {
            create_button('Delete', 'click', remove_course, my_buttons);
        }
        var new_table=copy_table();
        var tables=document.getElementsByTagName('table');
        var b_parent=tables[12];
        if(new_table) {
            b_parent.appendChild(new_table);
            b_parent=document.getElementById(mybuttons_id);
        }
        b_parent.appendChild(my_buttons);
    }

    // This is an improved version of the nav() function from Pardus. We can't
    // access the JS functions in the document safely, so it's re-written here.
    // Blech. It's also longer than the one in the document because of some
    // weirdness involving greasemonkey's idea of the DOM.
    function nav(to) {
        var navform=document.getElementById('navForm');
        var c=navform.childNodes;
        for(var i=0;i<c.length;i++) {
            if(c[i].name=='destination') {
                c[i].value=to;
                break;
            }
        }
        // Instead of submitting the form, give a button. Can't spend APs automatically.
        var inp=document.createElement('input');
        inp.type='submit';
        inp.value='Autopilot Step';
        create_button('Auto-step', 'click', function() {
                navform.submit();
                }, document.getElementById(mybuttons_id));
    }


    add_buttons();
    record();
    autopilot();

}

PardusAutopilot();
