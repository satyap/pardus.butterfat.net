<!-- vim:set filetype=html: -->
<html>
    <head>
        <title>
            Pardus Automapper sector list
        </title>
        <link type="text/css" rel="stylesheet" href="../../style.css" />
        <body>
                <!-- tmpl_include name=header.pl -->

                    <p>
                    (The sectors are alphabetically arranged for now.)
                    </p>
                    <form method="post" action="../fcgi/getbscformat.pl">
                        <ul>
                            <!-- TMPL_LOOP NAME=sectors -->
                            <!-- tmpl_if name=newcluster -->
                            <li class="cluster"><!-- tmpl_var name=cluster --></li>
                            <!-- /tmpl_if name=newcluster -->
                            <li>
                            <label for="id_<!-- tmpl_var name=id -->">
                                <input type="checkbox" name="id" id="id_<!-- tmpl_var name=id -->" value="<!-- tmpl_var name=id -->" />
                                <!-- tmpl_var name=ts -->
                                |
                            <a href="<!-- tmpl_var name=name -->.html">
                                <!-- tmpl_var name=realname --></a> <!-- | 
                            <a href="../fcgi/getbscformat.pl?id=<!- tmpl_var name=id ->">XML</a> -->
                            </li>
                            <!-- /TMPL_LOOP -->
                        </ul>
                        <input type="submit" value="Get map_new.xml for checked maps" />
                    </form>
                </body>
            </html>
