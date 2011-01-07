// ==UserScript==
// @name           Pardus Pathfinder
// @namespace      pardus.at
// @description    Adds a view of the path your ship will take to the Pardus Navigation Screen
// @include        http://*.pardus.at/main.php
// @author         satyap
// @version        1.2

// ==/UserScript==

// Functionality from Rhindon's Pardus Nav Grid script is included. But this
// should be considered a whole new script.
//
//
//
// Changelog:
//
// 20090504: Version 1.2 Fixes for Premium screen sizes. Thanks to "Pants" for
// the code, modified by satyap to accomodate many different sizes.
//
// 20090425: Version 1.1 Fixes wandering into non-passable fields like energy and nodata. Shows AP cost.
//
// 20090425: First release.


// There is no need to change these values.
var xCenter=2;
var yCenter=2;
var xMax=2;
var yMax=2;

function PardusPathfinder() {

    //Set to false if you don't want the center square highlighted
    var highlightCenterSquare = true;

    //You can change the color of the gridlines and the center highlight here.
    var color           = "#282828";
    var highlightColor  = "#00ff00";
    var centerColor  = "darkred";

    var solid_top = " height: 63px;border-top:    solid 1px " + centerColor + ";";
    var solid_rt  = " width:  63px;border-right: solid  1px " + centerColor + ";";

    function dashed_top(local_color) {
        return " height: 63px;border-top: dashed 1px " + local_color + ";";
    }
    function dashed_bottom(local_color) {
        return " height: 62px;border-bottom: dashed 1px " + local_color + ";";
    }
    function dashed_left(local_color) {
        return " width: 62px;border-left: dashed 1px " + local_color + ";";
    }
    function dashed_rt(local_color) {
        return " width: 63px;border-right: dashed 1px " + local_color + ";";
    }

    function BindArguments(fn) // magic closure stuff.
    {
        var args = [];
        for (var n = 1; n < arguments.length; n++)
            args.push(arguments[n]);
        return function () { return fn.apply(this, args); };
    }

    function resetStyle(ng, x,y) {
        document.getElementById("nf" + y + "_" + x).setAttribute('style', ""+ ng[y][x][1]);
    }
    function addToStyle(ng, x,y, extra) {
        var elem = document.getElementById("nf" + y + "_" + x);
        elem.setAttribute('style', "" + elem.getAttribute('style') + " " + extra + ";");
    }
    function setHilite(x,y,ng) {
        // draw top and right
        set_border(ng, x, y, highlightColor);
        // draw the left side
        if(x == 0)
            addToStyle(ng, x, y, "border-left: 1px dashed " + highlightColor);
        else
            if(x==(xCenter+1) && y==yCenter)
                addToStyle(ng, x-1, y, "border-right: 1px solid " + highlightColor);
            else
                addToStyle(ng, x-1, y, "border-right: 1px dashed " + highlightColor);
        // draw the bottom
        if(y == yMax)
            addToStyle(ng, x, y, "border-bottom: 1px dashed " + highlightColor);
        else
            if(y==(yCenter-1) && x==xCenter)
                addToStyle(ng, x, y+1, "border-top: 1px solid " + highlightColor);
            else
                addToStyle(ng, x, y+1, "border-top: 1px dashed " + highlightColor);
    }

    function setapcost(ng, x, y, cost) {
        if(cost==0) {
            var n = document.getElementById("ppr_" + x+y);
            if(n)
                n.parentNode.removeChild(n);
        }
        else {
            var t=document.createTextNode("" + cost);
            tile=ng[y][x][0];
            var n=document.createElement('p');
            n.appendChild(t);
            n.style.zIndex=100;
            n.style.position='absolute';
            n.style.backgroundColor='yellow';
            n.style.color='black';
            n.style.left=tile.style.left;
            n.style.top="" + (y*64 + 2) + "px";
            n.id="ppr_" + x+y;
            tile.parentNode.appendChild(n);
        }
    }

    var hl = function (x,y,ng, do_hl) {
        var plist=new PardusPathfinderRouter(x,y,ng, do_hl);
        var apcost=0;
        for(i=0;i<plist.length;i++) {
            var t_x = plist[i][1];
            var t_y = plist[i][0];
            if(do_hl==1) {
                apcost = plist[i][2];
                setapcost(ng, t_x, t_y, apcost);
                setHilite(t_x, t_y, ng);
            } else {
                setapcost(ng, t_x, t_y, 0);
                if(t_x > 0)
                    resetStyle(ng, t_x-1, t_y);
                if(t_y < yMax)
                    resetStyle(ng, t_x, t_y+1);
                resetStyle(ng, t_x, t_y);
            }
        }
    };

    function get_style(x,y,local_color) {
        var styles="";
        if(highlightCenterSquare && x==xCenter && y==yCenter) {
            styles += solid_top + solid_rt;
        } else if(highlightCenterSquare && x==(xCenter-1) && y==yCenter) {
            styles += dashed_top(local_color) + solid_rt;
        } else if(highlightCenterSquare && x==xCenter && y==(yCenter+1)) {
            styles += solid_top + dashed_rt(local_color);
        } else {
            styles += dashed_top(local_color) + dashed_rt(local_color);
        }
        if(y==yMax) {
            styles += dashed_bottom(local_color);
        }
        if(x==0) {
            styles += dashed_left(local_color);
        }
        return styles;
    }

    function set_border(ng, x,y, local_color) {
        addToStyle(ng, x, y, get_style(x,y,local_color));
    }

    function gather_navgrid() {
        var img = document.getElementsByTagName('img');

        var x=0;
        var y=0;
        var navgrid=new Array();
        var count=0;

        // count the navscreen fields
        for(i = 0; i < img.length; i++) {
            if(img[i].getAttribute('class') == 'nf') {
                count+=1;
            }
        }

        // calculate maxes and centers
        xMax=Math.sqrt(count) - 1;
        yMax=xMax;
        yCenter=yMax/2;
        xCenter=xMax/2;
        count=0;
        for(i = 0; i < img.length; i++) {
            if(img[i].getAttribute('class') == 'nf') {
                count+=1;
                if(x==0) {
                    navgrid[y]=new Array;
                }
                var oldstyle = (img[i].getAttribute('style') == undefined) ? '' : img[i].getAttribute('style');
                if (oldstyle != '' && oldstyle[oldstyle.length - 1] != ';') oldstyle += ';';
                img[i].setAttribute('style', oldstyle); // save any existing styles before we touch it.
                img[i].id="nf" + y + "_" + x;
                navgrid[y][x] = new Array(img[i], oldstyle, 0);

                x += 1;
                if(x>xMax) {
                    y += 1;
                    x = 0;
                }
            }
        }
        return navgrid;
    }

    function set_events() { // ...in motion
        var navgrid = gather_navgrid();
        var apcostoffset = PardusPathfinderApCostOffset(navgrid);
        for(y=0;y<=yMax;y++) {
            for(x=0;x<=xMax;x++) {
                //  But first set the border.
                set_border(navgrid, x, y, color);
                navgrid[y][x][2] = PardusPathfinderGetApCost(navgrid[y][x][0]) + apcostoffset;
                navgrid[y][x][1] = navgrid[y][x][0].getAttribute('style'); // save our grey-border style
                navgrid[y][x][0].addEventListener('mouseover', BindArguments(hl,x,y,navgrid, 1), false);
                navgrid[y][x][0].addEventListener('mouseout', BindArguments(hl,x,y,navgrid, 0), false);
            }
        }
    }

    set_events();
}


