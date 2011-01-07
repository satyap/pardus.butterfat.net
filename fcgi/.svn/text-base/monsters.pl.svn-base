#!/usr/bin/perl
use strict;
use warnings;

#use HTML::Template;
use DBI;
use CGI;
use Data::Dumper;
require 'dbconfig.pl';
require 'tables.pl';

our %monsters;
our $dbh;

my $q=new CGI;
exit unless $q->param('q') eq '789789789';

my @patterns=(
    'opponents/stheno_swarmlings.png',
    'opponents/energybees.png',
    'opponents/energy_sparker.png',
    'opponents/euryale_swarmlings.png',
);

print "Content-type: text/plain\n\n";

my $sth=$dbh->prepare('SELECT * FROM `sectors` ORDER BY `cluster_id`,`name`');
$sth->execute;

my $sthmons = $dbh->prepare('SELECT * FROM `tiles` WHERE `sector_id`=? AND `foreground`=? ORDER BY `ts`');

my %results;
while(my $s=$sth->fetchrow_hashref) {
    foreach my $mon (@patterns) {
        $sthmons->execute($s->{'id'}, $mon);
        $results{$mon}=() unless exists $results{$mon};
        while(my $r = $sthmons->fetchrow_hashref) {
            push @{ $results{$mon} }, $s->{'name'}.'['. $r->{'x'}.','.
            $r->{'y'} .'] at '.$r->{'ts'};
        }
    }
}

foreach my $k (keys %results) {
    $results{$k} = [sort (@{ $results{$k} })];
}

print Dumper(\%results);
