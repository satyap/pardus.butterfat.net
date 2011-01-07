<!-- vim:set filetype=html: -->
<html>
<head>
<title>Pardus Automapper sector map <!-- tmpl_var name=name --></title>
<link type="text/css" rel="stylesheet" href="../../style.css" />
<script type="text/javascript">
    var graph=new Array(<!-- tmpl_var name=js -->);
    </script>
    <script src="../../cookies.js"></script>
    <script src="../../mcc.js"></script>
</head>
<body>
    <h1><!-- tmpl_var name=realname --></h1>
    <!-- tmpl_include name=header.pl -->
    (For AP calculator: Select drive speed, click on a tile, click on another tile)
    <div>
        <form>
<select id="drivespeed" name="ds" onchange="newds()">
    <option value="1">Nuclear</option>
    <option value="2">Fusion</option>
    <option value="2">Enh. Fusion</option>
    <option value="3">Ion</option>
    <option value="4">Anti-matter</option>
    <option value="4">Enh. Anti-matter</option>
    <option value="5">Hyper</option>
    <option value="6">Interphased</option>
    <option value="6">Enh. Interphased</option>
</select>
            <input type="checkbox" id="apcalc_enabled" name="apcalc_enabled" onchange="en_dis_ap_calc(this)"><label for="apcalc_enabled">Enable AP calculator</label>
        </form>
    </div>
    <div id="apcalc_result"></div>

    <table border="0" id="map" cellspacing="0" cellpadding="0">
        <!-- tmpl_var name=table -->
    </table>

    <p>
    (last generation: <!-- tmpl_var name=ts -->)
    </p>

    <!-- p>
    <a href="<!-- tmpl_var name=name -->.png">Download image</a> (last update: <!-- tmpl_var name=image_ts -->)
    </p -->
    <ul>
        <!-- TMPL_LOOP NAME=wormholes -->
        <li>
        Wormhole at <!-- tmpl_var name=x -->, <!-- tmpl_var name=y --> jumps to 
        <a href="<!-- tmpl_var name=jump -->.html"><!-- tmpl_var name=jump --></a>
        </li>
        <!-- /TMPL_LOOP -->
    </ul>
    <script type="text/javascript">
        init_mcc();
    </script>
</body>
        </html>