function PardusPathfinderRouter(x,y,navgrid, hl) {

    function is_passable(x,y) {
        var img=navgrid[y][x][0];
        if (
                img.src.indexOf("nodata")!=-1 ||
                img.src.indexOf("energymax")!=-1
           ) {
            return false;
        }
        return true;
    }

    function get_ch_distance(x1,y1,x2,y2) {
        // returns the chessboard/chebyshev distance
        // = max of the absolute difference between coordinates
        var x_diff=x1-x2;
        var y_diff=y1-y2;
        if(x_diff<0) { x_diff = 0 - x_diff;}
        if(y_diff<0) { y_diff = 0 - y_diff;}
        // maybe simpler/faster than Math.abs?
        if(x_diff>y_diff) {
            return x_diff;
        } else {
            return y_diff;
        }
    }

    function get_adjacent(t_x, t_y, n_x, n_y, x, y) {
        // Going from t_x, t_y to something adjacent to n_x, n_y in a direction that brings us closer to x,y.
        // This needs to be a full-blown Djikstra's algorithm. Bah.
        var a_x=n_x; // a=alternative
        var a_y=n_y;

        // try various combinations of t_x+/-1, t_y+/-1.
        var squares=new Array(8);
        // get all their distances from x,y
        var old_d=10;
        for(x_off=-1;x_off<=1;x_off++) {
            for(y_off=-1;y_off<=1;y_off++) {
                if(x_off==0 && y_off==0) {
                    y_off+=1;
                }
                var o_x = t_x + x_off;
                var o_y = t_y + y_off;
                if(o_x>=0 && o_x <= xMax && o_y>=0 && o_y <= yMax) {
                    var d=get_ch_distance(x,y,o_x, o_y);
                    if(d<old_d && is_passable(o_x, o_y)) {
                        old_d=d;
                        a_x=o_x;
                        a_y=o_y;
                    }
                }
            }
        }

        // if the new coords are the same as the old, unworkable coords, forget about it.
        if(
                (a_x==n_x && a_y==n_y) ||
                (a_x==t_x && a_y==t_y) 
          ) {
            return null;
        }
        return new Array(a_x, a_y);
    }

    var findPath = function(x,y) {
        if (!is_passable(x,y) ) {
            return new Array; // if the destination isn't passable, what's the point?
        }
        var t_x=xCenter;
        var t_y=yCenter;
        var plist=new Array();
        plist[plist.length] = new Array(t_y, t_x, 0);
        var count=0;
        var apcost=0;
        while(t_x != x || t_y != y) {
            count += 1;
            var n_x=t_x;
            var n_y=t_y;
            var apcost_this_tile=navgrid[t_y][t_x][2];
            if(x < t_x) { n_x-=1; }
            if(x > t_x) { n_x+=1; }
            if(y < t_y) { n_y-=1; }
            if(y > t_y) { n_y+=1; }
            // Test the indicated square if it's passable.
            if(is_passable(n_x, n_y)) {
                t_x = n_x;
                t_y = n_y;
            } else {
                // If it's not, then check the adjacent ones and pick whatever
                // brings us nearest to the goal (x,y)
                // Actually, why do that? Just use the algorithm to calculate
                // "shortest" path. ... Because that leads to bugs.
                var new_sq=get_adjacent(t_x, t_y, n_x, n_y, x, y);
                if (new_sq==null) {
                    return plist;
                }
                t_x=new_sq[0];
                t_y=new_sq[1];
            }
            if(count > 80) { // infinite loop -- considering there are 81 max squares on the navgrid.
                return plist;
            }
            apcost+=apcost_this_tile;
            plist[plist.length] = new Array(t_y, t_x, apcost);
        }
        return plist;
    }
    var plist = findPath(x,y);
    return plist;
}

