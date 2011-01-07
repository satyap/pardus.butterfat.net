#!/usr/bin/perl
use strict;
use warnings;

use DBI;
require 'dbconfig.pl';
require 'tables.pl';

our $dbh;
$/=1;

my $sth;
$sth->{'gettiles'}=$dbh->prepare('SELECT * FROM `tiles` WHERE `sector_id`=?');
$sth->{'whs'}=$dbh->prepare('SELECT * FROM `tiles` WHERE `sector_id`=? AND wormhole is not null AND wormhole != ""');
$sth->{'sectors'}=$dbh->prepare('SELECT * FROM `sectors` ORDER BY `name`');
$sth->{'getmax'} = $dbh->prepare(
    "SELECT 
    MIN(x) as minx, MIN(y) as miny,
    MAX(x) as maxx, MAX(y) as maxy
    FROM `tiles` 
    WHERE `sector_id`=?"
);
$sth->{'sectors'}->execute;
my @sectors;

while(my $r = $sth->{'sectors'}->fetchrow_hashref) {
    calcwhs($r, $sth);
}

END {
    $dbh->disconnect if $dbh;
}

sub calcwhs() {
    my $sector=shift;
    my $sth=shift;

    $sth->{'whs'}->execute($sector->{'id'});
    my $whs=[];
    while(my $r=$sth->{'whs'}->fetchrow_hashref()) {
        push @$whs, $r;
    }
    print "$sector->{'name'}: $#$whs\n";

    # calculate the jump from each wh to each wh, and store:
    # wh src and dest
    # this sector's id
    # cost
    return if $#$whs<0;

    my $graph=getgraph($sector, $sth);

    for(my $i=0;$i<=$#$whs;$i++) {
        for(my $j=0;$j<=$#$whs;$j++) {
            next if $i==$j;
        }
    }

} # calcwhs

sub getgraph() {
    my $sector=shift;
    my $sth=shift;

    $sth->{'getmax'}->execute($sector->{'id'});
    my ($maxx, $maxy, $minx, $miny)=(0,0,0,0);
    while(my $r=$sth->{'getmax'}->fetchrow_hashref) {
        $maxx=$r->{'maxx'};
        $maxy=$r->{'maxy'};
        $minx=$r->{'minx'};
        $miny=$r->{'miny'};
    }
    if($minx<0) {$minx=0;}
    if($miny<0) {$miny=0;}

    $sth->{'gettiles'}->execute($sector->{'id'});

    my @tiles;
    while(my $tile = $sth->{'gettiles'}->fetchrow_hashref) {
        push(@tiles, $tile);
    }

    my $table;


    foreach my $tile(@tiles) {
        my $x=$tile->{'x'};
        my $y=$tile->{'y'};
        my $xpaint=$x-$minx;
        my $ypaint=$y-$miny;
        next if $x<0 || $y<0;
        $table->[$ypaint][$xpaint]=&table_content($tile, $sth, $x, $y, $sector->{'id'});
    }

    my @js;
    my $graphindex=0;

    for(my $rownum=$miny; $rownum<= $maxy; $rownum++) {
        my $y=$rownum-$miny;
        my $tr = $table->[$y];
        for(my $i=$minx; $i<= $maxx; $i++) {
            my $x=$i-$minx;
            if($tr) {
                my $td = $tr->[$x];
                if($td) {
                    unless($td->{'bgcolor'}=~/emax/) {
                        $td->{'graphindex'}=$graphindex++;
                    }
                    next;
                }
            } # non-blank row
        }
    }

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

} # getgraph

sub getjs() {
} # getjs

sub table_content() {
    my $tile=shift;
    my $sth=shift;
    my $x=shift;
    my $y=shift;
    my $id=shift;

    my $ret_html;
    my $ret_data;
    my $cell;

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
    $ret_html->{'bgcolor'}=$bgcolor;
    return $ret_html;

} # table_content
