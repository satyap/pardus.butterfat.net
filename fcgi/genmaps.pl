#!/usr/bin/perl

use strict;
use warnings;
use DBI;
use Image::Magick;
use Data::Dumper;
use HTML::Template;
require 'dbconfig.pl';
require 'tables.pl';



my $images='/home/satyap/pardus/images/';
my $outbase='/home/satyap/web/pardusmapper/maps/';
my $depth=24; # color depth
my $maxtiles=1600;

sub make_image($$$);
sub make_maps($$$$);
sub make_tile($$);
sub put_number(%);
sub paste_tile(%);
    
my $drawbg={};
our %fill;
our %universes;
our %runiverses;

my $argv=$ARGV[0] || '';
my $regenimages=($argv eq 'regenimages')?1:0;
my $regenall=($argv eq 'regenall')?1:0;
my $regenid;
my $regenname;
$regenid=$argv if $argv=~/^\d+$/;
$regenname=$argv if (!$regenimages && !$regenall && $argv=~/[a-zA-Z]/);


our $dbh;

my $sth;
my $sqlnewsectors="SELECT DISTINCT sectors.id, `sectors`.`ts` AS ts,`sectors`.`name`, `sectors`.`realname`, `sectors`.`cluster_id`
FROM tiles,sectors WHERE `tiles`.sector_id=`sectors`.id";
# if we're not regenerating images, and we're not regenerating all maps,
# if any tile was updated in the last 1 hours
# i.e. tile's timestamp is greater than a point 1 hours in the past
# AND sector was NOT updated in the last hour
# i.e. sector's timestamp is less than a point 1 hour in the past
if(!$regenall && !$regenimages && !$regenid && !$regenname) {
    $sqlnewsectors.="  AND `tiles`.`ts` > DATE_SUB(NOW(), INTERVAL 19 MINUTE)";
}
if($regenid) {
    $sqlnewsectors.=" AND `tiles`.`sector_id`=?";
}
if($regenname) {
    $sqlnewsectors.=" AND `sectors`.`name`=?";
}

$sth->{'getnewsectors'} = $dbh->prepare($sqlnewsectors);
$sth->{'updatesector'}=$dbh->prepare('UPDATE `sectors` SET `ts`=NOW() WHERE id=?');
$sth->{'gettiles'}=$dbh->prepare('SELECT * FROM `tiles` WHERE `sector_id`=?');
$sth->{'getsbnames'} = $dbh->prepare('SELECT * FROM `starbases` WHERE `sector_id`=? and x=? and y=?');
$sth->{'getmax'} = $dbh->prepare(
        "SELECT 
        MIN(x) as minx, MIN(y) as miny,
        MAX(x) as maxx, MAX(y) as maxy
        FROM `tiles` 
        WHERE `sector_id`=?"
    );
$sth->{'getallsectors'}=$dbh->prepare('SELECT `sectors`.*,clusters.cluster,`clusters`.`universe_id` FROM `sectors`,`clusters` WHERE `clusters`.`universe_id`=? AND `sectors`.`cluster_id`=`clusters`.`id` ORDER BY `cluster`,`name`');

$sth->{'getcluster'}=$dbh->prepare('SELECT `universe_id` FROM `clusters` WHERE `id`=?');
my %cluster_uni_map;


if($regenid) {
    $sth->{'getnewsectors'}->execute($regenid);
} elsif($regenname) {
    $sth->{'getnewsectors'}->execute($regenname);
} else {
    $sth->{'getnewsectors'}->execute;
}

my $tilecache;
my $coordcache;
my $init=0; # backgrounds and templates not initialised -- we only do that if we have sectors to draw

my $tmpl;

