var ttypes=new Array('spa','neb','ast', 'energy','em','vir', 'sb');
var mc=new Array(11,16,25,  20,36,18, 5); // basic weights, to be modified by... 
var drivespeed=1; // set that based on the dropdown, in the init function
var fuel=new Array(100,125,100,150,200,150,225,250,225);

// array indices and Dijkstra's constants
var paths=0; // array paths stored at index 0
var x=1; // coordinates of node at 1,2
var y=2;
var distance=3; // distance flag stored at 1
var inpath=4; // inpath flag stored at index 2
var previous=5; // relaxation flag stored at index 3
var direction=6; // direction from previous to this node, at 6
var infty=16384; // infinity, or as close as we care to come
var GLength; // size of graph array

var start=null; // start and end points
var end=null;
var apcalc_enabled=0; // can now disable the calculator

// various borders
var plainborder=null; // we'll initialize this off an existing border later
var red='2px solid red';
var green='2px solid green';
var yellow='2px solid #ffffcc';

var engine=0;

function addtocost() {
    if(apcalc_enabled==0) {
        return;
    }
    GLength=graph.length;
    if(start!=null && end!=null) {
        unpath(graph,start.id,end.id);
    }
    if(!plainborder) {
        plainborder=this.style.border;
    }
    if(start==null) {
        start=this;
        this.style.border=green;
    } else if(end==null) {
        end=this;
        this.style.border=red;
    } else {
        start.style.border=plainborder;
        start=end;
        end=this;
        end.style.border=red;
        start.style.border=green;
    }
    if(start!=null && end!=null) {
        if(GLength > 500) {
            alert('Calculating route... this could take a few seconds\n(hit OK to start)');
        }
        Dijkstra(graph, start.id, end.id);
        var length=showpath(graph,start.id,end.id)-1;
        end.style.border=red;
        start.style.border=green;
        if(graph[end.id][distance]==0) {
            return true;
        }
        var output="APs: " + graph[end.id][distance] + " Tiles: " + length + " Approximate fuel: " + (length * fuel[engine]/1000);
        document.getElementById('apcalc_result').innerHTML=output;
        alert("Done calculating. See top of map.\n"+output);
    }
    return false;
}

function unpath(G,s,e) {
    unhighlight(e);
    if(e!=s) {
        unpath(G,s,G[e][previous]);
    }
}

function showpath(G,s,e) {
    var length=1;
    highlight(e,G[e][distance]);
    if(e!=s) {
        length+=showpath(G,s,G[e][previous]);
    }
    return length;
}

function highlight(id,x) {
    var t=document.getElementById(id);
    t.style.border=yellow;
    //document.getElementById(id).innerHTML=x;
    //document.getElementById(id).innerHTML=graph[id][direction];
}

function unhighlight(id) {
    var t=document.getElementById(id);
    t.style.border=plainborder;
}

function init_mcc() {
    var all=document.all?document.all : document.getElementsByTagName('td');
    for(var j=0;j<all.length;j++ ) {
        for(var i=0;i<ttypes.length;i++) {
            if(ttypes[i] == all[j].className) {
                all[j].onclick=addtocost;
            }
        }
    }
    if(getCookie('apcalc_enabled')=='y') {
        apcalc_enabled=1;
        document.getElementById('apcalc_enabled').checked=true;
    }
    var ds=document.getElementById('drivespeed');
    ds.selectedIndex=getCookie('drivespeed');
    newds();
}

function en_dis_ap_calc(me) {
    if(me.checked) {
        apcalc_enabled=1;
        setCookie('apcalc_enabled','y');
    }
    else {
        apcalc_enabled=0;
        setCookie('apcalc_enabled','n');
    }
}

function newds() {
    var ds=document.getElementById('drivespeed');
    drivespeed=ds.value;
    engine=ds.selectedIndex;
    setCookie('drivespeed',ds.selectedIndex);
}