function PardusPathfinderGetApCost(tile) {
        var basecost=0;
        var src=tile.src;
        if (src.indexOf('backg')==-1) {
            src=tile.parentNode;
            if(src.nodeName=='A')
                src=src.parentNode;
            src=src.getAttribute('style');
        }
        if(src.indexOf('space')!=-1)
            basecost=10;
        else if(src.indexOf('neb')!=-1)
            basecost=15;
        else if(src.indexOf('energy')!=-1)
            basecost=19;
        else if(src.indexOf('ast')!=-1)
            basecost=24;
        else if(src.indexOf('ema')!=-1)
            basecost=35;
        return basecost;
}

function PardusPathfinderApCostOffset(navgrid) {
    var centerTile=navgrid[xCenter][yCenter][0];
    var tds=document.getElementsByTagName("td");
    var mc=0;
    for(var i=5; i<tds.length; i++) {
        var children = tds[i].childNodes;
        for(j=0; j<children.length; j++) {
            if(children[j].tagName=="IMG" && children[j].src.indexOf("movement")!=-1) {
                x=parseInt(tds[i-1].childNodes[0].nodeValue);
                var basecost = PardusPathfinderGetApCost(centerTile);
                return x - basecost;
            }
        }
    }
    return 0;
}

PardusPathfinder();