while(my $r=$sth->{'getnewsectors'}->fetchrow_hashref) {
    unless($init==1) {
        $tmpl=HTML::Template->new(filename => 'sectordetail.pl');
        if($regenimages) {
            foreach(keys %fill) {
                $drawbg->{$_}=Image::Magick->new(size=>'32x32');
                $drawbg->{$_}->ReadImage('xc:transparent');
                $drawbg->{$_}->Draw(fill => $fill{$_}, stroke => "none",primitive => 'rectangle', points => '0,0 31,31');
                
            }
        }
        $init=1;
    }
    my $uni=$cluster_uni_map{$r->{'cluster_id'}};
    unless($uni) {
        $sth->{'getcluster'}->execute($r->{'cluster_id'});
        while(my $c = $sth->{'getcluster'}->fetchrow_hashref) {
            $uni = $c->{'universe_id'};
            $cluster_uni_map{$r->{'cluster_id'}} = $uni;
        }
    }
    unless ($uni) {
        print "Universe not found for ". $r->{'cluster_id'} . " 's sector " . $r->{'id'} ."$r->{'name'}\n";
        next;
    }
    my $out=$outbase . $runiverses{$uni};
    my $name=$r->{'name'};
    my ($table,$js) = make_maps($r->{'id'}, $name, $sth, $out);
    $tmpl->clear_params;
    $tmpl->param(name => $name, 
        realname => $r->{'realname'},
        table => $table,
        ts => scalar(localtime), 
        image_ts => $r->{'ts'},
        js=>$js,
    );
    open(O, ">${out}/$name.html");
    print O $tmpl->output;
    close(O);
}


foreach my $uni (keys %universes) {
    $sth->{'getallsectors'}->execute($universes{$uni});
    my @sectors;
    my $newcluster=1;
    my $oldcluster='';
    while(my $r=$sth->{'getallsectors'}->fetchrow_hashref) {
        my $name=$r->{'name'};
        my $cluster=$r->{'cluster'} || '?';
        next if $cluster eq 'Starbase';
        if($oldcluster ne $cluster) {
            $newcluster=1;
            $oldcluster=$cluster;
        }
        #print "$cluster, $name\n";
        push(@sectors, {name=>$name, 
                ts => $r->{'ts'},
                cluster=>$cluster,
                newcluster=>$newcluster, 
                id=>$r->{'id'},
                realname => $r->{'realname'},
            });
        $newcluster=0;
    }
    my $out=$outbase . $uni . '/';
    $tmpl=HTML::Template->new(filename => 'sectors.pl');
    open(O, ">${out}sectors.html");
    $tmpl->param(sectors => \@sectors);
    print O $tmpl->output;
    close(O);
}

my $tiles=scalar(keys %$tilecache);
print "$tiles unique tiles!\n" if $tiles>0;

$dbh->disconnect;


