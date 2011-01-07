#!/usr/bin/perl
use strict;
use warnings;
#use FCGI;
use DBI;
use XML::LibXML;
use Data::Dumper;
use lib '../fcgi/';
require 'dbconfig.pl';
require 'tables.pl';

sub XMLin($);
our $dbh;
our %universes;

local $/;
my $data=<STDIN>;
warn $data;
my $bldgs=XMLin($data);

my $sthsector=$dbh->prepare('SELECT id from `sectors` where `cluster_id` in (select id from `clusters` where `universe_id`=?) and `name`=?');
my $sthbldg=$dbh->prepare('SELECT id from `buildings` where `sector_id`=? and `x`=? and `y`=?');
my $sthbldgupdate=$dbh->prepare('update `buildings` set `free`=?, `name`=?, `creds`=?, `updated_at`=NOW() where id=?');
my $sthbldginsert=$dbh->prepare('INSERT INTO `buildings` (`sector_id`,`x`,`y`) VALUES (?,?,?)');
my $sthcomodelete=$dbh->prepare('DELETE FROM `comos` WHERE `building_id`=?');
my $sthcomoinsert=$dbh->prepare('INSERT INTO `comos` (`building_id`, `ctype`, `min`, `max`, `buy`,`sell`,`amount`) VALUES (?,?,?,?,?,?,?)');

sub get_building_id($$) {
    my $attrs=shift;
    my $sector_id=shift;
    my @attrs=($sector_id, $attrs->{'x'}, $attrs->{'y'});
    $sthbldg->execute(@attrs);
    my $building_id;
    while(my $r=$sthbldg->fetchrow_hashref) {
        $building_id=$r->{'id'};
    }
    unless ($building_id) {
        $sthbldginsert->execute(@attrs);
        my $sth=$dbh->prepare('SELECT LAST_INSERT_ID()');
        $sth->execute();
        while(my $r=$sth->fetchrow_arrayref) {
            $building_id=$r->[0];
        }
    }
    return $building_id;
} # get_building_id

my @buildings;
warn $#$bldgs;
# Only take the last occurence of a building in the data. Based on uni, sec, x, y.
my %seen=();
foreach my $bldg (reverse @$bldgs) {
    my $attrs = $bldg->{'attrs'};
    my $sector=$attrs->{'sec'};
    my $uni=$attrs->{'uni'};
    my $x=$attrs->{'x'};
    my $y=$attrs->{'y'};
    $sector=~s/[^-_0-9A-Za-z]//g;
    my $key="$uni|$sector|$x|$y";
    next if exists $seen{$key};
    $seen{$key}=1;
    push @buildings, $bldg;
}
warn $#buildings;


foreach my $bldg (@buildings) {
    my $attrs = $bldg->{'attrs'};
    my $sec=$attrs->{'sec'};
    $sec=~s/[^-_0-9A-Za-z]//g;
    my $sector_id;
    $sthsector->execute( $universes{$attrs->{'uni'}}, $sec);
    while(my $r=$sthsector->fetchrow_hashref) {
        $sector_id=$r->{'id'};
    }
    unless ($sector_id) {
        warn $data;
        warn Dumper($bldgs);
        warn "no sector id";
        next;
    }
    my $building_id=get_building_id($attrs, $sector_id);
    unless ($building_id) {
        warn $data;
        warn Dumper($bldgs);
        warn "no building id";
        next;
    }
    $sthbldgupdate->execute($attrs->{'free'}, $attrs->{'name'}, $attrs->{'creds'}, $building_id);
    $sthcomodelete->execute($building_id);
    #warn Dumper($bldg->{'comos'});
    foreach my $c (@{ $bldg->{'comos'} }) {
        #warn "$c->{'type'} inserted\n";
        $sthcomoinsert->execute($building_id, $c->{'type'}, $c->{'min'}, $c->{'max'}, $c->{'buy'}, $c->{'sell'}, $c->{'amt'});
    }
} # foreach building

print "Content-type: text/plain\n\n<OK />\n";


#my $foo=<<ETXT;
#<pbs_update>
#<bldg uni="orion" sec="Fawaol" x="15" y="3" name="Craven's Asteroid Mine" creds="1,936,261" free="0" >
#<c type="Food" amt="26" min="100" max="50" sell="100" buy="9999" />
#<c type="Energy" amt="34" min="100" max="50" sell="30" buy="9999" />
#<c type="Water" amt="12" min="100" max="50" sell="80" buy="9999" />
#<c type="Ore" amt="272" min="24" max="0" sell="0" buy="120" />
#<c type="Gem stones" amt="56" min="0" max="0" sell="0" buy="80" />
#</bldg>
#</pbs_update>
#ETXT

sub XMLin($) {
    my $file = shift;
    my $parser=new XML::LibXML;
    my $doc=$parser->parse_string($file);

    my $elems = $doc->documentElement;

    my @snapshots = $elems->findnodes('//pbs_update/bldg');
    my @attrs=qw(uni sec x y name creds free);
    my @buildings;
    foreach my $snap (@snapshots) {
        my $q={};
        foreach($snap->attributes) {
            foreach my $attr (@attrs) {
                $q->{$attr} = $_->value if $_->name eq $attr;
            }
        }
        $q->{'creds'}=~s/,//g;
        my @comos=como2hash($snap->getChildrenByTagName('c'));
        push @buildings, {attrs => $q, comos => \@comos};
        #@{ $sectors->{$uni}->{$x}->{$y}->{'comos'} }, @comos);
    }
    return \@buildings;

} # XMLin


sub como2hash() {
    my @nodes=@_;
    my @ret;
    foreach my $c (@nodes) {
        my $attrs={};
        foreach my $attr ($c->attributes) {
            $attrs->{$attr->name}=$attr->value;
        }
        push(@ret, $attrs);
    }
    return @ret;
} # como2hash


