function setCookie(n,v) {
    var d=new Date();
    d=new Date(d.getTime() + (34*86400*1000));
    document.cookie=n + '=' + v + '; expires=' + d.toGMTString() ;
}
function getCookie(n) {
    var c=document.cookie;
    var offset=c.indexOf(n+"=");
    if(offset<0) {
        return 0;
    }
    offset=c.indexOf('=',offset)+1;
    return c.substr(offset,1);
}