sub make_maps($$$$) {
    my $id=shift;
    my $name=shift;
    my $sth=shift;
    my $out=shift;
    print "$id $name\n";
    my $tilecount=0;
    my $nodata=0;
    
    my ($maxx, $maxy, $minx, $miny)=(0,0,0,0);
    $sth->{'getmax'}->execute($id);

    while(my $r=$sth->{'getmax'}->fetchrow_hashref) {
        $maxx=$r->{'maxx'};
        $maxy=$r->{'maxy'};
        $minx=$r->{'minx'};
        $miny=$r->{'miny'};
    }
    if($minx<0) {$minx=0;}
    if($miny<0) {$miny=0;}

    $sth->{'gettiles'}->execute($id);
    my $table;
    my $imgdata;
    my $img;
    my @tiles;

    while(my $tile = $sth->{'gettiles'}->fetchrow_hashref) {
        push(@tiles, $tile);
    }

    foreach my $tile(@tiles) {
        #my $x=$maxx-$tile->{'y'};
        my $x=$tile->{'x'};
        my $y=$tile->{'y'};
        my $xpaint=$x-$minx;
        my $ypaint=$y-$miny;
        next if $x<0 || $y<0;
        ($table->[$ypaint][$xpaint], $imgdata->[$ypaint][$xpaint])=&table_content($tile, $sth, $x, $y, $id, $out);
    }
    
    my $numtiles = ($maxx-$minx+1)*($maxy-$miny+1);
    my $doimage=$regenimages && $numtiles<=$maxtiles;
    
    if($doimage) {
        my $size=($maxx-$minx+1)*32 . 'x' . ($maxy-$miny+1)*32;
        $img = Image::Magick->new(size => $size, depth => $depth);
        if (!ref($img)) {
            warn $img;
            return;
        }
        $img->ReadImage('xc:transparent');
        $sth->{'updatesector'}->execute($id);
    }

    my $xaxis='<tr><td class="xy">&nbsp;</td>'; # left blank square
    for(my $i=$minx; $i<=$maxx; $i++) {
        $xaxis.='<td class="xy">' . $i . '</td>';
    }
    $xaxis.='<td class="xy">&nbsp;</td></tr>'; # right blank square
    
    my $ret=$xaxis;

    # print header row on image
    if($doimage) {
        for(my $i=$minx; $i<=$maxx; $i++) {
            put_number({img => $img, x=>($i-$minx)*32+32, y=>0, i => $i});
        }
    }

    my @js;
    my $graphindex=0;
    my $rowcount=0;

    for(my $rownum=$miny; $rownum<= $maxy; $rownum++) {
        $rowcount++;
        if($rowcount>40 && $maxy-$rownum>20) { # add more coord axes for easy visibility, but not if we're close to the bottom
            $rowcount=0;
            $ret.=$xaxis;
        }
        $ret.="<tr>\n". '<td class="xy">' . $rownum . '</td>';
        my $y=$rownum-$miny;
        my $ycoord=$y*32+32;
        if($doimage) {
            put_number({img => $img, x=>0, y=>$ycoord, i => $rownum});
        }
        my $tr = $table->[$y];
        for(my $i=$minx; $i<= $maxx; $i++) {
            my $x=$i-$minx;
            if($tr) {
                my $td = $tr->[$x];
                my $tileimg = $imgdata->[$y][$x];
                if($doimage) {
                    $tileimg={fg => 'backgrounds/nodata.png'} unless $tileimg;
                    paste_tile({img => $img, x=>$x*32+32, y => $ycoord, tiledata => $tileimg}, $out);
                }
                if($td) {
                    $tilecount++;
                    my $id='';
                    unless($td->{'bgcolor'}=~/emax/) {
                        $id=$graphindex;
                        $td->{'graphindex'}=$graphindex++;
                    }
                    $ret.='<td ';
                    $ret.=('id="' . $id . '" ') if $id;
                    $ret.='class="' . $td->{'bgcolor'} . '">';
                    $ret.= $td->{'cell'} . '</td>';
                    next;
                }
            } # non-blank row
            $nodata++;
            #$ret.='<td class="nod"><img src="../tiles/backgrounds/nodata.png"/></td>';
            $ret.='<td class="nod"></td>';
        }
        $ret.= '<td class="xy">' . "$rownum</td></tr>\n";
    }
    
    # print footer row
    $ret.=$xaxis;

    # an extra row of nulls, so the HTML table is the correct width
    $ret.='<tr><td class="xy">&nbsp;</td>'; # left blank square
    for(my $i=$minx; $i<=$maxx; $i++) {
        $ret.='<td class="xy nod"><img src="../tiles/backgrounds/nodata.png"/></td>';
    }
    $ret.='<td class="xy">&nbsp;</td></tr>'; # right blank square

    # just for the js, a separate loop because graphindex is needed
    for(my $rownum=$miny; $rownum<= $maxy; $rownum++) {
        my $y=$rownum-$miny;
        my $tr = $table->[$y];
        for(my $i=$minx; $i<= $maxx; $i++) {
            my $x=$i-$minx;
            if($tr) {
                my $td = $tr->[$x];
                if($td && $td->{'bgcolor'}!~/max/) {
                    my $js=getjs($x,$y,$table);
                    if($js) {
                        push(@js,$js);
                    }
                }
            }
        }
    }
    my $js=join(',',@js);

    if($doimage) {
        drawgrid($img, $maxx,$maxy,$minx,$miny);
        $img->Write($out .'/'. $name . ".png");
    }
    
    #print "$numtiles squares, $tilecount populated, $nodata 'nodata'\n";

    return $ret, $js;

} # make_maps