function Dijkstra(G,s,e) {
    var i; // loop vars
    var j;
    var w; // "current" node
    var ret='';

    // initialise all distances to infinity, and all "previous" to null
    for(i=0; i<GLength; i++) {
        G[i][distance]=infty; 
        G[i][inpath]=false;
        G[i][previous]=null;
    }
    // distance of source is zero
    G[s][distance]=0;
    G[s][inpath]=false;
    G[s][direction]=calcdirection(G[e],G[s]);

    // for each vertex -- WHY? how does this run to completeness?
    // okay, it's for i=1 to n, where n is number of vertices
    for(j=0; j<GLength; j++) {
        // for each vertex G[i] which isn't in path, find the one with minimum distance to G[s]
        // add it to the path
        var min=infty+1;
        var minvert=0; // index of vertex with minimum distance
        for(i=0; i< GLength; i++) {
            if(!G[i][inpath] && G[i][distance]<min) {
                min=G[i][distance];
                minvert=i;
            }
        }
        if(w) {
            minvert=best(G,min,w,minvert);
        }
        w=G[minvert];
        w[inpath]=true;
        if(minvert==e) {// end if we found a path
            return;
        }

        // now, for each vertex not in the path, but connecting to w,
        // set its distance to w[distance] + hop cost (costi) or just leave it alone, whichever is smaller
        // also store where we came from. important!
        // also store the direction we came from
        for(i=0; i< w[paths].length; i++) {
            var c=w[paths][i][1]; // the vertex that w connects to
            var costi=mc[ w[paths][i][0] ] - drivespeed;
            var d=calcdirection(G[c],w);
            //if(d==1 || d==3 || d==7 || d==9) { 
            //    // make diagonal paths slightly more expensive
            //    // varamin's idea!!
            // but if we do, it breaks the total ap calculation. oh, well.
            //    costi+=1;
            //}
            var new_d=w[distance] + costi;
            if(new_d<G[c][distance] && !G[c][inpath]) {
                G[c][distance]=new_d;
                G[c][previous]=minvert;
                G[c][direction]=d;
            }
        }
    } // for each vertex -- main loop

    return;

} // Dijkstra


function best(G,min,w,minvert) {
    // Dijkstra's is fine, but our graph is such that often there are multiple nodes with minimum distance to G[s].
    // Due to our data structure, it prefers paths that jump to the up and left.
    // This leads to paths which are shortest but also crookeder than they have to be.
    // So now we find the node which has the minimum distance *and* keeps the same direction as how we got to w.
    var mindirdiff=100;
    var prev;
    for (var i=0; i< GLength; i++) {
        prev=G[i][previous];
        if(prev && !G[i][inpath] && G[i][distance]==min) {
            var dd=dirdiff(G[i][direction], G[prev][direction]);
            if(dd==0) { return i; }
            if(dd < mindirdiff) {
                mindirdiff=dd;
                minvert=i;
            }
        }
    }
    return minvert;
} // best

function dirdiff(n1, n2) {
    if(n2==n1) {
        return 0;
    }
    if(n2==1) {
        if(n1==2 || n1==4) { return 1; }
        if(n1==3 || n1==7) { return 2; }
        if(n1==6 || n1==8) { return 3; }
    }
    if(n2==2) {
        if(n1==1 || n1==3) { return 1; }
        if(n1==4 || n1==6) { return 2; }
        if(n1==7 || n1==9) { return 3; }
    }
    if(n2==3) {
        if(n1==2 || n1==6) { return 1; }
        if(n1==1 || n1==9) { return 2; }
        if(n1==4 || n1==8) { return 3; }
    }
    if(n2==4) {
        if(n1==1 || n1==7) { return 1; }
        if(n1==2 || n1==8) { return 2; }
        if(n1==3 || n1==9) { return 3; }
    }
    if(n2==6) {
        if(n1==3 || n1==9) { return 1; }
        if(n1==2 || n1==8) { return 2; }
        if(n1==1 || n1==7) { return 3; }
    }
    if(n2==7) {
        if(n1==4 || n1==8) { return 1; }
        if(n1==1 || n1==9) { return 2; }
        if(n1==2 || n1==6) { return 3; }
    }
    if(n2==8) {
        if(n1==7 || n1==9) { return 1; }
        if(n1==4 || n1==6) { return 2; }
        if(n1==1 || n1==3) { return 3; }
    }
    if(n2==9) {
        if(n1==8 || n1==6) { return 1; }
        if(n1==7 || n1==3) { return 2; }
        if(n1==4 || n1==2) { return 3; }
    }
    return 4;
}

function calcdirection(n1,n2) {
    if(n1[x]<n2[x]) {
        if(n1[y]<n2[y]) {
            return 1;
        }
        if(n1[y]==n2[y]) {
            return 4;
        }
        if(n1[y]>n2[y]) {
            return 7;
        }
    }
    if(n1[x]>n2[x]) {
        if(n1[y]<n2[y]) {
            return 3;
        }
        if(n1[y]==n2[y]) {
            return 6;
        }
        if(n1[y]>n2[y]) {
            return 9;
        }
    }
    if(n1[x]==n2[x]) {
        if(n1[y]<n2[y]) {
            return 2;
        }
        if(n1[y]>n2[y]) {
            return 8;
        }
    }
    return 0;
}

