#!/usr/bin/perl
use strict;
use warnings;
use CGI;
use CGI::Carp qw(fatalsToBrowser);
use DBI;
use HTML::Template;
use lib '../fcgi/';
require 'dbconfig.pl';
require 'tables.pl';

our $dbh;
our %universes;
our %runiverses;

sub production($);
sub output($);

#print "Content-type: text/plain\n\nok\n";
print "Content-type: text/html\n\n\n";

my $q=new CGI;

my $uni = $q->param('uni');
my $sector = $q->param('sector');
my $zero = $q->param('zero');

my $tmpl=HTML::Template->new(
    filename => 'tmpl.html',
    die_on_bad_params => 0,
);

my $sth = $dbh->prepare('SELECT distinct name,realname FROM sectors where x is not null order by name');
$sth->execute();
my @sectors;
while(my $r=$sth->fetchrow_hashref) {
    $r->{'checked'} = 'selected="selected"' if (defined($sector) and ($sector eq $r->{'name'}));
    push @sectors, $r;
}

my @universes;
foreach my $k (keys %universes) {
    push @universes, {name => $k, checked => (defined($uni) and ($uni eq $k)) ? 'checked="checked"' : '' };
}

$tmpl->param(universes => \@universes, sectors => \@sectors);

unless ($uni and $sector and exists($universes{$uni})) {
    output($tmpl->output);
}

my $sector_id;
my $sthsector=$dbh->prepare('SELECT id from `sectors` where `cluster_id` in (select id from `clusters` where `universe_id`=?) and `name`=?');

$sthsector->execute($universes{$uni}, $sector);
while(my $r=$sthsector->fetchrow_hashref) {
    $sector_id = $r->{'id'};
}

unless ($sector_id) {
    output($tmpl->output);
}

# delete buildings more than a day old
my $datesub = '(date_add(updated_at,interval 28 hour) < now())';
my $sthdel=$dbh->prepare("DELETE from buildings where $datesub");
$sthdel->execute;
$sthdel=$dbh->prepare("DELETE FROM comos where building_id not in (select id from buildings)");
$sthdel->execute;
$sthdel=$dbh->prepare("DELETE FROM buildings where id not in (select distinct building_id from comos)");
$sthdel->execute;

my @comos;
my $sthbldg = $dbh->prepare('SELECT * from buildings left join comos on comos.building_id=buildings.id where sector_id=? ORDER BY ctype,buildings.x,buildings.y');
$sthbldg->execute($sector_id);
my %needs;
my %available;
while(my $r=$sthbldg->fetchrow_hashref) {
    next if $r->{'name'}=~/Trading Outpost/;
    my $d;
    my $max=$r->{'max'};
    if(production($r)!=0) {
        $d = $r->{'amount'} -$r->{'min'};
        $r->{'available'} = $d;
        $r->{'class'}='g' if $d > 0;
        $r->{'percent'}=$r->{'amount'}/$max if $max > 0;
        next if(!$zero && $d==0);
        $available{$r->{'ctype'}}=0 if not exists $available{$r->{'ctype'}};
        $available{$r->{'ctype'}} += $d;
    }
    else {
        # consumed
        $d = $max - $r->{'amount'};
        $d = $d > $r->{'free'} ? 0 : $d;
        $r->{'wanted'}=$d;
        $r->{'class'}='y' if ($d > 1);
        $r->{'class'}='r' if ($d > (0.8 * $r->{'max'}));
        $r->{'percent'}=$r->{'amount'}/$max if $max > 0;
        next if(!$zero && $d==0);
        $needs{$r->{'ctype'}}=0 if not exists $needs{$r->{'ctype'}};
        $needs{$r->{'ctype'}} += $d unless $d < 0;
    }
    $r->{'percent'}=sprintf("%d", $r->{'percent'}*100);

    push @comos, $r;
}

my @needs;
foreach my $k (sort keys %needs) {
    next if(!$zero && $needs{$k}==0);
    push @needs, {'ctype' => $k, amt => $needs{$k}, available => $available{$k} || 0};
}

$tmpl->param(comos => \@comos, needs => \@needs, zero => $zero);
output($tmpl->output);

sub output($) {
    my $o = $tmpl->output;
    $o=~s/\s+/ /gs;
    print $o;
    exit;
}

sub production($) {
    my $r=shift;
    my $c = $r->{'ctype'};
    my $fac = $r->{'name'};
    my %lookup=(
        'fuel collector' => {'Hydrogen Fuel' => 30},
        'gas collector' => {'Nebula Gas' => 20},
        'space farm' => {Food => 8, water => 2, 'bio-waste' => 1},
        'chemical laboratory' => {'chemical supplies' => 9},
        'asteroid mine' => {ore => 9, 'gem stones' => 2},
        'radiation collector' => {'radioactive cells' => 6},
        'medical laboratory' => {'medicines' => 4},
        'brewery' => {'liquor' => 4},
        'plastics facility' => {'heavy plastics' => 6},
        'smelting facility' => {metal => 1},
        'optics research center' => {'optical components' => 10},
        'slave camp' => {'slaves' => 3},
        'electronics facility' => {'electronics' => 6},
        'recyclotron' => {food => 7, water => 5},
        'clod generator' => {'nutrient clods' => 5},
        'nebula plant' => {'energy' => 35, 'nebula gas' => 4},
        'drug station' => {'drugs' => 1},
        'dark dome' => {'bio-waste' => 4},
        'handweapons factory' => {'hand weapons' => 2},
        'battleweapons factory' => {'battleweapon parts' => 4},
        'droid assembly complex' => {'droid modules' => 1},
        'leech nursery' => {'leech baby' => 1, 'bio-waste' => 3},
    );

    foreach my $k (keys %lookup) {
        if(lc($fac)=~/$k/) {
            my $comos = $lookup{$k};
            foreach my $como (keys %{ $comos }) {
                if(lc($c) eq lc($como)) {
                    return $comos->{$como};
                }
            }
        }
    }
    return 0;
} # production