sub getjs() {
    my $x=shift;
    my $y=shift;
    my $table=shift;
    my @connections;
    # var ttypes=new Array('spa','neb','ast', 'energy','em','vir', 'sb');
    our $costs;
   
    my $td=$table->[$y]->[$x];
    return '' if $td->{'bgcolor'} eq 'emax';
    my $cost=$costs->{ $td->{'bgcolor'}  };

    my $tr;
    my $ty=$y+1;
    
    $tr=$table->[$y];
    if(exists $tr->[$x+1] && $tr->[$x+1]->{'bgcolor'} ne 'emax') {
        push(@connections, '['. $cost .','. $tr->[$x+1]->{'graphindex'} .']');
    }
    if(exists $tr->[$x-1] && $tr->[$x-1]->{'bgcolor'} ne 'emax' && $x-1>=0) {
        push(@connections, '['. $cost .','. $tr->[$x-1]->{'graphindex'} .']');
    }
    
    if(exists $table->[$ty]) {
        $tr=$table->[$ty];
        if(exists $tr->[$x] && $tr->[$x]->{'bgcolor'} ne 'emax') {
            push(@connections, '['. $cost .','. $tr->[$x  ]->{'graphindex'} .']');
        }
        if(exists $tr->[$x+1] && $tr->[$x+1]->{'bgcolor'} ne 'emax') {
            push(@connections, '['. $cost .','. $tr->[$x+1]->{'graphindex'} .']');
        }
        if(exists $tr->[$x-1] && $tr->[$x-1]->{'bgcolor'} ne 'emax' && $x-1>=0) {
            push(@connections, '['. $cost .','. $tr->[$x-1]->{'graphindex'} .']');
        }
    }

    $ty=$y-1;
    if(exists $table->[$ty] && $ty>=0) {
        $tr=$table->[$ty];
        if(exists $tr->[$x] && $tr->[$x]->{'bgcolor'} ne 'emax') {
            push(@connections, '['. $cost .','. $tr->[$x  ]->{'graphindex'}  .']');
        }
        if(exists $tr->[$x+1] && $tr->[$x+1]->{'bgcolor'} ne 'emax') {
            push(@connections, '['. $cost .','. $tr->[$x+1]->{'graphindex'}  .']');
        }
        if(exists $tr->[$x-1] && $tr->[$x-1]->{'bgcolor'} ne 'emax' && $x-1>=0) {
            push(@connections, '['. $cost .','. $tr->[$x-1]->{'graphindex'}  .']');
        }
    }
    
    my $conn=join(',', @connections);
    my $numconn=$#connections+1;
    my $js="[[$conn],$x,$y]";

    return $js;

} # getjs

sub table_content() {
    my $tile=shift;
    my $sth=shift;
    my $x=shift;
    my $y=shift;
    my $id=shift;
    my $out=shift;
    my $ret_html;
    my $ret_data;
    my $cell;
    our %tile2name;

    my $fg;

    if($tile->{'foreground'}) {
        $fg=$tile->{'foreground'};
        #my $tilepath=$out . 'tiles/' . $fg;
        if(!$tilecache->{$fg}) {
            $fg=make_tile($fg, $out);
        }
    }
    if($fg) {
        $ret_data->{'fg'} = $fg;
        my $ts = "\n".$tile->{'ts'};
        my $href='';
        $cell='<img src="../tiles/' . $fg . '" class="x32" ';#'" width="32" height="32" ';
        if($tile->{'wormhole'} && $tile->{'wormhole'} ne 'HOLENOTOPENYET') {
            $href='<a href="' . $tile->{'wormhole'} . '.html">';
            my $popup=$tile->{'wormhole'}." ".$ts;
            $cell.='alt="Jump to ' . $popup . '" title="'. $popup .'" /></a>';
        }
        elsif($tile->{'foreground'}=~/(?:planet|starbase)/o) {
            $sth->{'getsbnames'}->execute($id, $x, $y);
            while(my $r = $sth->{'getsbnames'}->fetchrow_hashref) {
                my $popup=$r->{'name'}." ".$ts;
                $cell.='alt="' . $popup . '" title="' . $popup . '" />';
            }
        }
        else {
            my $name=$tile->{'foreground'};
            $name=$tile2name{$name} if exists $tile2name{$name};
            $name .= " " .$ts;
            $cell.='alt="' . $name. '" title="'. $name .'" />';
        }
        $cell=$href.$cell;
    }
    else {
        $cell='.';
    }

    my $bg=$tile->{'background'};
    my $bgcolor;
    
    if($bg =~ /max/) {
        $bgcolor='emax';
    }
    elsif($bg =~ /energy/) {
        $bgcolor='energy';
    }
    elsif($bg =~ /neb/) {
        $bgcolor='neb';
    }
    elsif($bg =~ /spa/) {
        $bgcolor='spa';
    }
    elsif($bg =~ /ast/) {
        $bgcolor='ast';
    }
    elsif($bg =~ /vir/) {
        $bgcolor='vir';
    }
    elsif($bg =~ /ematter/) {
        $bgcolor='em';
    }
    elsif($bg =~ /\/sb_/) {
        $bgcolor='sb';
    }
    else {
        print "I don't understand background=$bg\n";
    }
    $ret_html->{'cell'}=$cell;
    $ret_html->{'bgcolor'}=$bgcolor;
    $ret_data->{'bgcolor'}=$bgcolor;
    return $ret_html, $ret_data;

} # table_content


