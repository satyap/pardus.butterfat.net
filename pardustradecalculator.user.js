// ==UserScript==
// @name           Pardus Trade Calculator
// @namespace      pardus.at
// @author         Satyap
// @version        1.4
// @description    Calculates the (max - amount) and (amount - min) on trade screens
// @include        http://*.pardus.at/starbase_trade.php
// @include        http://*.pardus.at/planet_trade.php
// @include        http://*.pardus.at/building_trade.php
//
//==Notes==

// Changelog
//
// 20070116 Bugfix: properly adding the table cell to the DOM
//
// 20070115 Bugfix: selecting the input box for clickability redux
//
// 20070114 Bugfix: selecting the input box for clickability
//
// 20070113 Now indicates how much of each commodity you *could* sell, if you had any.

// --user options---------------------------------------------------


// --end user options-----------------------------------------------

var debug=true;

function setSBbuy(buy, ship_space, amt, min) {
    var diff;
    diff=amt-min;
    if(diff > ship_space) { diff=ship_space; }
    if(diff<0) {return}
    if(!buy) return;
    append_link_cell(buy, "" + diff, "javascript:useMax('" + buy.firstChild.name + "', " + diff + ");" );
}

function setSBsell(sell, sb_space, amt, max, amt_ship, href) {
    var diff;
    diff=max-amt;
    if(diff > sb_space) { diff=sb_space; }
    if(diff > amt_ship && amt_ship!=0) { diff=amt_ship; }
    if(diff<0) {diff=0;}
    if(href) {
        append_link_cell(sell, "" + diff, "javascript:useMax('" + href.name + "', " + diff + ");" );
    } else {
        append_link_cell(sell, "" + diff, "" );
    }
}
function append_link_cell(target, text, href) {
    if(!target) {return}
    var ns;
    var txt = document.createTextNode(text);
    if(href!="") {
        ns=document.createElement('a');
        ns.appendChild(txt);
        ns.href=href;
    }
    else {
        ns=txt;
    }
    var td=document.createElement('td');
    td.appendChild(ns);
    target.parentNode.appendChild(td);
}

function examineRow(tr) {
    var cells = tr.getElementsByTagName('td');
    var max;
    var amt;
    var min;
    var target;
    var diff;
    var name=cells[1].innerHTML
    if(cells.length==5) {
        // building trade left side (ship)
        amt=2;
        target=4;
        amt=parseInt(cells[amt].innerHTML.replace(/<.*?>/g,''));
        var x=new Array();
        x["amt"]=amt;
        x["target"]=cells[target];
        x['href']=x["target"].firstChild
        ship[name]=x;
    }
    if(cells.length==7) {
        // building trade right side (building)
        amt=2;
        min=3;
        max=4
        target=6;
        amt=parseInt(cells[amt].innerHTML.replace(/<.*?>/g,''));
        var x=new Array();
        x["amt"]=amt;
        x["target"]=cells[target];
        x["min"]=parseInt(cells[min].innerHTML);
        x["max"]=parseInt(cells[max].innerHTML);
        bldg[name]=x;
        x['href']=x["target"].firstChild
        if(x["href"]) shipfree -= x["href"].value;
    }
}

function updateTables() {
    for(var name in ship) {
        var b=bldg[name];
        var s=ship[name];
        setSBsell(s["target"], bldgfree, b["amt"], b["max"], s["amt"], s["href"]);
    }
    for(var name in bldg) {
        var b=bldg[name];
        setSBbuy(b["target"], shipfree, b["amt"], b["min"]);
    }
}


function getResData() {
    var i;
    var tags = document.getElementsByTagName("img");
    for(i=0; i < tags.length; i++) {
        if(tags[i].hasAttribute('src')) {
            var attr = tags[i].getAttribute('src');
            if(attr.search(/res/) != -1) { examineRow( tags[i].parentNode.parentNode ); }
        }
    }
}

function getFreeSpace() {
    var i;
    var tags = document.getElementsByTagName("td");
    for(i=0; i < tags.length; i++) {
        if(tags[i].hasAttribute('colspan')) {
            var content=tags[i].innerHTML;
            if(content.search(/t$/) != -1) {
                var attr = tags[i].getAttribute('colspan');
                if(attr=='4') { bldgfree = parseInt(content) }
                if(attr=='3') { shipfree = parseInt(content) }
            }
        }
    }
}

function calcAmounts() {
    getResData();
    getFreeSpace();
    updateTables();
}

function log(msg) {
    if (debug) { debugArea.innerHTML += msg + '<br/>'; }
}

var debugArea=document.createElement('p');
var ship=new Array();
var bldg=new Array();
var shipfree=100000;
var bldgfree=100000;

if(location.href.search(/building_trade.php/) != -1) {
//    var recalc=document.createElement("a");
//    var t=document.getElementsByTagName("table")[0];
//    recalc.href="javascript:GM_calcAmounts()";
//    recalc.appendChild(document.createTextNode("Recalc"));
//    t.parentNode.insertBefore(recalc,t);
    calcAmounts();
}

if(location.href.search(/starbase_trade.php/) != -1 || location.href.search(/planet_trade.php/) != -1) {
    var i=0;
    var ship_space=parseInt(unsafeWindow.ship_space);
    var sb_space=parseInt(unsafeWindow.sb_space);
    var uw_amt_max=unsafeWindow.amount_max;
    var uw_amt_min=unsafeWindow.amount_min;
    var uw_amt=unsafeWindow.amount;
    var uw_amt_ship=unsafeWindow.amount_ship;
    for(i=0; i< unsafeWindow.res_names.length; i++) {
        var amt=parseInt(uw_amt[i]);
        var amt_ship=parseInt(uw_amt_ship[i]);
        var max=parseInt(uw_amt_max[i]);
        var min=parseInt(uw_amt_min[i]);
        var buy=document.getElementById("buy_" + i);
        var sell=document.getElementById("sell_" + i);
        if(!isNaN(max) && !isNaN(min) && !isNaN(amt)) {
            if(buy) { setSBbuy(buy.parentNode, ship_space, amt, min); }
            if(sell) { setSBsell(sell.parentNode, sb_space, amt, max, amt_ship, sell); }
        }
    }
}

if (debug) {
    var table=document.getElementsByTagName('table');
    table[0].parentNode.insertBefore(debugArea,table[0]);
}

