#!/usr/bin/perl

use strict;
use warnings;
use DBI;
use HTML::Template;
require 'dbconfig.pl';
require 'tables.pl';

my $out='/home/satyap/web/pardusmapper/maps/';

our $dbh;
our %universes;
my $sth;
my $uni=$ARGV[0] || die "Want one of " . join(' ',keys(%universes));
die "One of " . join(' ',keys(%universes)) unless exists($universes{$uni}) ;
$out .= $uni .'/';

my $maxmin={'xx'=>0, 'xy'=>0,'nx'=>0,'ny' =>0};
$sth=$dbh->prepare('SELECT MAX(x) AS xx,MAX(y) AS xy,MIN(x) AS nx,MIN(y) AS ny FROM `sectors` WHERE x>0 AND x IS NOT NULL');
$sth->execute;
while(my $r=$sth->fetchrow_hashref) {
    $maxmin->{$_}=$r->{$_} foreach keys %$maxmin;
}

my %homeworlds;
my @clusterlist;
$sth=$dbh->prepare('SELECT * FROM `clusters` WHERE `universe_id`=? AND `homeworld` IS NOT NULL ORDER BY `cluster`');
$sth->execute($universes{$uni});
my %sectorlist=();
while(my $r=$sth->fetchrow_hashref) {
    my $n=$r->{'homeworld'};
    $n=~s/[^a-zA-Z0-9]//g;
    $r->{'anchor'}=$n;
    push @clusterlist, {anchor => $n, cluster => $r->{'cluster'}, id => $r->{'id'}};
    $homeworlds{$n} = 1;
}


my $sthwh=$dbh->prepare('SELECT * FROM `tiles` WHERE `sector_id`=? AND foreground LIKE "%wormhole%"');
my $sthcluster = $dbh->prepare('SELECT * FROM `clusters` WHERE id=? AND `universe_id`=?');

$sth=$dbh->prepare("SELECT * FROM `sectors` WHERE x IS NOT NULL AND y IS NOT NULL AND x>0 AND y>0");
$sth->execute();
my %sectors;
my %colorclass;

my @colors;
my %colormap;

my $table=[];
my $ckey=1;
while(my $r=$sth->fetchrow_hashref) {
    next unless $r->{'x'} && $r->{'y'};
    $sectorlist{$r->{'cluster_id'}}=[] unless exists $sectorlist{$r->{'cluster_id'}};
    #$r->{'homeworld'}=$sectorlist{$r->{'cluster_id'}}->{'anchor'};
    push @{ $sectorlist{$r->{'cluster_id'}} }, $r;
    $sthcluster->execute($r->{'cluster_id'}, $universes{$uni});
    my $wantsector;
    while(my $c=$sthcluster->fetchrow_hashref) {
        my $bgcolor=$c->{'bgcolor'} || 'ccccff';
        unless(exists $colormap{$bgcolor}) {
            $colormap{$bgcolor}=$ckey++;
        }
        $table->[$r->{'x'}][$r->{'y'}]->{'bgcolor'} = $colormap{$bgcolor};
        $colorclass{$bgcolor}->{fg} = $c->{'color'} || 'cccccc';
        $colorclass{$bgcolor}->{key} = $colormap{$bgcolor};
        $wantsector=1;
    }
    next unless $wantsector;
    $table->[$r->{'x'}][$r->{'y'}]->{'name'} = $r->{'name'};
    $table->[$r->{'x'}][$r->{'y'}]->{'realname'} = $r->{'realname'};
    $sectors{$r->{'name'}}->{'x'}=$r->{'x'};
    $sectors{$r->{'name'}}->{'y'}=$r->{'y'};
    my @wh;
    $sthwh->execute($r->{'id'});
    while(my $wh = $sthwh->fetchrow_hashref) {
        push(@wh, $wh->{'wormhole'}) if $wh->{'wormhole'};
    }
    $sectors{$r->{'name'}}->{'wormholes'}=\@wh;
}

my $toprow='<tr><td>&nbsp;</td>';
for(my $x=$maxmin->{'nx'};$x <= $maxmin->{'xx'};$x++) {
    $toprow.='<td class="xy">' . $x . '</td>';
}
$toprow.='</tr>';
my $html=$toprow;

for(my $y=$maxmin->{'ny'};$y <= $maxmin->{'xy'};$y++) {
    $html.='<tr><td class="xy">' . $y . '</td>';
    for(my $x=$maxmin->{'nx'};$x <= $maxmin->{'xx'};$x++) {
        $html.='<td';
        if($table->[$x] && $table->[$x][$y]) {
            my $cell = $table->[$x][$y];
            my $whbmp=&getwhdir($sectors{$cell->{'name'}});
            $html.=' class="';
            $html.='c' . $cell->{'bgcolor'};
            #$html.=  $cell->{'bgcolor'};
            $html.= '"><table><tr>';
            for(my $i=0;$i<3;$i++) {
                $html.= '<td>' .  ($whbmp->[$i] || '') . '</td>';
            }
            $html.= '</tr><tr><td>' .  ($whbmp->[3] || '') . '</td><td>';
            #if(exists $homeworlds{$cell->{'name'}}) {
                $html .= '<a class="r" name="' . $cell->{'name'}. '"></a>';
                #}
            $html.='<a href="' . $cell->{'name'} . '.html"';
            $html.= '>' . $cell->{'realname'} .'</a></td>';
            $html.= '<td>' .  ($whbmp->[5] || '') . '</td></tr><tr>';
            for(my $i=6;$i<9;$i++) {
                $html.= '<td>' .  ($whbmp->[$i] || '') . '</td>';
            }
            $html.='</tr></table></td>';
        }
        else {
            $html.='>.';
        }
        $html.="</td>";
    }
    $html.='<td class="xy">' . $y . '</td>';
    $html.="</tr>\n";
}
$html .= $toprow;

foreach (keys %colorclass) {
    push(@colors, {bgcolor => $_, color => $colorclass{$_}->{fg},
        key => $colormap{$_}});
}

foreach my $c (@clusterlist) {
    $c->{'sectorlist'}=$sectorlist{$c->{'id'}};
}

my $tmpl=HTML::Template->new(filename=>'universe.tmpl',
    die_on_bad_params => 0,
);
$tmpl->param(tbl => $html, colors => \@colors, clusterlist => \@clusterlist);
my $output=$tmpl->output;
$output=~s/^\s+//gm;

open(O, ">${out}/universe.html") || die $!;
print O $output;
close(O);

sub getwhdir() {
    my $sec=shift;
    my $whbmp=[];
    my $x=$sec->{'x'};
    my $y=$sec->{'y'};
    foreach my $wh (@{ $sec->{'wormholes'} }) {
        next unless exists $sectors{$wh};
        my $whx= $sectors{$wh}->{'x'};
        my $why= $sectors{$wh}->{'y'};
        if($whx<$x) {
            if($why<$y) {$whbmp->[0]='\\'}
            elsif($why==$y) {$whbmp->[3]='-'}
            elsif($why>$y) {$whbmp->[6]='/'}
        }
        elsif($whx==$x) {
            if($why<$y) {$whbmp->[1]='|'}
            elsif($why>$y) {$whbmp->[7]='|'}
        }
        elsif($whx>$x) {
            if($why<$y) {$whbmp->[2]='/'}
            elsif($why==$y) {$whbmp->[5]='-'}
            elsif($why>$y) {$whbmp->[8]='\\'}
        }
    }
    return $whbmp;
}