sub make_tile($$) {
    my $fg=shift;
    my $out=shift;
    my $inputimg=$fg;
    $fg=~s/gif$/png/;
    return '' if substr($fg,0,4) eq 'http' or $fg=~/\.\./ or substr($fg,0,1) eq '/';
    return if $fg!~/^(opponents|foregrounds|squadrons|backgrounds)/;
    my $tilepath=$out . '/../tiles/' . $fg;
    return if $fg=~/^ships/;
    $tilecache->{$fg}=Image::Magick->new(depth => $depth);
    if(-e $tilepath) { # minified image exists on disk
        if($regenimages) {
            $tilecache->{$fg}->Read($tilepath) 
        }
        else {
            $tilecache->{$fg}=1;
        }
        # only read a minified image if we're making PNGs, else just note the
        # fact it exists.
    }
    else {
        my $res=$tilecache->{$fg}->Read($images . $inputimg);
        if ("$res") {
            warn "$fg: " .$res;
            return;
        } else {
            #$tilecache->{$fg}->Resample(geometry => '32x32');
            $tilepath=~s/gif$/png/;
            $res=$tilecache->{$fg}->Write($tilepath);
            if("$res") { warn "$fg: ". $res }
        }
    }
    return $fg;
} # make_tile

sub put_number(%) {
    my $args=shift;
    my $x=$args->{'x'};
    my $y=$args->{'y'};
    my $i=$args->{'i'};
    my $img=$args->{'img'};
    my %annotation = ( font=>'Helvetica',
        pointsize=>16,
        stroke => '#000',
        #fill => '#fff',
        strokewidth=>0,
        x => 16, y => 16,
        align=>'Center',
        antialias => 1,
    );
    unless(exists $coordcache->{$i}) {
        $coordcache->{$i}=Image::Magick->new(size => '32x32',depth => $depth);
        $coordcache->{$i}->Read('xc:#dddddd');
#        $coordcache->{$i}->Raise(width => 2, height => 2, raise => 1);
        $coordcache->{$i}->Annotate( %annotation, text => $i);
    }
    my $msg=$img->Composite(compose=> 'Over', image=> $coordcache->{$i}, x=>$x, y=>$y);
    if("$msg") {
        warn "$x,$y $msg\n";
    }
} # put_number

sub paste_tile(%) {
    my $args=shift;
    my $out=shift;
    my $img=$args->{'img'};
    my $x=$args->{'x'};
    my $y=$args->{'y'};
    my $tiledata=$args->{'tiledata'};
    my $msg='';
    $msg=$img->Composite(compose => 'Over', x=>$x, y=>$y, image => $drawbg->{ $tiledata->{'bgcolor'} }) if $tiledata->{'bgcolor'};
    if("$msg") {
        warn "$msg\n";
    }
    if($tiledata->{'fg'}) {
        $tiledata->{'fg'}=make_tile($tiledata->{'fg'}, $out);
        my $msg=$img->Composite(compose => 'Over', x=>$x, y=>$y, image => $tilecache->{ $tiledata->{'fg'} });
        if("$msg") {
            warn "$msg\n";
        }
    }
} # paste_tile

sub drawgrid($$$$$) {
    my ($img, $maxx,$maxy,$minx,$miny)=@_;
    my $xtent=$maxx-$minx;
    my $ytent=$maxy-$miny;
    my %drawopts=(
        primitive => 'line', strokewidth =>0, stroke => '#999999'
    );
    for(my ($i,$y)=(0, ($ytent+1)*32 ) ; $i<= $xtent; $i++) {
        my $x=$i*32;
        $img->Draw(%drawopts, points => "$x,0 $x,$y");
    }
    for(my ($i,$x)=(0, ($xtent+1)*32 ) ; $i<= $ytent; $i++) {
        my $y=$i*32;
        $img->Draw(%drawopts, points => "0,$y $x,$y");
    }
} # drawgrid
